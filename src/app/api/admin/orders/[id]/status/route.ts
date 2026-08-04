import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiFromError } from "@/lib/api/api-response";
import { orderService } from "@/features/orders/services/order.service";
import { updateOrderStatusSchema } from "@/features/orders/validations/order.schema";
import type { UpdateOrderStatusSchemaInput } from "@/features/orders/validations/order.schema";

export const PATCH = createApiHandler(
  {
    PATCH: async (_request, context) => {
      try {
        const id = parseInt(context.params?.id ?? "0", 10);
        const body = context.body as UpdateOrderStatusSchemaInput;
        const order = await orderService.updateOrderStatus(id, body);
        return apiSuccess(order, "Order status updated successfully");
      } catch (error) {
        return apiFromError(error);
      }
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: updateOrderStatusSchema,
  }
);
