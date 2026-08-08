import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { refreshTokenSchema } from "@/features/auth/validations/auth.schema";
import { authService } from "@/features/auth/services/auth.service";
import type { RefreshTokenInput } from "@/features/auth/types";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as RefreshTokenInput;

      const result = await authService.refreshAccessToken(body.refreshToken);

      return apiSuccess(result, "Access token refreshed successfully");
    },
  },
  {
    method: "POST",
    bodySchema: refreshTokenSchema,
  }
);
