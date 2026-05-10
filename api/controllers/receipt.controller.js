import ReceiptService from "../services/receipt.service.js";

export default class ReceiptController {
  static async create(req, res, next) {
    try {
      const result = await ReceiptService.create(req.file, req.user.id);
      res.status(202).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const result = await ReceiptService.list(req.query, req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const result = await ReceiptService.getById(req.params.id, req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async confirm(req, res, next) {
    try {
      const result = await ReceiptService.confirm(req.params.id, req.user.id, req.body);
      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
}
