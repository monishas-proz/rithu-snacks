import { z } from "zod";

export const addWishlistSchema = z
  .object({
    variantUnitPriceId: z.string().uuid("Invalid variant unit price UUID"),
  })
  .strict();

export type AddWishlistInput = z.infer<typeof addWishlistSchema>;
