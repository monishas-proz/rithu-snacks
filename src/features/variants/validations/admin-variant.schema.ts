import { z } from "zod";

export const createAdminVariantSchema = z
  .object({
    variantName: z
      .string({ message: "Variant name is required" })
      .trim()
      .min(1, "Variant name cannot be empty")
      .max(100, "Variant name cannot exceed 100 characters"),
    sku: z
      .string({ message: "SKU is required" })
      .trim()
      .min(1, "SKU cannot be empty")
      .max(100, "SKU cannot exceed 100 characters"),
    unitValue: z
      .number({ message: "Unit value is required" })
      .gt(0, "Unit value must be greater than 0"),
    unitId: z
      .string({ message: "Unit ID is required" })
      .uuid("Invalid Unit UUID format"),
    basePrice: z
      .number({ message: "Base price is required" })
      .min(0, "Base price cannot be negative"),
    salePrice: z
      .number({ message: "Sale price is required" })
      .min(0, "Sale price cannot be negative"),
    weightGrams: z
      .number()
      .min(0, "Weight in grams cannot be negative")
      .optional()
      .nullable(),
  })
  .strict();

export type CreateAdminVariantInput = z.infer<typeof createAdminVariantSchema>;

export const updateAdminVariantSchema = createAdminVariantSchema
  .partial()
  .strict();

export type UpdateAdminVariantInput = z.infer<typeof updateAdminVariantSchema>;

export const adminVariantsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(10).optional(),
  search: z.string().trim().optional(),
  productId: z.string().trim().uuid("Invalid Product UUID format").optional(),
  productUuid: z.string().trim().uuid("Invalid Product UUID format").optional(),
});

export type AdminVariantsQueryInput = z.infer<typeof adminVariantsQuerySchema>;

export const adminVariantListSchema = z
  .object({
    page: z.number().int().min(1, "page must be at least 1").default(1),
    pageSize: z
      .number()
      .int()
      .min(1, "pageSize must be at least 1")
      .max(100, "pageSize cannot exceed 100")
      .default(20),
    search: z.string().trim().optional(),
    productIds: z
      .array(z.string().uuid("Invalid Product UUID format"))
      .optional()
      .default([]),
    brandIds: z
      .array(z.string().uuid("Invalid Brand UUID format"))
      .optional()
      .default([]),
    categoryIds: z
      .array(z.string().uuid("Invalid Category UUID format"))
      .optional()
      .default([]),
    measurementTypes: z
      .array(z.enum(["weight", "volume", "count"]))
      .optional()
      .default([]),
    unitIds: z
      .array(z.string().uuid("Invalid Unit UUID format"))
      .optional()
      .default([]),
    isActive: z.boolean().optional(),
    minPrice: z
      .number()
      .min(0, "minPrice must be greater than or equal to 0")
      .optional(),
    maxPrice: z
      .number()
      .min(0, "maxPrice must be greater than or equal to 0")
      .optional(),
    sortBy: z
      .enum([
        "variantName",
        "productName",
        "sku",
        "basePrice",
        "salePrice",
        "createdAt",
        "updatedAt",
      ])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict()
  .refine(
    (data) =>
      data.minPrice === undefined ||
      data.maxPrice === undefined ||
      data.maxPrice >= data.minPrice,
    {
      message: "maxPrice cannot be less than minPrice",
      path: ["maxPrice"],
    }
  );

export type AdminVariantListInput = z.infer<typeof adminVariantListSchema>;
