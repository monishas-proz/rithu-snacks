import { createApiHandler } from "@/lib/api/api-handler";
import { apiCreated } from "@/lib/api/api-response";
import { registerSchema, type RegisterInput } from "@/features/users/validations/user.schema";
import { userService } from "@/features/users/services/user.service";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as RegisterInput;

      const user = await userService.createUser({
        name: body.name,
        email: body.email,
        phone: body.phone,
        password: body.password,
      });

      return apiCreated(
        {
          id: user.id, // Exposes user's UUID in the id property
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        "Account created successfully. You can now sign in."
      );
    },
  },
  {
    method: "POST",
    bodySchema: registerSchema,
  }
);
