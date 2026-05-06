import VendorService from "../services/vendor.service.js";

export default class VendorController {
  static async list(req, res, next) {
    try {
      const result = await VendorService.list(req.query);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const result = await VendorService.getById(req.params.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const result = await VendorService.create(req.body, req.user.id);
      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const result = await VendorService.update(req.params.id, req.body, req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await VendorService.delete(req.params.id, req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getMaterialPriceHistory(req, res, next) {
    try {
      const result = await VendorService.getMaterialPriceHistory(req.params.id, req.query);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getAuditHistory(req, res, next) {
    try {
      const result = await VendorService.getAuditHistory(req.params.id, req.query);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async addMaterialPrice(req, res, next) {
    try {
      const result = await VendorService.addMaterialPrice(req.params.id, req.body, req.user.id);
      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
}
