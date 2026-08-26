import { z } from "zod";

export const addWishlistSchema = z
  .object({
    variantId: z.string().uuid("Invalid variant UUID"),
  })
  .strict();

export type AddWishlistInput = z.infer<typeof addWishlistSchema>;
