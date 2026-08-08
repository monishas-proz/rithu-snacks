import crypto from "crypto";
import bcrypt from "bcryptjs";
import { ApiError } from "@/lib/api/api-error";
import { userRepository } from "@/features/users/repositories/user.repository";
import { otpRepository } from "../repositories/otp.repository";
import { emailService } from "@/lib/email/email.service";
import { generateResetPasswordToken, verifyResetPasswordToken } from "@/lib/auth/jwt";
import type { ResetPasswordInput } from "@/lib/validations/auth";

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

    if (user.status !== "active") {
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
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await otpRepository.deleteByEmail(email);
    await otpRepository.create({ email, otpCode: otp, expiresAt });

    await emailService.sendOtpEmail(email, otp);

    return { message: "Verification code sent to your email." };
  },

  async resendForgotPasswordOtp(email: string) {
    await otpRepository.deleteExpired();

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.notFound("No account found with this email address");
    }

    if (user.status !== "active") {
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
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await otpRepository.deleteByEmail(email);
    await otpRepository.create({ email, otpCode: otp, expiresAt });

    await emailService.sendOtpEmail(email, otp);

    return { message: "New verification code sent to your email." };
  },

  async verifyOtp(email: string, otp: string) {
    await otpRepository.deleteExpired();

    const record = await otpRepository.findLatestByEmail(email);
    if (!record) {
      throw ApiError.badRequest("Invalid or expired verification code.");
    }

    if (new Date() > new Date(record.expiresAt)) {
      await otpRepository.deleteByEmail(email);
      throw ApiError.badRequest("Verification code has expired. Please request a new one.");
    }

    if (record.otpCode !== otp) {
      throw ApiError.badRequest("Invalid verification code.");
    }

    // OTP is single-use: Delete/invalidate immediately after successful verification
    await otpRepository.deleteByEmail(email);

    // Generate 5-minute Reset Password Token
    const resetToken = generateResetPasswordToken({ email });

    return {
      resetToken,
      message: "OTP verified successfully",
    };
  },

  async resetPassword(data: ResetPasswordInput) {
    // Verify reset password token (signature, 5m expiry, purpose)
    const payload = verifyResetPasswordToken(data.resetToken);

    const user = await userRepository.findByEmail(payload.email);
    if (!user || user.status !== "active") {
      throw ApiError.forbidden("Account is inactive, blocked, or no longer exists.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    await userRepository.resetPassword(user.id, hashedPassword);

    return { message: "Password reset successfully. You can now log in with your new password." };
  },
};
