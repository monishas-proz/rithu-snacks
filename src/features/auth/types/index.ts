export type {
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  VerifyOtpInput,
  ResendOtpInput,
  ResetPasswordWithOtpInput,
} from "../validations/auth.schema";

export interface AuthTokensResult {
  user: {
    id: number;
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
