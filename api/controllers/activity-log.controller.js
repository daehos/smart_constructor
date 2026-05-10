import { listLogs, listMyLogs } from "../services/activity-log.service.js";

export default class ActivityLogController {
  static async list(req, res, next) {
    try {
      const result = await listLogs(req.query);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async listMe(req, res, next) {
    try {
      const result = await listMyLogs(req.query, req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
}
