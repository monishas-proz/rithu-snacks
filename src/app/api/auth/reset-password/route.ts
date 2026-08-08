import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { resetPasswordWithOtpSchema } from "@/features/auth/validations/auth.schema";
import { otpService } from "@/features/auth/services/otp.service";
import type { ResetPasswordWithOtpInput } from "@/features/auth/types";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as ResetPasswordWithOtpInput;
      const result = await otpService.resetPasswordWithOtp(body);
      return apiSuccess(null, result.message);
    },
  },
  {
    method: "POST",
    bodySchema: resetPasswordWithOtpSchema,
  }
);
