import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { resendOtpSchema } from "@/features/auth/validations/auth.schema";
import { otpService } from "@/features/auth/services/otp.service";
import type { ResendOtpInput } from "@/features/auth/types";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as ResendOtpInput;
      const result = await otpService.resendForgotPasswordOtp(body.email);
      return apiSuccess(null, result.message);
    },
  },
  {
    method: "POST",
    bodySchema: resendOtpSchema,
  }
);
