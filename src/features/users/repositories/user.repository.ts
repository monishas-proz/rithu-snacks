import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { GetUserParams } from "../types";

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  roleId: true,
  status: true,
  image: true,
  createdAt: true,
  role: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.UserSelect;

function buildUserWhere(params: GetUserParams): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (params.status) {
    where.status = params.status as Prisma.EnumUserStatusFilter["equals"];
  }

  if (params.roleId) {
    where.roleId = params.roleId;
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { email: { contains: params.search } },
      { phone: { contains: params.search } },
    ];
  }

  return where;
}

export const userRepository = {
  async findAll(params: GetUserParams = {}) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const where = buildUserWhere(params);

    const [data, total] = await Promise.all([
      db.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return {
      data: data.map((user) => ({
        ...user,
        roleName: user.role?.name,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: number) {
    return db.user.findUnique({
      where: { id },
      select: userSelect,
    });
  },

  async findByEmail(email: string) {
    return db.user.findUnique({
      where: { email },
    });
  },

  async findByPhone(phone: string) {
    return db.user.findFirst({
      where: { phone },
    });
  },

  async create(data: Prisma.UserCreateInput) {
    return db.user.create({
      data,
      select: userSelect,
    });
  },

  async update(id: number, data: Prisma.UserUpdateInput) {
    return db.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  },

  async delete(id: number) {
    return db.user.delete({ where: { id } });
  },

  async resetPassword(id: number, hashedPassword: string) {
    return db.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: { id: true },
    });
  },

  async count(where?: Prisma.UserWhereInput) {
    return db.user.count({ where });
  },
};
