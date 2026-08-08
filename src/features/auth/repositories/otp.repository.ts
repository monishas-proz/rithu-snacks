import { db } from "@/lib/db/prisma";

export const otpRepository = {
  async deleteByEmail(email: string) {
    return db.otp_verifications.deleteMany({
      where: {
        identifier: email,
        purpose: "reset_password",
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

  async create(data: { email: string; otpCode: string; expiresAt: Date }) {
    return db.otp_verifications.create({
      data: {
        identifier: data.email,
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
        identifier: email,
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
      attempts: 0,
    };
  },

  async incrementAttempts(_id: bigint | number) {
    return null;
  },
};
