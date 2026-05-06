import WorkerService from "../services/worker.service.js";

export default class WorkerController {
  static async list(req, res, next) {
    try {
      const result = await WorkerService.list(req.query);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const result = await WorkerService.getById(req.params.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const result = await WorkerService.create(req.body);
      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const result = await WorkerService.update(req.params.id, req.body);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await WorkerService.delete(req.params.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
}
