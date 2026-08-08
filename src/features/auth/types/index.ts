export type {
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  VerifyOtpInput,
  ResendOtpInput,
  ResetPasswordInput,
} from "../validations/auth.schema";

export interface AuthTokensResult {
  user: {
    id: string; // Exposed UUID
    name: string;
    email: string;
    phone: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResult {
  accessToken: string;
}
