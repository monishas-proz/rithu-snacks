"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  loginApi,
  registerApi,
  forgotPasswordApi,
  verifyOtpApi,
  resendOtpApi,
  resetPasswordApi,
  refreshTokenApi,
  logoutApi,
} from "../api/auth.api";
import type {
  LoginInput,
  ForgotPasswordInput,
  VerifyOtpInput,
  ResendOtpInput,
  ResetPasswordInput,
} from "../types";
import { RegisterInput } from "@/features/users";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginInput) => loginApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterInput) => registerApi(data),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordInput) => forgotPasswordApi(data),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (data: VerifyOtpInput) => verifyOtpApi(data),
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (data: ResendOtpInput) => resendOtpApi(data),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordInput) => resetPasswordApi(data),
  });
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: (refreshToken?: string) => refreshTokenApi(refreshToken),
    meta: {
      skipToast: true, // Silent background token refresh operation
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logoutApi(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
