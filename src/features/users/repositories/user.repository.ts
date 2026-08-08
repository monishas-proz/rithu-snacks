import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { GetUserParams } from "../types";

const userSelect = {
  id: true,
  uuid: true,
  cust_id: true,
  name: true,
  email: true,
  phone: true,
  roleId: true,
  status: true,
  avatar: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.UserSelect;

function formatUser<T extends Record<string, any>>(user: T) {
  if (!user) return user;
  return {
    ...user,
    id: typeof user.id === "bigint" ? Number(user.id) : user.id,
    roleId: typeof user.roleId === "bigint" ? Number(user.roleId) : user.roleId,
    custId: user.cust_id ?? null,
    roleName: user.role?.name,
  };
}

function buildUserWhere(params: GetUserParams): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (params.status) {
    where.status = params.status as Prisma.Enumusers_statusFilter["equals"];
  }

  if (params.roleId) {
    where.roleId = BigInt(params.roleId);
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
      data: data.map((user) => formatUser(user)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: number | bigint) {
    const user = await db.user.findUnique({
      where: { id: BigInt(id) },
      select: userSelect,
    });
    return user ? formatUser(user) : null;
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
    const user = await db.user.create({
      data,
      select: userSelect,
    });
    return formatUser(user);
  },

  async update(id: number | bigint, data: Prisma.UserUpdateInput) {
    const user = await db.user.update({
      where: { id: BigInt(id) },
      data,
      select: userSelect,
    });
    return formatUser(user);
  },

  async delete(id: number | bigint) {
    const deleted = await db.user.delete({ where: { id: BigInt(id) } });
    return formatUser(deleted);
  },

  async resetPassword(id: number | bigint, hashedPassword: string) {
    const updated = await db.user.update({
      where: { id: BigInt(id) },
      data: { password_hash: hashedPassword },
      select: { id: true },
    });
    return { id: Number(updated.id) };
  },

  async count(where?: Prisma.UserWhereInput) {
    return db.user.count({ where });
  },
};
