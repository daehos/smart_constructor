import PayrollService from "../services/payroll.service.js";

export default class PayrollController {
  static async list(req, res, next) {
    try {
      const result = await PayrollService.list(req.query);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const result = await PayrollService.getById(req.params.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getMyPayroll(req, res, next) {
    try {
      const result = await PayrollService.getMyPayroll(req.query, req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const result = await PayrollService.create(req.body);
      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const result = await PayrollService.update(req.params.id, req.body);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await PayrollService.delete(req.params.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async markPaid(req, res, next) {
    try {
      const result = await PayrollService.markPaid(req.params.id, req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
}
