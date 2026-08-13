import nodemailer from "nodemailer";
import { getOtpEmailTemplate } from "./templates/otp-email.template";

export const emailService = {
  getTransporter() {
    const host = process.env.EMAIL_HOST;
    const portStr = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!host || !user || !pass || host.includes("your-") || user.includes("your-") || pass.includes("your-")) {
      return null;
    }

    const port = Number(portStr) || 587;
    const secure = port === 465; // false for 587 / Brevo

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  },

  async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    const { subject, html, text } = getOtpEmailTemplate(otp);
    const from = process.env.EMAIL_FROM || `Rithu Snacks <${process.env.EMAIL_USER || "noreply@rithusnacks.com"}>`;

    const transporter = this.getTransporter();

    if (!transporter) {
      console.log(`[EMAIL SERVICE] (DEV MODE - No SMTP configured) OTP for ${to}: ${otp}`);
      return true;
    }

    try {
      await transporter.verify();
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
      console.log(`[EMAIL SERVICE] (FALLBACK) OTP for ${to}: ${otp}`);
      return false;
    }
  },
};
