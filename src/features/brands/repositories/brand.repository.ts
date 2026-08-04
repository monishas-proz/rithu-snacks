import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { GetBrandsParams } from "../types";

const brandListInclude = Prisma.validator<Prisma.ProductBrandInclude>()({
  _count: { select: { products: true } },
});

const brandDetailInclude = Prisma.validator<Prisma.ProductBrandInclude>()({
  products: {
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      isActive: true,
    },
  },
  _count: { select: { products: true } },
});

function buildBrandWhere(params: GetBrandsParams): Prisma.ProductBrandWhereInput {
  const where: Prisma.ProductBrandWhereInput = {};

  if (params.isActive !== undefined) {
    where.isActive = params.isActive;
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }

  return where;
}

export const brandRepository = {
  async findAll(params: GetBrandsParams = {}) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const where = buildBrandWhere(params);

    const [data, total] = await Promise.all([
      db.productBrand.findMany({
        where,
        include: brandListInclude,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.productBrand.count({ where }),
    ]);

    return {
      data,
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
    return db.productBrand.findFirst({
      where: {
        OR: [
          { slug: slugOrId },
          ...(numericId ? [{ id: numericId }] : []),
        ],
      },
      include: brandDetailInclude,
    });
  },

  async findById(id: number) {
    return db.productBrand.findUnique({
      where: { id },
      include: brandDetailInclude,
    });
  },

  async findBySlug(slug: string) {
    return db.productBrand.findUnique({
      where: { slug },
    });
  },

  async create(data: Prisma.ProductBrandCreateInput) {
    return db.productBrand.create({
      data,
      include: brandDetailInclude,
    });
  },

  async update(id: number, data: Prisma.ProductBrandUpdateInput) {
    return db.productBrand.update({
      where: { id },
      data,
      include: brandDetailInclude,
    });
  },

  async delete(id: number) {
    return db.productBrand.delete({ where: { id } });
  },

  async count(where?: Prisma.ProductBrandWhereInput) {
    return db.productBrand.count({ where });
  },
};
