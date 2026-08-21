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
