import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";

export const POST = createApiHandler(
  {
    POST: async () => {
      return apiSuccess(null, "Logged out successfully");
    },
  },
  {
    method: "POST",
  }
);
