import nodemailer from "nodemailer";
import constants from "../constants/index.js";
import { renderEmailTemplate } from "../utils/render-template.util.js";

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendOTPEmail(email, otp) {
    const expiryMinutes = Math.floor(constants.OTP.EXPIRY / 60);
    const html = await renderEmailTemplate("otp-login.html", {
      OTP: otp,
      EXPIRY_MINUTES: expiryMinutes,
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Login OTP",
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending OTP email:", error);
      throw new InternalServerError("failed to send OTP email");
    }
  }
}

export const emailService = new EmailService();
