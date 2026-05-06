import { z } from "zod";
import { NotFoundError, ValidationError } from "../errors/index.js";
import Worker from "../models/worker.model.js";
import {
  createWorkerValidation,
  listWorkerValidation,
  updateWorkerValidation,
} from "../validations/worker.validation.js";

async function generateWorkerCode() {
  const count = await Worker.countDocuments({});
  const seq = String(count + 1).padStart(3, "0");
  return `WORK-${seq}`;
}

export default class WorkerService {
  static async list(query) {
    const parsed = listWorkerValidation.safeParse(query);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const { q, keahlian, page, limit } = parsed.data;
    const filter = { deletedAt: null };

    if (q) {
      filter.nama = { $regex: q, $options: "i" };
    }
    if (keahlian) {
      filter.keahlian = { $elemMatch: { $regex: keahlian, $options: "i" } };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Worker.find(filter)
        .select("-password -__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Worker.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  static async getById(id) {
    const worker = await Worker.findOne({ _id: id, deletedAt: null });
    if (!worker) {
      throw new NotFoundError({ details: "Worker tidak ditemukan" });
    }
    return worker;
  }

  static async create(body) {
    const parsed = createWorkerValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const data = parsed.data;
    const kodeWorker = await generateWorkerCode();

    return Worker.create({
      ...data,
      kodeWorker,
      tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : null,
    });
  }

  static async update(id, body) {
    const parsed = updateWorkerValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
    }

    const worker = await Worker.findOne({ _id: id, deletedAt: null });
    if (!worker) {
      throw new NotFoundError({ details: "Worker tidak ditemukan" });
    }

    const data = parsed.data;
    Object.assign(worker, {
      ...data,
      tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : worker.tanggalLahir,
    });
    return worker.save();
  }

  static async delete(id) {
    const worker = await Worker.findOne({ _id: id, deletedAt: null });
    if (!worker) {
      throw new NotFoundError({ details: "Worker tidak ditemukan" });
    }
    worker.deletedAt = new Date();
    await worker.save();
    return { message: "Worker berhasil dihapus" };
  }
}
