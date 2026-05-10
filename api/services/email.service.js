import nodemailer from "nodemailer";
import constants from "../constants/index.js";
import { config } from "../configs/env.js";
import { InternalServerError } from "../errors/index.js";
import { renderEmailTemplate } from "../utils/render-template.util.js";

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  async sendOTPEmail(email, otp) {
    const emailUser = config.email.user;
    const emailPass = config.email.password;
    if (!emailUser || !emailPass) {
      console.error(
        "[email] EMAIL_USER and EMAIL_PASSWORD must be set in env (see api/configs/env.js / api/.env).",
      );
      throw new InternalServerError({
        message: "Email is not configured (missing EMAIL_USER or EMAIL_PASSWORD)",
      });
    }

    const expiryMinutes = Math.floor(constants.OTP.EXPIRY / 60);
    const html = await renderEmailTemplate("otp-login.html", {
      OTP: otp,
      EXPIRY_MINUTES: expiryMinutes,
    });

    const mailOptions = {
      from: emailUser,
      to: email,
      subject: "Your Login OTP",
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      const cause =
        error?.message ??
        error?.response ??
        (typeof error === "string" ? error : "unknown transport error");
      const details = {
        cause: String(cause),
        code: error?.code,
        command: error?.command,
        responseCode: error?.responseCode,
      };
      console.error("[email] sendMail failed:", details, error);
      throw new InternalServerError({
        message: `failed to send OTP email: ${String(cause)}`,
        details,
      });
    }
  }
}

export const emailService = new EmailService();
