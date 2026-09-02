import { z } from "zod";

const parseDateString = z
  .string()
  .trim()
  .refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  })
  .transform((val) => new Date(val));

export const createBannerSchema = z
  .object({
    bannerPositionId: z
      .string({ message: "Banner position ID is required" })
      .uuid("Invalid banner position UUID"),
    title: z
      .string()
      .trim()
      .max(150, "Title cannot exceed 150 characters")
      .nullable()
      .optional(),
    imageUrl: z
      .string({ message: "Image URL is required" })
      .trim()
      .min(1, "Image URL is required")
      .max(500, "Image URL cannot exceed 500 characters"),
    linkUrl: z
      .string()
      .trim()
      .max(500, "Link URL cannot exceed 500 characters")
      .nullable()
      .optional(),
    sortOrder: z
      .number()
      .int("Sort order must be an integer")
      .min(0, "Sort order cannot be negative")
      .max(100, "Sort order cannot exceed 100")
      .default(0),
    isActive: z.boolean().default(true),
    startsAt: parseDateString.nullable().optional(),
    endsAt: parseDateString.nullable().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return data.startsAt.getTime() <= data.endsAt.getTime();
      }
      return true;
    },
    {
      message: "startsAt must be before or equal to endsAt",
      path: ["endsAt"],
    }
  );

export type CreateBannerInput = z.infer<typeof createBannerSchema>;

export const updateBannerSchema = z
  .object({
    bannerPositionId: z
      .string()
      .uuid("Invalid banner position UUID")
      .optional(),
    title: z
      .string()
      .trim()
      .max(150, "Title cannot exceed 150 characters")
      .nullable()
      .optional(),
    imageUrl: z
      .string()
      .trim()
      .min(1, "Image URL cannot be empty")
      .max(500, "Image URL cannot exceed 500 characters")
      .optional(),
    linkUrl: z
      .string()
      .trim()
      .max(500, "Link URL cannot exceed 500 characters")
      .nullable()
      .optional(),
    sortOrder: z
      .number()
      .int("Sort order must be an integer")
      .min(0, "Sort order cannot be negative")
      .max(100, "Sort order cannot exceed 100")
      .optional(),
    isActive: z.boolean().optional(),
    startsAt: parseDateString.nullable().optional(),
    endsAt: parseDateString.nullable().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return data.startsAt.getTime() <= data.endsAt.getTime();
      }
      return true;
    },
    {
      message: "startsAt must be before or equal to endsAt",
      path: ["endsAt"],
    }
  );

export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;

export const bannerListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    bannerPositionId: z.string().uuid("Invalid banner position UUID").optional(),
    positionSlug: z.string().trim().optional(),
    isActive: z
      .preprocess((val) => {
        if (val === "true" || val === true) return true;
        if (val === "false" || val === false) return false;
        return undefined;
      }, z.boolean().optional())
      .optional(),
    sortBy: z
      .enum([
        "createdAt",
        "updatedAt",
        "title",
        "sortOrder",
        "startsAt",
        "endsAt",
      ])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type BannerListQueryInput = z.infer<typeof bannerListQuerySchema>;

export const bannerUuidParamSchema = z
  .object({
    uuid: z.string().uuid("Invalid banner UUID"),
  })
  .strict();

export const customerBannerQuerySchema = z
  .object({
    position: z.string().trim().min(1).optional(),
    page: z.string().trim().optional(),
  })
  .strict();

export type CustomerBannerQueryInput = z.infer<
  typeof customerBannerQuerySchema
>;
