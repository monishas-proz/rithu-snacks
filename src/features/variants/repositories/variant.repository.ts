import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { GetAdminVariantsParams, AdminVariantListParams } from "../types";

export const variantInclude = Prisma.validator<Prisma.ProductVariantInclude>()({
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
      type: true,
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
      where: { uuid, deleted_at: null },
      include: variantInclude,
    });
  },

  async findById(id: number | bigint) {
    return db.productVariant.findFirst({
      where: { id: BigInt(id), deleted_at: null },
      include: variantInclude,
    });
  },

  async findBySku(sku: string, excludeUuid?: string) {
    return db.productVariant.findFirst({
      where: {
        sku,
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
      deleted_at: null,
      ...(productId ? { productId } : {}),
      product: {
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

  async findAdminVariants(params: AdminVariantListParams) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: Prisma.ProductVariantWhereInput = {
      deleted_at: null,
      product: {
        deleted_at: null,
      },
    };

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    // Filter by Product UUIDs
    if (params.productIds && params.productIds.length > 0) {
      const matchingProducts = await db.product.findMany({
        where: { uuid: { in: params.productIds }, deleted_at: null },
        select: { id: true },
      });
      where.productId = { in: matchingProducts.map((p) => p.id) };
    }

    // Filter by Brand UUIDs
    if (params.brandIds && params.brandIds.length > 0) {
      const matchingBrands = await db.productBrand.findMany({
        where: { uuid: { in: params.brandIds }, deleted_at: null },
        select: { id: true },
      });
      where.product = {
        ...(where.product as Prisma.ProductWhereInput),
        brandId: { in: matchingBrands.map((b) => b.id) },
      };
    }

    // Filter by Category UUIDs
    if (params.categoryIds && params.categoryIds.length > 0) {
      const matchingCategories = await db.productCategory.findMany({
        where: { uuid: { in: params.categoryIds }, deleted_at: null },
        select: { id: true },
      });
      where.product = {
        ...(where.product as Prisma.ProductWhereInput),
        categoryId: { in: matchingCategories.map((c) => c.id) },
      };
    }

    // Filter by Measurement Types (weight, volume, count)
    if (params.measurementTypes && params.measurementTypes.length > 0) {
      where.product_units = {
        type: { in: params.measurementTypes },
      };
    }

    // Filter by Unit UUIDs
    if (params.unitIds && params.unitIds.length > 0) {
      const matchingUnits = await db.product_units.findMany({
        where: { uuid: { in: params.unitIds } },
        select: { id: true },
      });
      where.unit_id = { in: matchingUnits.map((u) => u.id) };
    }

    // Search filter across variantName, SKU, and productName
    if (params.search) {
      where.OR = [
        { variant_name: { contains: params.search } },
        { sku: { contains: params.search } },
        { product: { name: { contains: params.search } } },
      ];
    }

    // Price range filter
    const minP = params.minPrice ?? undefined;
    const maxP = params.maxPrice ?? undefined;
    if ((minP !== undefined && minP !== null) || (maxP !== undefined && maxP !== null)) {
      const minVal = minP ?? 0;
      const maxVal = maxP ?? Number.MAX_SAFE_INTEGER;

      const priceConditions = [
        { sale_price: { gte: minVal, lte: maxVal } },
        { base_price: { gte: minVal, lte: maxVal } },
      ];

      if (where.OR) {
        where.AND = [{ OR: priceConditions }];
      } else {
        where.OR = priceConditions;
      }
    }

    // Sorting
    const sortOrder = params.sortOrder ?? "desc";
    let orderBy: Prisma.ProductVariantOrderByWithRelationInput = { createdAt: sortOrder };

    if (params.sortBy === "variantName") {
      orderBy = { variant_name: sortOrder };
    } else if (params.sortBy === "productName") {
      orderBy = { product: { name: sortOrder } };
    } else if (params.sortBy === "sku") {
      orderBy = { sku: sortOrder };
    } else if (params.sortBy === "basePrice") {
      orderBy = { base_price: sortOrder };
    } else if (params.sortBy === "salePrice") {
      orderBy = { sale_price: sortOrder };
    } else if (params.sortBy === "createdAt") {
      orderBy = { createdAt: sortOrder };
    } else if (params.sortBy === "updatedAt") {
      orderBy = { updatedAt: sortOrder };
    }

    const [data, total] = await Promise.all([
      db.productVariant.findMany({
        where,
        include: variantInclude,
        orderBy,
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
