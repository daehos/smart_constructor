export default class UserController {
  static async getProfile(req, res, next) {
    try {
      const result = await UserService.getProfile(req.user.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
}
