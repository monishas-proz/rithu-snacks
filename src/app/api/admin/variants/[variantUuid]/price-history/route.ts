import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { variantService } from "@/features/variants/services/variant.service";
import {
  variantPriceHistoryQuerySchema,
  type VariantPriceHistoryQueryInput,
} from "@/features/variants/validations/admin-variant.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const variantUuid = context.params?.variantUuid;
      if (!variantUuid || typeof variantUuid !== "string") {
        throw ApiError.badRequest("Invalid variant UUID");
      }

      const query = (context.query || {}) as Record<string, any>;
      const parsed = variantPriceHistoryQuerySchema.safeParse({
        page: query.page ? Number(query.page) : 1,
        pageSize: query.pageSize ? Number(query.pageSize) : 20,
        fromDate: query.fromDate,
        toDate: query.toDate,
        sortOrder: query.sortOrder || "desc",
      });

      const params = parsed.success ? parsed.data : {};
      const result = await variantService.getVariantPriceHistory(
        variantUuid,
        params
      );

      return apiSuccess(
        result.data,
        "Variant price history fetched successfully",
        200,
        result.meta
      );
    },
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
  }
);
