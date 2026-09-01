import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { contactService } from "@/features/contact/services/contact.service";
import {
  contactUuidParamSchema,
  replyContactSchema,
  type ContactUuidParamInput,
  type ReplyContactInput,
} from "@/features/contact/validations/contact.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const params = context.params as ContactUuidParamInput;
      const body = context.body as ReplyContactInput;
      const adminEmail = context.session?.user?.email;

      const result = await contactService.replyContactMessage(
        params.uuid,
        body.message,
        adminEmail
      );

      return apiSuccess(result, "Reply sent successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    paramSchema: contactUuidParamSchema,
    bodySchema: replyContactSchema,
  }
);
