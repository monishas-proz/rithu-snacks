import { apiClient } from "@/lib/api/api-client";
import type {
  LoginInput,
  ForgotPasswordInput,
  VerifyOtpInput,
  ResendOtpInput,
  ResetPasswordInput,
} from "../types";
import { RegisterInput } from "@/features/users/validations/user.schema";

export async function loginApi(data: LoginInput) {
  const response = await apiClient.post<{ user: { id: string; name: string; email: string; phone: string | null } }>(
    "/api/auth/login",
    {
      email: data.email.trim(),
      password: data.password,
    }
  );

  return response;
}

export async function registerApi(data: RegisterInput) {
  const response = await apiClient.post<{ id: string; name: string; email: string; phone: string | null }>(
    "/api/auth/register",
    {
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      password: data.password,
      confirmPassword: data.confirmPassword,
    }
  );

  return response;
}

export async function forgotPasswordApi(data: ForgotPasswordInput) {
  const response = await apiClient.post<null>("/api/auth/forgot-password", {
    email: data.email.trim(),
  });

  return response;
}

export async function verifyOtpApi(data: VerifyOtpInput) {
  const response = await apiClient.post<{ resetToken: string }>("/api/auth/verify-otp", {
    email: data.email.trim(),
    otp: data.otp.trim(),
  });

  return response;
}

export async function resendOtpApi(data: ResendOtpInput) {
  const response = await apiClient.post<null>("/api/auth/resend-otp", {
    email: data.email.trim(),
  });

  return response;
}

export async function resetPasswordApi(data: ResetPasswordInput) {
  const response = await apiClient.post<null>("/api/auth/reset-password", {
    resetToken: data.resetToken || "",
    password: data.password.trim(),
    confirmPassword: data.confirmPassword.trim(),
  });

  return response;
}

export async function refreshTokenApi(tokenArg?: string) {
  const response = await apiClient.post<null>("/api/auth/refresh", {
    refreshToken: tokenArg || "",
  });

  return response;
}

export async function logoutApi() {
  const response = await apiClient.post<null>("/api/auth/logout");
  return response;
}
