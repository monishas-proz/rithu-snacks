import { z } from "zod";

export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  roleId: z.coerce.number().int().positive().optional(),
});

export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().max(20).optional(),
  roleId: z.number().int().positive().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
});

export type CreateUserSchemaInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.omit({ password: true }).partial();

export type UpdateUserSchemaInput = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type ResetPasswordSchemaInput = z.infer<typeof resetPasswordSchema>;
