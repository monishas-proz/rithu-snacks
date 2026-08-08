import bcrypt from "bcryptjs";
import { signIn, signOut } from "next-auth/react";
import { ApiError } from "@/lib/api/api-error";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@/lib/auth/jwt";
import { userRepository } from "@/features/users/repositories/user.repository";
import { apiClient } from "@/lib/api/api-client";
import type { LoginInput, RegisterInput } from "@/lib/validations/auth";

export const authService = {
  async authenticateUser(data: LoginInput) {
    const user = await userRepository.findByEmail(data.email);
    if (!user || !user.password) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    if (user.status !== "ACTIVE") {
      throw ApiError.forbidden("Your account is inactive or blocked");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    await userRepository.update(user.id, { lastLogin: new Date() } as never);

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      phone: user.phone ?? null,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      accessToken,
      refreshToken,
    };
  },

  async refreshAccessToken(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }

    const user = await userRepository.findById(payload.userId);
    if (!user || user.status !== "ACTIVE") {
      throw ApiError.unauthorized("User account is inactive or no longer exists");
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      phone: user.phone ?? null,
    });

    return { accessToken };
  },
};

// Client-side authentication helpers
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
