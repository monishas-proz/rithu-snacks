import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiFromError } from "@/lib/api/api-response";
import { wishlistService } from "@/features/wishlist/services/wishlist.service";

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      try {
        const userId = parseInt((context.session?.user as { id?: string })?.id ?? "0");
        if (!userId) return apiFromError(new Error("Unauthorized"));
        const productId = parseInt(context.params?.productId ?? "0");
        await wishlistService.removeFromWishlist(userId, productId);
        return apiSuccess(null, "Removed from wishlist");
      } catch (error) {
        return apiFromError(error);
      }
    },
  },
  { requireAuth: true }
);
