import { z } from "zod";

export const createBannerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  image: z.string().min(1, "Image is required"),
  link: z.string().optional(),
  position: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const updateBannerSchema = createBannerSchema.partial();

export const getBannersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

export type CreateBannerSchema = z.infer<typeof createBannerSchema>;
export type UpdateBannerSchema = z.infer<typeof updateBannerSchema>;
export type GetBannersQuerySchema = z.infer<typeof getBannersQuerySchema>;
