import { createApiHandler } from "@/lib/api/api-handler";
import { apiCreated, apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { orderService } from "@/features/orders/services/order.service";
import {
  customerCreateOrderSchema,
  customerOrdersQuerySchema,
  type CustomerCreateOrderInput,
  type CustomerOrdersQueryInput,
} from "@/features/orders/validations/order.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const body = context.body as CustomerCreateOrderInput;
      const order = await orderService.createCustomerOrder(sessionUserId, body);

      return apiCreated(order, "Order placed successfully");
    },
  },
  {
    requireAuth: true,
    bodySchema: customerCreateOrderSchema,
  }
);

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const query = (context.query || {}) as CustomerOrdersQueryInput;
      const result = await orderService.getCustomerOrders(sessionUserId, query);

      return apiSuccess(result.data, "Orders fetched successfully", 200, result.meta);
    },
  },
  {
    requireAuth: true,
    querySchema: customerOrdersQuerySchema,
  }
);
