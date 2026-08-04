import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiFromError } from "@/lib/api/api-response";
import { cartService } from "@/features/cart/services/cart.service";
import { addToCartSchema } from "@/features/cart/validations/cart.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      try {
        const userId = parseInt((context.session?.user as { id?: string })?.id ?? "0");
        if (!userId) return apiFromError(new Error("Unauthorized"));
        const cart = await cartService.getCart(userId);
        return apiSuccess(cart, "Cart fetched successfully");
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
        const body = context.body as { productId: number; variantId?: number; quantity?: number };
        const cart = await cartService.addToCart(userId, {
          productId: body.productId,
          variantId: body.variantId,
          quantity: body.quantity,
        });
        return apiSuccess(cart, "Item added to cart", 201);
      } catch (error) {
        return apiFromError(error);
      }
    },
  },
  { requireAuth: true, bodySchema: addToCartSchema }
);
