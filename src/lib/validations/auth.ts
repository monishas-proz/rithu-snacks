export {
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resendOtpSchema,
  resetPasswordWithOtpSchema,
  type LoginInput,
  type RefreshTokenInput,
  type ForgotPasswordInput,
  type VerifyOtpInput,
  type ResendOtpInput,
  type ResetPasswordWithOtpInput,
} from "@/features/auth/validations/auth.schema";

export {
  registerSchema,
  type RegisterInput,
} from "@/features/users/validations/user.schema";
