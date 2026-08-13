import { z } from "zod";

export const getBrandsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetBrandsQueryInput = z.infer<typeof getBrandsQuerySchema>;

export const createBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255).regex(
    /^[A-Z0-9_-]+$/,
    "Brand slug must be uppercase letters, numbers, hyphens, or underscores (e.g. RITHANYA_SNACKS)"
  ),
  description: z.string().max(1000).optional(),
  logo: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export type CreateBrandSchemaInput = z.infer<typeof createBrandSchema>;

export const updateBrandSchema = createBrandSchema.partial();

export type UpdateBrandSchemaInput = z.infer<typeof updateBrandSchema>;
