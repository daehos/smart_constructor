import CronParser from "cron-parser";
import { z } from "zod";
import { config } from "../configs/env.js";
import constants from "../constants/index.js";
import { BadRequestError, NotFoundError, ValidationError } from "../errors/index.js";
import Schedule from "../models/schedule.model.js";
import { scheduleQueue } from "../queues/schedule/schedule.queue.js";
import {
  createScheduleValidation,
  listScheduleValidation,
  updateScheduleValidation,
} from "../validations/schedule.validation.js";

function computeNextRunAt(cron, timezone) {
  try {
    const interval = CronParser.parseExpression(cron, {
      tz: timezone,
      currentDate: new Date(),
    });
    return interval.next().toDate();
  } catch {
    return null;
  }
}

export default class ScheduleService {
  static async create(body, userId) {
    const parsed = createScheduleValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const data = parsed.data;
    const timezone = data.timezone ?? config.whatsapp.defaultTz;

    if (data.kind === "oneshot") {
      const scheduledAt = new Date(data.scheduledAt);
      if (scheduledAt <= new Date()) {
        throw new BadRequestError({ message: "scheduledAt must be in the future." });
      }

      const schedule = await Schedule.create({
        user: userId,
        channel: "whatsapp",
        kind: "oneshot",
        to: data.to,
        body: data.body,
        timezone,
        scheduledAt,
        nextRunAt: scheduledAt,
        status: "pending",
      });

      const delay = scheduledAt.getTime() - Date.now();
      const job = await scheduleQueue.add(
        constants.JOBS.SEND_WHATSAPP,
        { scheduleId: schedule._id.toString() },
        { jobId: schedule._id.toString(), delay },
      );

      schedule.bullJobId = job.id;
      await schedule.save();

      return schedule;
    }

    // recurring
    let nextRunAt = computeNextRunAt(data.cron, timezone);

    const schedule = await Schedule.create({
      user: userId,
      channel: "whatsapp",
      kind: "recurring",
      to: data.to,
      body: data.body,
      timezone,
      cron: data.cron,
      nextRunAt,
      status: "active",
    });

    const job = await scheduleQueue.add(
      constants.JOBS.SEND_WHATSAPP,
      { scheduleId: schedule._id.toString() },
      {
        repeat: { pattern: data.cron, tz: timezone },
        jobId: schedule._id.toString(),
      },
    );

    schedule.bullRepeatKey = job.repeatJobKey ?? null;
    await schedule.save();

    return schedule;
  }

  static async list(query, userId) {
    const parsed = listScheduleValidation.safeParse(query);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const { page, limit, status, kind } = parsed.data;
    const filter = { user: userId };
    if (status) filter.status = status;
    if (kind) filter.kind = kind;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Schedule.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Schedule.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  static async getById(id, userId) {
    const schedule = await Schedule.findOne({ _id: id, user: userId }).lean();
    if (!schedule) {
      throw new NotFoundError({ details: "Schedule not found" });
    }
    return schedule;
  }

  static async update(id, userId, body) {
    const parsed = updateScheduleValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const schedule = await Schedule.findOne({ _id: id, user: userId });
    if (!schedule) {
      throw new NotFoundError({ details: "Schedule not found" });
    }

    if (schedule.status === "cancelled" || schedule.status === "sent") {
      throw new BadRequestError({
        message: `Cannot update a schedule with status '${schedule.status}'.`,
      });
    }

    const data = parsed.data;
    const timezone = data.timezone ?? schedule.timezone;

    if (data.body) schedule.body = data.body;
    if (data.timezone) schedule.timezone = timezone;

    const rescheduling =
      (schedule.kind === "oneshot" && data.scheduledAt) ||
      (schedule.kind === "recurring" && data.cron);

    if (rescheduling) {
      // Remove old BullMQ entry
      if (schedule.kind === "oneshot" && schedule.bullJobId) {
        try {
          const oldJob = await scheduleQueue.getJob(schedule.bullJobId);
          await oldJob?.remove();
        } catch {
          // best-effort
        }
      } else if (schedule.kind === "recurring" && schedule.bullRepeatKey) {
        try {
          await scheduleQueue.removeRepeatableByKey(schedule.bullRepeatKey);
        } catch {
          // best-effort
        }
      }

      if (schedule.kind === "oneshot") {
        const scheduledAt = new Date(data.scheduledAt);
        if (scheduledAt <= new Date()) {
          throw new BadRequestError({ message: "scheduledAt must be in the future." });
        }
        schedule.scheduledAt = scheduledAt;
        schedule.nextRunAt = scheduledAt;

        const delay = scheduledAt.getTime() - Date.now();
        const job = await scheduleQueue.add(
          constants.JOBS.SEND_WHATSAPP,
          { scheduleId: schedule._id.toString() },
          { jobId: `${schedule._id}-${Date.now()}`, delay },
        );
        schedule.bullJobId = job.id;
        schedule.status = "pending";
      } else {
        schedule.cron = data.cron;
        schedule.nextRunAt = computeNextRunAt(data.cron, timezone);

        const job = await scheduleQueue.add(
          constants.JOBS.SEND_WHATSAPP,
          { scheduleId: schedule._id.toString() },
          {
            repeat: { pattern: data.cron, tz: timezone },
            jobId: `${schedule._id}-${Date.now()}`,
          },
        );
        schedule.bullRepeatKey = job.repeatJobKey ?? null;
      }
    }

    await schedule.save();
    return schedule;
  }

  static async cancel(id, userId) {
    const schedule = await Schedule.findOne({ _id: id, user: userId });
    if (!schedule) {
      throw new NotFoundError({ details: "Schedule not found" });
    }

    if (schedule.status === "cancelled") {
      throw new BadRequestError({ message: "Schedule is already cancelled." });
    }

    if (schedule.kind === "oneshot" && schedule.bullJobId) {
      try {
        const job = await scheduleQueue.getJob(schedule.bullJobId);
        await job?.remove();
      } catch {
        // best-effort
      }
    } else if (schedule.kind === "recurring" && schedule.bullRepeatKey) {
      try {
        await scheduleQueue.removeRepeatableByKey(schedule.bullRepeatKey);
      } catch {
        // best-effort
      }
    }

    schedule.status = "cancelled";
    await schedule.save();
    return schedule;
  }
}
