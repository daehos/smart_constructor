import nodemailer from "nodemailer";

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
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Login OTP",
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Your Login OTP</h2>
                    <p>Hello,</p>
                    <p>Your One-Time Password (OTP) for login is:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
                        <h1 style="margin: 0; color: #333; letter-spacing: 5px;">${otp}</h1>
                    </div>
                    <p>This OTP will expire in 5 minutes.</p>
                    <p>If you didn't request this OTP, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
                </div>
            `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending OTP email:", error);
      throw new Error("Failed to send OTP email");
    }
  }
}

export const emailService = new EmailService();
