import ScheduleService from "../services/schedule.service.js";

export default class ScheduleController {
  static async create(req, res, next) {
    try {
      const result = await ScheduleService.create(req.body, req.user.id);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const result = await ScheduleService.list(req.query, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const result = await ScheduleService.getById(req.params.id, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const result = await ScheduleService.update(req.params.id, req.user.id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req, res, next) {
    try {
      const result = await ScheduleService.cancel(req.params.id, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
