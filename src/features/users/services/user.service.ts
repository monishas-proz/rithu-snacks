import bcrypt from "bcryptjs";
import { ApiError } from "@/lib/api/api-error";
import { userRepository } from "../repositories/user.repository";
import type { GetUserParams, CreateUserInput, UpdateUserInput } from "../types";

export const userService = {
  async getUsers(params: GetUserParams = {}) {
    return userRepository.findAll(params);
  },

  async getUser(id: number) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw ApiError.notFound("User not found");
    }
    return user;
  },

  async createUser(data: CreateUserInput) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw ApiError.conflict("An account with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    return userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone ?? undefined,
      role: { connect: { id: data.roleId ?? 1 } },
      status: (data.status as "ACTIVE" | "INACTIVE" | "BLOCKED") ?? "ACTIVE",
    });
  },

  async updateUser(id: number, data: UpdateUserInput) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("User not found");
    }

    if (data.email && data.email !== existing.email) {
      const emailExists = await userRepository.findByEmail(data.email);
      if (emailExists) {
        throw ApiError.conflict("An account with this email already exists");
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.roleId !== undefined) updateData.roleId = data.roleId;
    if (data.status !== undefined) updateData.status = data.status;

    return userRepository.update(id, updateData as never);
  },

  async deleteUser(id: number) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("User not found");
    }

    return userRepository.delete(id);
  },

  async resetPassword(id: number, password: string) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("User not found");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    return userRepository.resetPassword(id, hashedPassword);
  },

  async toggleStatus(id: number) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("User not found");
    }

    const newStatus = existing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    return userRepository.update(id, { status: newStatus } as never);
  },
};
