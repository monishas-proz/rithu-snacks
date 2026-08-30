import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { variantService } from "@/features/variants/services/variant.service";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const variantUuid = context.params?.variantUuid;
      if (!variantUuid || typeof variantUuid !== "string") {
        throw ApiError.badRequest("Invalid variant UUID");
      }

      const query = (context.query || {}) as Record<string, any>;
      const period = query.period || "1y";

      const chartData = await variantService.getVariantPriceHistoryChart(
        variantUuid,
        period
      );

      return apiSuccess(
        chartData,
        "Variant price history chart fetched successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);
