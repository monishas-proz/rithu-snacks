import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db/prisma";
import { GetBannersParams } from "../types";

export const bannerRepository = {
  async findAll(params: GetBannersParams & { page: number; limit: number }) {
    const { page, limit, search, isActive } = params;

    const where: Prisma.BannerWhereInput = {};

    if (search) {
      where.title = { contains: search };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      db.banner.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.banner.count({ where }),
    ]);

    return { data, total };
  },

  async count(params: GetBannersParams & { page: number; limit: number }) {
    const { search, isActive } = params;

    const where: Prisma.BannerWhereInput = {};

    if (search) {
      where.title = { contains: search };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return db.banner.count({ where });
  },

  async findById(id: number) {
    return db.banner.findUnique({ where: { id } });
  },

  async create(data: Prisma.BannerCreateInput) {
    return db.banner.create({ data });
  },

  async update(id: number, data: Prisma.BannerUpdateInput) {
    return db.banner.update({ where: { id }, data });
  },

  async delete(id: number) {
    return db.banner.delete({ where: { id } });
  },
};
