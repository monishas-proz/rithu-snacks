import jwt from "jsonwebtoken";
import { ApiError } from "@/lib/api/api-error";

function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET environment variable is not defined");
  }
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not defined");
  }
  return secret;
}

function getResetPasswordSecret(): string {
  const secret = process.env.JWT_RESET_PASSWORD_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_RESET_PASSWORD_SECRET environment variable is not defined");
  }
  return secret;
}

export interface AccessTokenPayload {
  userId: number;
  email: string;
  phone: string | null;
}

export interface RefreshTokenPayload {
  userId: number;
}

export interface ResetPasswordTokenPayload {
  email: string;
  purpose: "reset_password";
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      phone: payload.phone ?? null,
    },
    getAccessSecret(),
    { expiresIn: "15d" }
  );
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
    },
    getRefreshSecret(),
    { expiresIn: "30d" }
  );
}

export function generateResetPasswordToken(payload: { email: string }): string {
  return jwt.sign(
    {
      email: payload.email,
      purpose: "reset_password",
    },
    getResetPasswordSecret(),
    { expiresIn: "5m" }
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, getAccessSecret()) as jwt.JwtPayload & AccessTokenPayload;
  return {
    userId: Number(decoded.userId),
    email: String(decoded.email),
    phone: decoded.phone ? String(decoded.phone) : null,
  };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, getRefreshSecret()) as jwt.JwtPayload & RefreshTokenPayload;
  return {
    userId: Number(decoded.userId),
  };
}

export function verifyResetPasswordToken(token: string): ResetPasswordTokenPayload {
  try {
    const decoded = jwt.verify(token, getResetPasswordSecret()) as jwt.JwtPayload & ResetPasswordTokenPayload;

    if (decoded.purpose !== "reset_password" || !decoded.email) {
      throw ApiError.unauthorized("Invalid reset password token.");
    }

    return {
      email: String(decoded.email),
      purpose: "reset_password",
    };
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err?.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Reset password token has expired. Please verify OTP again.");
    }
    throw ApiError.unauthorized("Invalid or tampered reset password token.");
  }
}
