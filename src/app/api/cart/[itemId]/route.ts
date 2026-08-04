import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiFromError } from "@/lib/api/api-response";
import { cartService } from "@/features/cart/services/cart.service";
import { updateCartItemSchema } from "@/features/cart/validations/cart.schema";

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      try {
        const userId = parseInt((context.session?.user as { id?: string })?.id ?? "0");
        if (!userId) return apiFromError(new Error("Unauthorized"));
        const itemId = parseInt(context.params?.itemId ?? "0");
        const body = context.body as { quantity: number };
        const cart = await cartService.updateCartItem(
          userId,
          { quantity: body.quantity },
          itemId
        );
        return apiSuccess(cart, "Cart updated successfully");
      } catch (error) {
        return apiFromError(error);
      }
    },
  },
  { requireAuth: true, bodySchema: updateCartItemSchema }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      try {
        const userId = parseInt((context.session?.user as { id?: string })?.id ?? "0");
        if (!userId) return apiFromError(new Error("Unauthorized"));
        const itemId = parseInt(context.params?.itemId ?? "0");
        const cart = await cartService.removeCartItem(userId, itemId);
        return apiSuccess(cart, "Item removed from cart");
      } catch (error) {
        return apiFromError(error);
      }
    },
  },
  { requireAuth: true }
);
