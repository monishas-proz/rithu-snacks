import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { variantService } from "@/features/variants/services/variant.service";
import {
  adminVariantsQuerySchema,
  type AdminVariantsQueryInput,
} from "@/features/variants/validations/admin-variant.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const query = context.query as AdminVariantsQueryInput;
      const result = await variantService.getAllAdminVariants({
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? 10,
        search: query?.search,
        productId: query?.productId || query?.productUuid,
      });

      return apiSuccess(result.data, "Variants fetched successfully", 200, result.meta);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    querySchema: adminVariantsQuerySchema,
  }
);
