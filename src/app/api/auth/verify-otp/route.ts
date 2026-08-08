import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { verifyOtpSchema } from "@/features/auth/validations/auth.schema";
import { otpService } from "@/features/auth/services/otp.service";
import type { VerifyOtpInput } from "@/features/auth/types";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as VerifyOtpInput;
      const result = await otpService.verifyOtp(body.email, body.otp);
      return apiSuccess({ resetToken: result.resetToken }, result.message);
    },
  },
  {
    method: "POST",
    bodySchema: verifyOtpSchema,
  }
);
