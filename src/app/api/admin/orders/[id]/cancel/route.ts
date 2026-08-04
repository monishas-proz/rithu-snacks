import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiFromError } from "@/lib/api/api-response";
import { orderService } from "@/features/orders/services/order.service";
import { cancelOrderSchema } from "@/features/orders/validations/order.schema";
import type { CancelOrderSchemaInput } from "@/features/orders/validations/order.schema";

export const PATCH = createApiHandler(
  {
    PATCH: async (_request, context) => {
      try {
        const id = parseInt(context.params?.id ?? "0", 10);
        const body = (context.body as CancelOrderSchemaInput) ?? {};
        const order = await orderService.cancelOrderAdmin(id, body.reason);
        return apiSuccess(order, "Order cancelled successfully");
      } catch (error) {
        return apiFromError(error);
      }
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: cancelOrderSchema,
  }
);
