import { db } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma";

type DbClient = typeof db | Prisma.TransactionClient;

export const otpRepository = {
  async deleteByEmail(email: string, purpose: "reset_password" | "register" = "reset_password") {
    return db.otp_verifications.deleteMany({
      where: {
        identifier: email.toLowerCase().trim(),
        purpose,
      },
    });
  },

  async deleteExpired() {
    return db.otp_verifications.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });
  },

  async createEmailOtp(data: { email: string; otpCode: string; expiresAt: Date }) {
    const normalizedEmail = data.email.toLowerCase().trim();
    // Invalidate existing unused registration OTPs for this email
    await db.otp_verifications.updateMany({
      where: {
        identifier: normalizedEmail,
        purpose: "register",
        is_used: false,
      },
      data: {
        is_used: true,
      },
    });

    return db.otp_verifications.create({
      data: {
        identifier: normalizedEmail,
        otp_code: data.otpCode,
        purpose: "register",
        expires_at: data.expiresAt,
        is_used: false,
        is_token_used: false,
      },
    });
  },

  async findLatestValidEmailOtp(email: string) {
    const record = await db.otp_verifications.findFirst({
      where: {
        identifier: email.toLowerCase().trim(),
        purpose: "register",
        is_used: false,
      },
      orderBy: { created_at: "desc" },
    });

    if (!record) return null;

    return {
      id: record.id,
      email: record.identifier,
      otpCode: record.otp_code,
      expiresAt: record.expires_at,
      createdAt: record.created_at,
    };
  },

  async markOtpConsumedAndIssueToken(
    id: bigint,
    jti: string,
    tokenExpiresAt: Date
  ) {
    return db.otp_verifications.update({
      where: { id },
      data: {
        is_used: true,
        verification_token_hash: jti,
        token_expires_at: tokenExpiresAt,
        is_token_used: false,
      },
    });
  },

  async findValidUnusedVerificationTokenRecord(
    email: string,
    jti: string,
    tx: DbClient = db
  ) {
    const record = await tx.otp_verifications.findFirst({
      where: {
        identifier: email.toLowerCase().trim(),
        purpose: "register",
        is_used: true,
        is_token_used: false,
        verification_token_hash: jti,
        token_expires_at: {
          gt: new Date(),
        },
      },
    });

    return record;
  },

  async markVerificationTokenUsed(id: bigint, tx: DbClient = db) {
    return tx.otp_verifications.update({
      where: { id },
      data: {
        is_token_used: true,
      },
    });
  },

  // Existing methods for forgot password
  async create(data: { email: string; otpCode: string; expiresAt: Date }) {
    return db.otp_verifications.create({
      data: {
        identifier: data.email.toLowerCase().trim(),
        otp_code: data.otpCode,
        purpose: "reset_password",
        expires_at: data.expiresAt,
        is_used: false,
      },
    });
  },

  async findLatestByEmail(email: string) {
    const record = await db.otp_verifications.findFirst({
      where: {
        identifier: email.toLowerCase().trim(),
        purpose: "reset_password",
        is_used: false,
      },
      orderBy: { created_at: "desc" },
    });

    if (!record) return null;

    return {
      id: record.id,
      email: record.identifier,
      otpCode: record.otp_code,
      expiresAt: record.expires_at,
      createdAt: record.created_at,
    };
  },
};
