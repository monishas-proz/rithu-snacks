import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { contactService } from "@/features/contact/services/contact.service";
import {
  contactUuidParamSchema,
  type ContactUuidParamInput,
} from "@/features/contact/validations/contact.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const params = context.params as ContactUuidParamInput;
      const result = await contactService.getAdminContactMessageByUuid(
        params.uuid
      );

      return apiSuccess(result, "Contact message fetched successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    paramSchema: contactUuidParamSchema,
  }
);
