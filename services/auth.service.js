import { z } from "zod";
import constants from "../constants/index.js";
import { BadRequestError, ValidationError } from "../errors/index.js";
import User from "../models/user.model.js";
import { otpQueue } from "../queues/otp/otp.queue.js";
import { comparePassword, hashPassword } from "../utils/bcrypt.util.js";
import { signToken } from "../utils/jwt.util.js";
import {
  loginValidation,
  registerValidation,
} from "../validations/user.validation.js";
import { otpService } from "./otp.service.js";

export default class AuthService {
  // Step 1: Validasi data & kirim OTP
  static async register(body) {
    const parsed = registerValidation.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError({
        details: z.flattenError(parsed.error).fieldErrors,
      });
    }

    const { email } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError({
        details: "email already exists",
      });
    }

    const otp = otpService.generateOTP();

    await otpQueue.add(constants.JOBS.SEND_OTP, { email, otp });

    return { message: "user has been registered, please verify your email" };
  }

  // Step 2: Verifikasi OTP & simpan user
  static async verifyRegisterOTP(body) {
    const { otp, ...userData } = body;

    if (!otp) {
      throw new Error(JSON.stringify({ otp: ["OTP is required"] }));
    }

    const parsed = registerValidation.safeParse(userData);
    if (!parsed.success) {
      throw new Error(JSON.stringify(parsed.error.flatten().fieldErrors));
    }

    const { email } = parsed.data;

    const isValidOTP = await otpService.verifyOTP(email, otp);
    console.log(isValidOTP);
    if (!isValidOTP) {
      throw new Error(JSON.stringify({ otp: ["Invalid or expired OTP"] }));
    }

    const newUser = await User.create({
      ...parsed.data,
      password: hashPassword(parsed.data.password),
    });

    const access_token = signToken({ id: newUser._id });

    return {
      access_token,
      token_type: "Bearer",
      user: {
        id: newUser._id.toString(),
        nama: newUser.nama,
        email: newUser.email,
        role: newUser.role,
      },
    };
  }

  // Login Flow

  static async login(credentials) {
    const parsed = loginValidation.safeParse(credentials);

    if (!parsed.success) {
      throw new Error(JSON.stringify(parsed.error.flatten().fieldErrors));
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Invalid email/password");
    }

    const isValidatePassword = comparePassword(password, user.password);
    if (!isValidatePassword) {
      throw new Error("Invalid email/password");
    }
    try {
      // Generate and send OTP
      const email = user.email;
      await otpService.sendOTP(email, { delivery: "async" });

      return {
        message: "OTP has been sent to your email",
        email: user.email,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error("Failed to send OTP. Please try again later.");
      }
      throw error;
    }
  }
}
