import nodemailer from "nodemailer";
import {
  getRegistrationOtpEmailTemplate,
  getForgotPasswordOtpEmailTemplate,
} from "./templates/otp-email.template";

export const emailService = {
  getTransporter() {
    const host = process.env.EMAIL_HOST;
    const portStr = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (
      !host ||
      !user ||
      !pass ||
      host.includes("your-") ||
      user.includes("your-") ||
      pass.includes("your-")
    ) {
      return null;
    }

    const port = Number(portStr) || 587;
    const secure = port === 465; // false for 587 / Brevo

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 4000,
      socketTimeout: 4000,
    });
  },

  async sendOtpEmail(
    to: string,
    otp: string,
    purpose: "register" | "reset_password" = "register"
  ): Promise<boolean> {
    const { subject, html, text } =
      purpose === "register"
        ? getRegistrationOtpEmailTemplate(otp)
        : getForgotPasswordOtpEmailTemplate(otp);

    const from =
      process.env.EMAIL_FROM ||
      `Rithu Snacks <${process.env.EMAIL_USER || "noreply@rithusnacks.com"}>`;

    const transporter = this.getTransporter();

    if (!transporter) {
      console.warn(
        `[EMAIL SERVICE] SMTP is not configured; ${purpose} OTP email was not sent.`
      );
      return false;
    }

    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      return true;
    } catch (error) {
      console.error("[EMAIL SERVICE] Error sending email:", error);
      return false;
    }
  },
};
