import { z } from "zod";

export const getCategoriesQuerySchema = z.object({
  search: z.string().optional(),
  parentId: z.coerce.number().int().positive().optional(),
});

export type GetCategoriesQueryInput = z.infer<typeof getCategoriesQuerySchema>;

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  description: z.string().max(1000).optional(),
  image: z.string().max(500).optional(),
  parentId: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(1000).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
