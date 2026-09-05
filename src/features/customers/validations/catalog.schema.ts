import { z } from "zod";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const uuidParamSchema = z.string().trim().regex(uuidRegex, {
  message: "Invalid UUID format",
});

export const customerBrandListSchema = z
  .object({
    page: z.number().int().min(1).optional().default(1),
    pageSize: z.number().int().min(1).max(100).optional().default(20),
    search: z.string().trim().optional(),
    sortBy: z.enum(["name", "createdAt"]).optional().default("name"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  })
  .strict();

export const customerCategoryListSchema = z
  .object({
    page: z.number().int().min(1).optional().default(1),
    pageSize: z.number().int().min(1).max(100).optional().default(20),
    search: z.string().trim().optional(),
    sortBy: z.enum(["name", "createdAt"]).optional().default("name"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  })
  .strict();

export const customerProductListSchema = z
  .object({
    page: z.number().int().min(1).optional().default(1),
    pageSize: z.number().int().min(1).max(100).optional().default(20),
    search: z.string().trim().optional(),
    brandIds: z.array(z.string().trim().regex(uuidRegex, "Invalid brand UUID")).optional(),
    categoryIds: z.array(z.string().trim().regex(uuidRegex, "Invalid category UUID")).optional(),
    minPrice: z.number().min(0, "minPrice cannot be negative").optional().nullable(),
    maxPrice: z.number().min(0, "maxPrice cannot be negative").optional().nullable(),
    sortBy: z.enum(["name", "price", "createdAt"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  })
  .strict()
  .refine(
    (data) => {
      if (
        data.minPrice !== undefined &&
        data.minPrice !== null &&
        data.maxPrice !== undefined &&
        data.maxPrice !== null
      ) {
        return data.maxPrice >= data.minPrice;
      }
      return true;
    },
    {
      message: "maxPrice cannot be less than minPrice",
      path: ["maxPrice"],
    }
  );

export const customerVariantListSchema = z
  .object({
    page: z.number().int().min(1).optional().default(1),
    pageSize: z.number().int().min(1).max(100).optional().default(20),
    search: z.string().trim().optional(),
    minPrice: z.number().min(0, "minPrice cannot be negative").optional().nullable(),
    maxPrice: z.number().min(0, "maxPrice cannot be negative").optional().nullable(),
    sortBy: z
      .enum(["variantName", "salePrice", "basePrice", "createdAt"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  })
  .strict()
  .refine(
    (data) => {
      if (
        data.minPrice !== undefined &&
        data.minPrice !== null &&
        data.maxPrice !== undefined &&
        data.maxPrice !== null
      ) {
        return data.maxPrice >= data.minPrice;
      }
      return true;
    },
    {
      message: "maxPrice cannot be less than minPrice",
      path: ["maxPrice"],
    }
  );

export const customerGlobalVariantListSchema = z
  .object({
    page: z.number().int().min(1).optional().default(1),
    pageSize: z.number().int().min(1).max(100).optional().default(20),
    search: z.string().trim().optional(),
    productIds: z.array(z.string().trim().regex(uuidRegex, "Invalid product UUID")).optional(),
    brandIds: z.array(z.string().trim().regex(uuidRegex, "Invalid brand UUID")).optional(),
    categoryIds: z.array(z.string().trim().regex(uuidRegex, "Invalid category UUID")).optional(),
    minPrice: z.number().min(0, "minPrice cannot be negative").optional().nullable(),
    maxPrice: z.number().min(0, "maxPrice cannot be negative").optional().nullable(),
    sortBy: z
      .enum(["variantName", "salePrice", "basePrice", "createdAt", "productName"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  })
  .strict()
  .refine(
    (data) => {
      if (
        data.minPrice !== undefined &&
        data.minPrice !== null &&
        data.maxPrice !== undefined &&
        data.maxPrice !== null
      ) {
        return data.maxPrice >= data.minPrice;
      }
      return true;
    },
    {
      message: "maxPrice cannot be less than minPrice",
      path: ["maxPrice"],
    }
  );

export type CustomerBrandListInput = z.input<typeof customerBrandListSchema>;
export type CustomerCategoryListInput = z.input<typeof customerCategoryListSchema>;
export type CustomerProductListInput = z.input<typeof customerProductListSchema>;
export type CustomerVariantListInput = z.input<typeof customerVariantListSchema>;
export type CustomerGlobalVariantListInput = z.input<typeof customerGlobalVariantListSchema>;
