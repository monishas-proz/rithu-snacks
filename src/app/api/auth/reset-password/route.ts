import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { resetPasswordSchema } from "@/features/auth/validations/auth.schema";
import { otpService } from "@/features/auth/services/otp.service";
import type { ResetPasswordInput } from "@/features/auth/types";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as ResetPasswordInput;
      const result = await otpService.resetPassword(body);
      return apiSuccess(null, result.message);
    },
  },
  {
    method: "POST",
    bodySchema: resetPasswordSchema,
  }
);
