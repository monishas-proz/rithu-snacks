import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { variantService } from "@/features/variants/services/variant.service";
import {
  bulkEditVariantsSchema,
  type BulkEditVariantsInput,
} from "@/features/variants/validations/admin-variant.schema";

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const body = context.body as BulkEditVariantsInput;
      const adminEmail = context.session?.user?.email ?? undefined;

      const updatedVariants = await variantService.bulkUpdateVariants(
        body,
        adminEmail
      );

      return apiSuccess(
        updatedVariants,
        "Variants updated successfully in bulk",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: bulkEditVariantsSchema,
  }
);
