import { randomInt } from "crypto";
import { defaultRedisClient } from "../configs/redis.config.js";

class OTPService {
  generateOTP() {
    return randomInt(100000, 999999).toString();
  }

  async getEmailOTP(email) {
    const key = `${this.OTP_PREFIX}${email}`;
    const data = await defaultRedisClient.get(key);

    if (!data) return null;

    return JSON.parse(data);
  }

  async verifyOTP(email, otp) {
    const storedOTP = await defaultRedisClient.get(`otp:${email}`);

    if (!storedOTP)
      return {
        ok: false,
        reason: "expired",
      };

    if (storedOTP !== otp) {
      return { ok: false, reason: "invalid" };
    }

    await this.deleteOTP(email);
    return { ok: true };
  }

  async deleteOTP(email) {
    const key = `${this.OTP_PREFIX}${email}`;
    await defaultRedisClient.del(key);
  }
}

export const otpService = new OTPService();
