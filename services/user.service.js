import User from "../models/user.model.js";

export default class UserService {
  static async getProfile(userId) {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new NotFoundError("user not found");
    }

    return user;
  }
}
