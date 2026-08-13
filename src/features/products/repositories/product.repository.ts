import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { GetAdminProductsParams } from "../types";

const productAdminInclude = Prisma.validator<Prisma.ProductInclude>()({
  brand: {
    select: {
      id: true,
      uuid: true,
      name: true,
      slug: true,
      isActive: true,
    },
  },
  product_hsn_codes: {
    select: {
      id: true,
      uuid: true,
      code: true,
      is_active: true,
    },
  },
});

export const productRepository = {
  async findByUuid(uuid: string) {
    return db.product.findFirst({
      where: { uuid, isActive: true, deleted_at: null },
      include: productAdminInclude,
    });
  },

  async findById(id: number | bigint) {
    return db.product.findFirst({
      where: { id: BigInt(id), isActive: true, deleted_at: null },
      include: productAdminInclude,
    });
  },

  async findByName(name: string, excludeUuid?: string) {
    return db.product.findFirst({
      where: {
        name,
        isActive: true,
        deleted_at: null,
        ...(excludeUuid ? { uuid: { not: excludeUuid } } : {}),
      },
    });
  },

  async findBySlug(slug: string, excludeUuid?: string) {
    return db.product.findFirst({
      where: {
        slug,
        isActive: true,
        deleted_at: null,
        ...(excludeUuid ? { uuid: { not: excludeUuid } } : {}),
      },
    });
  },

  async findAdminAll(params: GetAdminProductsParams = {}) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      deleted_at: null,
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { slug: { contains: params.search } },
        { shortDescription: { contains: params.search } },
        { description: { contains: params.search } },
      ];
    }

    const [data, total] = await Promise.all([
      db.product.findMany({
        where,
        include: productAdminInclude,
        orderBy: [{ name: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.product.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit: pageSize,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async create(data: Prisma.ProductUncheckedCreateInput) {
    return db.product.create({
      data,
      include: productAdminInclude,
    });
  },

  async updateByUuid(
    uuid: string,
    data: Prisma.ProductUncheckedUpdateInput
  ) {
    const existing = await this.findByUuid(uuid);
    if (!existing) return null;

    return db.product.update({
      where: { id: existing.id },
      data,
      include: productAdminInclude,
    });
  },

  async softDeleteByUuid(uuid: string, adminId?: bigint | null) {
    const existing = await this.findByUuid(uuid);
    if (!existing) return null;

    return db.product.update({
      where: { id: existing.id },
      data: {
        isActive: false,
        deleted_at: new Date(),
        ...(adminId ? { updated_by: adminId } : {}),
      },
    });
  },
};
