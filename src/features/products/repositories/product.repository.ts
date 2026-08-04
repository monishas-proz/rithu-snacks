import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { GetProductsParams, GetProductsResult, ProductListItem } from "../types";

type ProductWithIncludes = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function toProductListItem(p: ProductWithIncludes): ProductListItem {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    sku: p.sku,
    price: Number(p.price),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
    discountPercent: Number(p.discountPercent),
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    category: p.category,
    brand: p.brand,
    images: p.images,
    _count: p._count,
  };
}

const productInclude = Prisma.validator<Prisma.ProductInclude>()({
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  images: {
    take: 1,
    orderBy: { isPrimary: "desc" as const },
    select: { id: true, url: true, altText: true },
  },
  _count: { select: { reviews: true, orderItems: true } },
});

const productDetailInclude = Prisma.validator<Prisma.ProductInclude>()({
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  images: {
    orderBy: { sortOrder: "asc" as const },
    select: { id: true, url: true, altText: true, isPrimary: true, sortOrder: true },
  },
  _count: { select: { reviews: true, orderItems: true } },
  variants: {
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      comparePrice: true,
      stockQuantity: true,
      weight: true,
      isActive: true,
    },
  },
  reviews: {
    where: { isApproved: true },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" as const },
    take: 10,
  },
});

function buildProductWhere(params: GetProductsParams): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { description: { contains: params.search } },
      { sku: { contains: params.search } },
    ];
  }

  if (params.category) {
    where.category = { slug: params.category };
  }

  if (params.brand) {
    where.brand = { slug: params.brand };
  }

  if (params.isFeatured !== undefined) {
    where.isFeatured = params.isFeatured;
  }

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    where.price = {};
    if (params.minPrice !== undefined) {
      where.price.gte = params.minPrice;
    }
    if (params.maxPrice !== undefined) {
      where.price.lte = params.maxPrice;
    }
  }

  return where;
}

function buildProductOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "name_asc":
      return { name: "asc" };
    case "name_desc":
      return { name: "desc" };
    case "popular":
      return { orderItems: { _count: "desc" } };
    case "rating":
      return { reviews: { _count: "desc" } };
    case "oldest":
      return { createdAt: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

export const productRepository = {
  async findAll(params: GetProductsParams): Promise<GetProductsResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 12;
    const skip = (page - 1) * limit;

    const where = buildProductWhere(params);
    const orderBy = buildProductOrderBy(params.sort);

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return {
      data: products.map(toProductListItem),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findBySlugOrId(slugOrId: string) {
    const numericId = parseInt(slugOrId);
    return db.product.findFirst({
      where: {
        OR: [
          { slug: slugOrId },
          ...(numericId ? [{ id: numericId }] : []),
        ],
      },
      include: productDetailInclude,
    });
  },

  async findById(id: number) {
    return db.product.findUnique({
      where: { id },
      include: productDetailInclude,
    });
  },

  async findBySlug(slug: string) {
    return db.product.findUnique({
      where: { slug },
      include: productDetailInclude,
    });
  },

  async create(data: Prisma.ProductCreateInput) {
    return db.product.create({
      data,
      include: productDetailInclude,
    });
  },

  async update(id: number, data: Prisma.ProductUpdateInput) {
    return db.product.update({
      where: { id },
      data,
      include: productDetailInclude,
    });
  },

  async delete(id: number) {
    return db.product.delete({ where: { id } });
  },

  async count(where?: Prisma.ProductWhereInput) {
    return db.product.count({ where });
  },

  async findMany(args: Prisma.ProductFindManyArgs) {
    return db.product.findMany(args);
  },
};
