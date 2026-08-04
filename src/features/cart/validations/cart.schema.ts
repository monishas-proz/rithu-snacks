import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.number().int().positive("Product ID must be a positive integer"),
  variantId: z.number().int().positive().nullable().optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export type AddToCartSchema = z.infer<typeof addToCartSchema>;
export type UpdateCartItemSchema = z.infer<typeof updateCartItemSchema>;
