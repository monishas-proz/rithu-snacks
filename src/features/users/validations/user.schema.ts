import { z } from "zod";

/* ----------------------------- Query Schema ----------------------------- */

export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  roleId: z.coerce.number().int().positive().optional(),
});

export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;

/* --------------------------- Mobile Validation -------------------------- */

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "Mobile number must be exactly 10 digits")
  .regex(
    /^[6-9]/,
    "Mobile number must start with 6, 7, 8, or 9"
  )
  .refine(
    (value) => !/(\d)\1{4,}/.test(value),
    {
      message:
        "The same digit cannot be repeated more than 4 times consecutively",
    }
  );

/* --------------------------- Create User Schema ------------------------- */

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Full name must contain at least 3 characters")
    .max(255, "Full name must be less than 255 characters"),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),

  phone: phoneSchema,

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters"),

  roleId: z
    .number()
    .int()
    .positive("Please select a valid role")
    .optional(),

  status: z.enum(["active", "inactive", "banned"]).optional(),
});

export type CreateUserSchemaInput = z.infer<typeof createUserSchema>;

/* --------------------------- Update User Schema ------------------------- */

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .partial();

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type ResetPasswordSchemaInput = z.infer<typeof resetPasswordSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number must be less than 15 digits")
      .regex(/^\+?[\d\s-]+$/, "Please enter a valid phone number"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateUserSchemaInput = z.infer<typeof updateUserSchema>;
