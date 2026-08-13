export {
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resendOtpSchema,
  resetPasswordSchema,
  type LoginInput,
  type RefreshTokenInput,
  type ForgotPasswordInput,
  type VerifyOtpInput,
  type ResendOtpInput,
  type ResetPasswordInput,
} from "@/features/auth/validations/auth.schema";

export {
  registerSchema,
  type RegisterInput,
} from "@/features/users/validations/user.schema";
