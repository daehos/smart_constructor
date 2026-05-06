import { randomInt } from "crypto";
import { redis } from "../configs/redis.config.js";
import { emailService } from "./email.service.js";

class OTPService {
  constructor() {
    this.OTP_PREFIX = "otp:";
    this.OTP_EXPIRY = 300; // 5 minutes in seconds
  }

  generateOTP() {
    return randomInt(100000, 999999).toString();
  }

  async sendOTP(email) {
    const otp = this.generateOTP();
    const otpData = {
      email,
      otp,
      expiresAt: new Date(Date.now() + this.OTP_EXPIRY * 1000),
    };

    const key = `${this.OTP_PREFIX}${email}`;
    await redis.SETEX(key, this.OTP_EXPIRY, JSON.stringify(otpData));

    await emailService.sendOTPEmail(email, otp);
    return otp;
  }

  async getEmailOTP(email) {
    const key = `${this.OTP_PREFIX}${email}`;
    const data = await redis.get(key);

    if (!data) return null;

    return JSON.parse(data);
  }

  async verifyOTP(email, otp) {
    const otpData = await this.getEmailOTP(email);

    if (!otpData) return false;

    if (new Date(otpData.expiresAt) < new Date()) {
      await this.deleteOTP(email);
      return false;
    }

    if (otpData.otp !== otp) return false;

    await this.deleteOTP(email);
    return true;
  }

  async deleteOTP(email) {
    const key = `${this.OTP_PREFIX}${email}`;
    await redis.del(key);
  }
}

export const otpService = new OTPService();
