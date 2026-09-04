import { z } from "zod";

export const addCartItemSchema = z
  .object({
    variantUnitPriceId: z
      .string({ message: "variantUnitPriceId is required" })
      .uuid("Invalid variantUnitPriceId UUID format"),
    quantity: z
      .number({ message: "quantity is required" })
      .int("Quantity must be an integer")
      .min(1, "Quantity must be at least 1")
      .max(9999, "Quantity cannot exceed 9999"),
  })
  .strict();

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

export const updateCartItemSchema = z
  .object({
    quantity: z
      .number({ message: "quantity is required" })
      .int("Quantity must be an integer")
      .min(1, "Quantity must be at least 1")
      .max(9999, "Quantity cannot exceed 9999"),
  })
  .strict();

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
