import { NotFoundError } from "../errors/index.js";
import User from "../models/user.model.js";

export default class UserService {
  static async getProfile(userId) {
    const user = await User.findById(userId).select("-_id -password -__v -createdAt -updatedAt");
    if (!user) {
      throw new NotFoundError({
        details: "user not found",
      });
    }

    return user;
  }
}
