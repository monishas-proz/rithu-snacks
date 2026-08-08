import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { loginSchema } from "@/features/auth/validations/auth.schema";
import { authService } from "@/features/auth/services/auth.service";
import type { LoginInput } from "@/features/auth/types";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as LoginInput;

      const authData = await authService.authenticateUser(body);

      return apiSuccess(authData, "Login successful");
    },
  },
  {
    method: "POST",
    bodySchema: loginSchema,
  }
);
