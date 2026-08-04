import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiFromError } from "@/lib/api/api-response";
import { orderService } from "@/features/orders/services/order.service";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      try {
        const id = parseInt(context.params?.id ?? "0", 10);
        const order = await orderService.getAdminOrder(id);
        return apiSuccess(order, "Order fetched successfully");
      } catch (error) {
        return apiFromError(error);
      }
    },
  },
  { requireAuth: true, requiredRole: ["ADMIN", "STAFF"] }
);

