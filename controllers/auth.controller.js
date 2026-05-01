import AuthService from "../services/auth.service.js";

export default class AuthController {
  static async register(req, res) {
    try {
      const result = await AuthService.register(req.body);
      res.status(200).json({
        status: "success",
        // message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message);
          return res.status(400).json({
            status: "error",
            message: "Validation error",
            data: errorData,
          });
        } catch {
          return res.status(500).json({
            status: "error",
            message: "Error during register",
          });
        }
      }
      return res.status(500).json({
        status: "error",
        message: "Error during register",
      });
    }
  }
}
