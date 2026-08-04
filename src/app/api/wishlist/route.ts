import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiFromError } from "@/lib/api/api-response";
import { wishlistService } from "@/features/wishlist/services/wishlist.service";
import { addToWishlistSchema } from "@/features/wishlist/validations/wishlist.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      try {
        const userId = parseInt((context.session?.user as { id?: string })?.id ?? "0");
        if (!userId) return apiFromError(new Error("Unauthorized"));
        const result = await wishlistService.getWishlist(userId);
        return apiSuccess(result, "Wishlist fetched successfully");
      } catch (error) {
        return apiFromError(error);
      }
    },
  },
  { requireAuth: true }
);

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      try {
        const userId = parseInt((context.session?.user as { id?: string })?.id ?? "0");
        if (!userId) return apiFromError(new Error("Unauthorized"));
        const body = context.body as { productId: number };
        const item = await wishlistService.addToWishlist(userId, {
          productId: body.productId,
        });
        return apiSuccess(item, "Added to wishlist", 201);
      } catch (error) {
        return apiFromError(error);
      }
    },
  },
  { requireAuth: true, bodySchema: addToWishlistSchema }
);
