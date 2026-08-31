import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { GetStaffParams } from "../types";

const staffInclude = Prisma.validator<Prisma.UserInclude>()({
  role: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
});

export const staffRepository = {
  async getStaffRole() {
    return db.role.findFirst({
      where: { slug: "staff", is_active: true },
    });
  },

  async findStaffByUuid(uuid: string) {
    return db.user.findFirst({
      where: {
        uuid,
        role: { slug: "staff" },
        deleted_at: null,
      },
      include: staffInclude,
    });
  },

  async findStaffById(id: number | bigint) {
    return db.user.findFirst({
      where: {
        id: BigInt(id),
        role: { slug: "staff" },
        deleted_at: null,
      },
      include: staffInclude,
    });
  },

  async findByEmail(email: string, excludeUuid?: string) {
    return db.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deleted_at: null,
        ...(excludeUuid ? { uuid: { not: excludeUuid } } : {}),
      },
    });
  },

  async findByPhone(phone: string, excludeUuid?: string) {
    return db.user.findFirst({
      where: {
        phone,
        deleted_at: null,
        ...(excludeUuid ? { uuid: { not: excludeUuid } } : {}),
      },
    });
  },

  buildStaffWhere(params: GetStaffParams = {}): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {
      role: { slug: "staff" },
      deleted_at: null,
    };

    if (typeof params.isActive === "boolean") {
      where.is_active = params.isActive;
    }

    if (params.search) {
      const search = params.search.trim();
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    return where;
  },

  async countStaff(params: GetStaffParams = {}): Promise<number> {
    const where = this.buildStaffWhere(params);
    return db.user.count({ where });
  },

  async findStaffList(params: GetStaffParams = {}) {
    const page = params.page ?? 1;
    const limit = params.limit ?? params.pageSize ?? 10;
    const skip = (page - 1) * limit;

    const where = this.buildStaffWhere(params);

    const sortField = params.sortBy ?? "createdAt";
    const sortOrder = params.sortOrder ?? "desc";

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortField]: sortOrder,
    };

    const [data, total] = await Promise.all([
      db.user.findMany({
        where,
        include: staffInclude,
        orderBy,
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async createStaff(data: Prisma.UserUncheckedCreateInput) {
    return db.user.create({
      data,
      include: staffInclude,
    });
  },

  async updateStaffByUuid(
    uuid: string,
    data: Prisma.UserUncheckedUpdateInput
  ) {
    const existing = await this.findStaffByUuid(uuid);
    if (!existing) return null;

    return db.user.update({
      where: { id: existing.id },
      data,
      include: staffInclude,
    });
  },
};
