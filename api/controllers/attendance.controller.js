import AttendanceService from "../services/attendance.service.js";

export default class AttendanceController {
  static async getSite(req, res, next) {
    try {
      const result = AttendanceService.getSiteMeta();
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async checkLocation(req, res, next) {
    try {
      const result = await AttendanceService.checkLocation(req.body);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async clockIn(req, res, next) {
    try {
      const result = await AttendanceService.clockIn(req.body, req.user.id);
      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async clockOut(req, res, next) {
    try {
      const result = await AttendanceService.clockOut(req.body, req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getToday(req, res, next) {
    try {
      const result = await AttendanceService.getToday(req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async listMine(req, res, next) {
    try {
      const result = await AttendanceService.listMine(req.query, req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async monthCalendar(req, res, next) {
    try {
      const result = await AttendanceService.monthCalendar(req.query, req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async weekSummary(req, res, next) {
    try {
      const result = await AttendanceService.weekSummary(req.query, req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
}
