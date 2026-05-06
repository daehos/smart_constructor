import OrderService from "../services/order.service.js";

export default class OrderController {
  static async create(req, res, next) {
    try {
      const result = await OrderService.create(req.body, req.user.id);
      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const result = await OrderService.list(req.query, req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const result = await OrderService.getById(req.params.id, req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req, res, next) {
    try {
      const result = await OrderService.cancel(req.params.id, req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async return(req, res, next) {
    try {
      const result = await OrderService.return(req.params.id, req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async repeat(req, res, next) {
    try {
      const result = await OrderService.repeat(req.params.id, req.user.id);
      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
}
