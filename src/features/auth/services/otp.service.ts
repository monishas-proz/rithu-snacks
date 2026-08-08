import crypto from "crypto";
import bcrypt from "bcryptjs";
import { ApiError } from "@/lib/api/api-error";
import { userRepository } from "@/features/users/repositories/user.repository";
import { otpRepository } from "../repositories/otp.repository";
import { emailService } from "@/lib/email/email.service";
import type { ResetPasswordWithOtpInput } from "@/lib/validations/auth";

export const otpService = {
  generateNumericOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  },

  async sendForgotPasswordOtp(email: string) {
    // Perform cleanup of expired OTP records
    await otpRepository.deleteExpired();

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.notFound("No account found with this email address");
    }

    if (user.status !== "ACTIVE") {
      throw ApiError.forbidden("Your account is inactive or blocked. Please contact support.");
    }

    const latest = await otpRepository.findLatestByEmail(email);
    if (latest) {
      const timeDiff = (Date.now() - new Date(latest.createdAt).getTime()) / 1000;
      if (timeDiff < 60) {
        const secondsRemaining = Math.ceil(60 - timeDiff);
        throw ApiError.tooManyRequests(
          `Please wait ${secondsRemaining} second(s) before requesting a new verification code.`
        );
      }
    }

    const otp = this.generateNumericOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await otpRepository.deleteByEmail(email);
    await otpRepository.create({ email, otpHash, expiresAt });

    await emailService.sendOtpEmail(email, otp);

    return { message: "Verification code sent to your email." };
  },

  async resendForgotPasswordOtp(email: string) {
    await otpRepository.deleteExpired();

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.notFound("No account found with this email address");
    }

    if (user.status !== "ACTIVE") {
      throw ApiError.forbidden("Your account is inactive or blocked. Please contact support.");
    }

    const latest = await otpRepository.findLatestByEmail(email);
    if (latest) {
      const timeDiff = (Date.now() - new Date(latest.createdAt).getTime()) / 1000;
      if (timeDiff < 60) {
        const secondsRemaining = Math.ceil(60 - timeDiff);
        throw ApiError.tooManyRequests(
          `Please wait ${secondsRemaining} second(s) before requesting a new verification code.`
        );
      }
    }

    const otp = this.generateNumericOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await otpRepository.deleteByEmail(email);
    await otpRepository.create({ email, otpHash, expiresAt });

    await emailService.sendOtpEmail(email, otp);

    return { message: "New verification code sent to your email." };
  },

  async verifyOtp(email: string, otp: string) {
    await otpRepository.deleteExpired();

    const record = await otpRepository.findLatestByEmail(email);
    if (!record) {
      throw ApiError.badRequest("Invalid or expired verification code.");
    }

    if (record.attempts >= 5) {
      await otpRepository.deleteByEmail(email);
      throw ApiError.tooManyRequests("Maximum verification attempts exceeded. Please request a new code.");
    }

    if (new Date() > new Date(record.expiresAt)) {
      await otpRepository.deleteByEmail(email);
      throw ApiError.badRequest("Verification code has expired. Please request a new one.");
    }

    const isMatch = await bcrypt.compare(otp, record.otpHash);
    if (!isMatch) {
      await otpRepository.incrementAttempts(record.id);
      const remainingAttempts = 5 - (record.attempts + 1);
      throw ApiError.badRequest(
        `Invalid verification code. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : ""}`
      );
    }

    return { message: "OTP verified successfully." };
  },

  async resetPasswordWithOtp(data: ResetPasswordWithOtpInput) {
    const user = await userRepository.findByEmail(data.email);
    if (!user || user.status !== "ACTIVE") {
      throw ApiError.forbidden("Account is inactive, blocked, or no longer exists.");
    }

    await this.verifyOtp(data.email, data.otp);

    const hashedPassword = await bcrypt.hash(data.password, 12);
    await userRepository.resetPassword(user.id, hashedPassword);

    await otpRepository.deleteByEmail(data.email);

    return { message: "Password reset successfully. You can now log in with your new password." };
  },
};
