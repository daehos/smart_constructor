import { z } from "zod";
import { defaultRedisClient } from "../configs/redis.config.js";
import constants from "../constants/index.js";
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
  ValidationError,
} from "../errors/index.js";
import User from "../models/user.model.js";
import { otpQueue } from "../queues/otp/otp.queue.js";
import { comparePassword, hashPassword } from "../utils/bcrypt.util.js";
import { signToken } from "../utils/jwt.util.js";
import {
  loginValidation,
  registerOTPValidation,
  registerValidation,
} from "../validations/user.validation.js";
import { logActivity } from "./activity-log.service.js";
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

    const userKeyTtl = Math.ceil(constants.OTP.EXPIRY * 1.2);
    const userPayload = JSON.stringify({
      ...body,
      password: hashPassword(body.password),
    });

    const pipeline = defaultRedisClient.pipeline();

    pipeline.setex(`otp:${email}`, constants.OTP.EXPIRY, otp);
    pipeline.setex(`user:${email}`, userKeyTtl, userPayload);

    const pipelineResults = await pipeline.exec();

    for (const [err] of pipelineResults) {
      if (err) {
        console.error(err);

        throw new InternalServerError({
          details: "failed to register user",
        });
      }
    }

    await otpQueue.add(constants.JOBS.SEND_OTP, { email, otp });

    return { message: "register in progress, please check email for OTP code" };
  }

  static async verifyOTP(body) {
    const parsed = registerOTPValidation.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError({
        details: z.flattenError(parsed.error).fieldErrors,
      });
    }

    const { email, otp } = parsed.data;

    // Read user payload before verifyOTP deletes the otp key
    const pendingUserRaw = await defaultRedisClient.get(`user:${email}`);

    const { ok, error } = await otpService.verifyOTP(email, otp);
    if (!ok) {
      const details = error === "expired" ? "OTP expired" : "Invalid OTP";

      throw new BadRequestError({
        details,
      });
    }

    let userId = null;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      if (!pendingUserRaw) {
        throw new BadRequestError({
          details:
            "registration timeout, please retry registration from the beginning",
        });
      }

      const pendingUser = JSON.parse(pendingUserRaw);

      const user = await User.create({
        ...pendingUser,
        tanggalLahir: pendingUser.tanggalLahir
          ? new Date(pendingUser.tanggalLahir)
          : undefined,
      });

      userId = user._id;
      await defaultRedisClient.del(`user:${email}`);
    } else {
      userId = existingUser._id;
    }

    const access_token = signToken({ id: userId });

    logActivity({ actorId: userId, action: "LOGIN", resource: "User", resourceId: userId });

    return {
      access_token,
    };
  }

  static async login(credentials) {
    const parsed = loginValidation.safeParse(credentials);
    if (!parsed.success) {
      throw new ValidationError({
        details: z.flattenError(parsed.error).fieldErrors,
      });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      throw new UnauthorizedError({
        details: "invalid credentials",
      });
    }

    const isValidatePassword = comparePassword(password, user.password);
    if (!isValidatePassword) {
      throw new UnauthorizedError({
        details: "invalid credentials",
      });
    }

    try {
      const otp = otpService.generateOTP();
      await defaultRedisClient.setex(`otp:${email}`, constants.OTP.EXPIRY, otp);

      await otpQueue.add(constants.JOBS.SEND_OTP, { email, otp });

      return {
        message: "Please check your email for OTP",
        email: user.email,
      };
    } catch (error) {
      throw new InternalServerError({
        details: "failed to logged in",
      });
    }
  }
}
