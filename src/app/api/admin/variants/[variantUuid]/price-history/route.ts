import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { variantService } from "@/features/variants/services/variant.service";
import {
  variantPriceHistoryQuerySchema,
  type VariantPriceHistoryQueryInput,
} from "@/features/variants/validations/admin-variant.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const variantUuid = context.params?.variantUuid;
      if (!variantUuid || typeof variantUuid !== "string") {
        throw ApiError.badRequest("Invalid variant UUID");
      }

      const body = (context.body || {}) as VariantPriceHistoryQueryInput;
      const result = await variantService.getVariantPriceHistory(
        variantUuid,
        body
      );

      return apiSuccess(
        result.data,
        "Variant price history fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
    bodySchema: variantPriceHistoryQuerySchema,
  }
);
