import { z } from "zod";

export const vegTypeEnum = z.enum(["veg", "nonveg", "vegan", "na"]);
export type VegType = z.infer<typeof vegTypeEnum>;

export const createAdminProductSchema = z
  .object({
    categoryId: z
      .string({ message: "Category ID is required" })
      .uuid("Invalid Category UUID format"),
    brandId: z
      .string({ message: "Brand ID is required" })
      .uuid("Invalid Brand UUID format"),
    hsnCodeId: z
      .string({ message: "HSN Code ID is required" })
      .uuid("Invalid HSN Code UUID format"),
    name: z
      .string({ message: "Product name is required" })
      .trim()
      .min(1, "Product name cannot be empty")
      .max(200, "Product name cannot exceed 200 characters"),
    slug: z
      .string({ message: "Product slug is required" })
      .trim()
      .min(1, "Product slug cannot be empty")
      .max(220, "Product slug cannot exceed 220 characters"),
    shortDescription: z
      .string()
      .trim()
      .max(500, "Short description cannot exceed 500 characters")
      .optional()
      .nullable(),
    description: z
      .string()
      .trim()
      .optional()
      .nullable(),
    vegType: vegTypeEnum,
    isFeatured: z.boolean().default(false).optional(),
  })
  .strict();

export type CreateAdminProductInput = z.infer<typeof createAdminProductSchema>;

export const updateAdminProductSchema = createAdminProductSchema
  .partial()
  .strict();

export type UpdateAdminProductInput = z.infer<typeof updateAdminProductSchema>;

export const adminProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(10).optional(),
  search: z.string().trim().optional(),
});

export type AdminProductsQueryInput = z.infer<typeof adminProductsQuerySchema>;
