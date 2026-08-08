import bcrypt from "bcryptjs";
import { ApiError } from "@/lib/api/api-error";
import { userRepository } from "../repositories/user.repository";
import type { GetUserParams, CreateUserInput, UpdateUserInput } from "../types";

export const userService = {
  async getUsers(params: GetUserParams = {}) {
    return userRepository.findAll(params);
  },

  async getUser(id: number | bigint) {
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

    if (data.phone) {
      const existingPhone = await userRepository.findByPhone(data.phone);
      if (existingPhone) {
        throw ApiError.conflict("An account with this phone number already exists");
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Registration ALWAYS assigns role_id = 3 (CUSTOMER)
    return userRepository.create({
      name: data.name,
      email: data.email,
      password_hash: hashedPassword,
      phone: data.phone ?? undefined,
      role: { connect: { id: BigInt(3) } },
      status: (data.status as "active" | "inactive" | "banned") ?? "active",
    });
  },

  async updateUser(id: number | bigint, data: UpdateUserInput) {
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

    if (data.phone && data.phone !== existing.phone) {
      const phoneExists = await userRepository.findByPhone(data.phone);
      if (phoneExists && Number(phoneExists.id) !== Number(id)) {
        throw ApiError.conflict("An account with this phone number already exists");
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.status !== undefined) updateData.status = data.status;

    return userRepository.update(id, updateData as never);
  },

  async deleteUser(id: number | bigint) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("User not found");
    }

    return userRepository.delete(id);
  },

  async resetPassword(id: number | bigint, password: string) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("User not found");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    return userRepository.resetPassword(id, hashedPassword);
  },

  async toggleStatus(id: number | bigint) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("User not found");
    }

    const newStatus = existing.status === "active" ? "inactive" : "active";
    return userRepository.update(id, { status: newStatus } as never);
  },
};
