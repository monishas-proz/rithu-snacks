import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { GetAdminVariantsParams } from "../types";

const variantInclude = Prisma.validator<Prisma.ProductVariantInclude>()({
  product: {
    select: {
      id: true,
      uuid: true,
      name: true,
      isActive: true,
      deleted_at: true,
    },
  },
  product_units: {
    select: {
      id: true,
      uuid: true,
      name: true,
      code: true,
      is_active: true,
    },
  },
  product_variant_images: {
    where: { is_active: true },
    select: {
      uuid: true,
      image_url: true,
      is_primary: true,
      sort_order: true,
    },
    orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }],
  },
});

export const variantRepository = {
  async findByUuid(uuid: string) {
    return db.productVariant.findFirst({
      where: { uuid, isActive: true, deleted_at: null },
      include: variantInclude,
    });
  },

  async findById(id: number | bigint) {
    return db.productVariant.findFirst({
      where: { id: BigInt(id), isActive: true, deleted_at: null },
      include: variantInclude,
    });
  },

  async findBySku(sku: string, excludeUuid?: string) {
    return db.productVariant.findFirst({
      where: {
        sku,
        isActive: true,
        deleted_at: null,
        ...(excludeUuid ? { uuid: { not: excludeUuid } } : {}),
      },
    });
  },

  async findAdminAll(
    params: GetAdminVariantsParams = {},
    productId?: bigint
  ) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;

    const where: Prisma.ProductVariantWhereInput = {
      isActive: true,
      deleted_at: null,
      ...(productId ? { productId } : {}),
      product: {
        isActive: true,
        deleted_at: null,
      },
    };

    if (params.search) {
      where.OR = [
        { variant_name: { contains: params.search } },
        { sku: { contains: params.search } },
        { product: { name: { contains: params.search } } },
      ];
    }

    const [data, total] = await Promise.all([
      db.productVariant.findMany({
        where,
        include: variantInclude,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.productVariant.count({ where }),
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

  async findAdminAllByProductId(
    productId: bigint,
    params: GetAdminVariantsParams = {}
  ) {
    return this.findAdminAll(params, productId);
  },

  async create(data: Prisma.ProductVariantUncheckedCreateInput) {
    return db.productVariant.create({
      data,
      include: variantInclude,
    });
  },

  async updateByUuid(
    uuid: string,
    data: Prisma.ProductVariantUncheckedUpdateInput
  ) {
    const existing = await this.findByUuid(uuid);
    if (!existing) return null;

    return db.productVariant.update({
      where: { id: existing.id },
      data,
      include: variantInclude,
    });
  },

  async softDeleteByUuid(uuid: string, adminId?: bigint | null) {
    const existing = await this.findByUuid(uuid);
    if (!existing) return null;

    return db.productVariant.update({
      where: { id: existing.id },
      data: {
        isActive: false,
        deleted_at: new Date(),
        ...(adminId ? { updated_by: adminId } : {}),
      },
    });
  },
};
