import MaterialService from "../services/material.service.js";

export default class MaterialController {
  static async list(req, res, next) {
    try {
      const result = await MaterialService.list(req.query);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async priceComparison(req, res, next) {
    try {
      const result = await MaterialService.priceComparison(req.query);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const result = await MaterialService.getById(req.params.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const result = await MaterialService.create(req.body);
      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const result = await MaterialService.update(req.params.id, req.body);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await MaterialService.delete(req.params.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
}
