import { z } from "zod";

export const adminCustomerListSchema = z
  .object({
    page: z.number().int().min(1, "page must be at least 1").default(1),
    pageSize: z
      .number()
      .int()
      .min(1, "pageSize must be at least 1")
      .max(100, "pageSize cannot exceed 100")
      .default(20),
    search: z.string().trim().optional(),
    status: z.enum(["active", "inactive", "banned"]).optional(),
    isActive: z.boolean().optional(),
    isBlocked: z.boolean().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    isWhatsapp: z.boolean().optional(),
    emailVerified: z.boolean().optional(),
    phoneVerified: z.boolean().optional(),
    sortBy: z
      .enum(["name", "email", "createdAt", "updatedAt", "lastLoginAt", "status"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type AdminCustomerListInput = z.infer<typeof adminCustomerListSchema>;
