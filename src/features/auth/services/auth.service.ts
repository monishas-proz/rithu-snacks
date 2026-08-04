import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { apiClient } from "@/lib/api/api-client";
import { signIn, signOut } from "next-auth/react";
import type { LoginInput, RegisterInput } from "@/lib/validations/auth";

export async function loginWithCredentials(data: LoginInput) {
  const result = await signIn("credentials", {
    email: data.email,
    password: data.password,
    redirect: false,
  });

  if (result?.error) {
    return { success: false, message: "Invalid email or password" };
  }

  return { success: true, message: "Signed in successfully" };
}

export async function registerUser(data: RegisterInput) {
  const result = await apiClient.post("/api/auth/register", {
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: data.password,
  });

  return result;
}

export async function logoutUser() {
  await signOut({ redirect: false });
}
