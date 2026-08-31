import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { contactService } from "@/features/contact/services/contact.service";
import {
  contactUuidParamSchema,
  updateContactStatusSchema,
  type ContactUuidParamInput,
  type UpdateContactStatusInput,
} from "@/features/contact/validations/contact.schema";

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const params = context.params as ContactUuidParamInput;
      const body = context.body as UpdateContactStatusInput;
      const adminEmail = context.session?.user?.email;

      const result = await contactService.updateContactMessageStatus(
        params.uuid,
        body.status,
        adminEmail
      );

      return apiSuccess(
        result,
        "Contact message status updated successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    paramSchema: contactUuidParamSchema,
    bodySchema: updateContactStatusSchema,
  }
);
