import { createApiHandler } from "@/lib/api/api-handler";
import { apiCreated, apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { orderService } from "@/features/orders/services/order.service";
import type { CustomerCreateOrderInput } from "@/features/orders/validations/order.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const body = (context.body || {}) as Record<string, any>;
      const query = (context.query || {}) as Record<string, any>;

      // 1. If body has shippingAddressId -> Place order
      if (body.shippingAddressId) {
        const order = await orderService.createCustomerOrder(
          sessionUserId,
          body as CustomerCreateOrderInput
        );
        return apiCreated(order, "Order placed successfully");
      }

      // 2. Otherwise -> List/Filter customer orders
      const mergedParams = { ...query, ...body };
      const result = await orderService.getCustomerOrders(
        sessionUserId,
        mergedParams
      );

      return apiSuccess(
        result.data,
        "Customer orders fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    requireAuth: true,
  }
);

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const query = (context.query || {}) as Record<string, any>;
      const result = await orderService.getCustomerOrders(sessionUserId, query);

      return apiSuccess(
        result.data,
        "Orders fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    requireAuth: true,
  }
);

