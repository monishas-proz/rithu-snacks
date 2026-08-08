import { db } from "@/lib/db/prisma";

export const otpRepository = {
  async deleteByEmail(email: string) {
    return db.passwordResetOtp.deleteMany({
      where: { email },
    });
  },

  async deleteExpired() {
    return db.passwordResetOtp.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  },

  async create(data: { email: string; otpHash: string; expiresAt: Date }) {
    return db.passwordResetOtp.create({
      data,
    });
  },

  async findLatestByEmail(email: string) {
    return db.passwordResetOtp.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });
  },

  async incrementAttempts(id: number) {
    return db.passwordResetOtp.update({
      where: { id },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });
  },
};
