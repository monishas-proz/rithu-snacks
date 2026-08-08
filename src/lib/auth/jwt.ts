import jwt from "jsonwebtoken";

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

export interface AccessTokenPayload {
  userId: number;
  email: string;
  phone: string | null;
}

export interface RefreshTokenPayload {
  userId: number;
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
