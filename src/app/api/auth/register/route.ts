import { db } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/api-response";
import { registerSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      );
      return apiError("Validation failed", 400, errors);
    }

    const { name, email, phone, password } = validation.data;

    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return apiError("An account with this email already exists", 409);
      }
      return apiError("An account with this phone number already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const defaultRole = await db.role.findUnique({
      where: { name: "CUSTOMER" },
    });

    if (!defaultRole) {
      return apiError("System configuration error. Please try again later.", 500);
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        roleId: defaultRole.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    return apiSuccess(user, "Account created successfully. You can now sign in.", 201);
  } catch (error) {
    console.error("Register error:", error);
    return apiError("Failed to create account. Please try again.", 500);
  }
}
