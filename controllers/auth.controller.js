import AuthService from "../services/auth.service.js";

export default class AuthController {
  static async register(req, res) {
    try {
      const result = await AuthService.register(req.body);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      try {
        const errorData = JSON.parse(error.message);
        return res.status(400).json({
          status: "error",
          message: "Validation error",
          data: errorData,
        });
      } catch {
        return res
          .status(500)
          .json({ status: "error", message: error.message });
      }
    }
  }

  static async verifyRegisterOTP(req, res) {
    try {
      const result = await AuthService.verifyRegisterOTP(req.body);
      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      try {
        const errorData = JSON.parse(error.message);
        return res.status(400).json({
          status: "error",
          message: "Validation error",
          data: errorData,
        });
      } catch {
        return res
          .status(500)
          .json({ status: "error", message: error.message });
      }
    }
  }

  static async login(req, res) {
    try {
      const result = await AuthService.login(req.body);
      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      try {
        const errorData = JSON.parse(error.message);
        return res.status(400).json({
          status: "error",
          message: "Validation error",
          data: errorData,
        });
      } catch {
        return res
          .status(500)
          .json({ status: "error", message: error.message });
      }
    }
  }
}
