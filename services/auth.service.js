import User from "../models/user.model.js";
import { hashPassword } from "../utils/bcrypt.util.js";
import { registerValidation } from "../validations/user.validation.js";

export default class AuthService {
  static async register(user) {
    const parsed = registerValidation.safeParse(user);
    if (!parsed.success) {
      throw new Error(JSON.stringify(parsed.error.flatten().fieldErrors));
    }
    const validatedData = parsed.data;
    const hashedPassword = hashPassword(validatedData.password);

    const { email } = validatedData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error(JSON.stringify({ email: ["Email already exists"] }));
    }

    const newUser = new User({
      ...validatedData,
      password: hashedPassword,
    });
    return newUser.save();
  }
}
