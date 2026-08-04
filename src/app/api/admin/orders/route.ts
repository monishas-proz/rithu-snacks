import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiFromError } from "@/lib/api/api-response";
import { orderService } from "@/features/orders/services/order.service";
import { getOrdersQuerySchema } from "@/features/orders/validations/order.schema";
import type { GetOrdersQueryInput } from "@/features/orders/validations/order.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      try {
        const query = context.query as GetOrdersQueryInput;
        const result = await orderService.getAdminOrders({
          page: query.page,
          limit: query.limit,
          search: query.search,
          status: query.status,
        });
        return apiSuccess(result.data, "Orders fetched successfully", 200, result.meta);
      } catch (error) {
        return apiFromError(error);
      }
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    querySchema: getOrdersQuerySchema,
  }
);
