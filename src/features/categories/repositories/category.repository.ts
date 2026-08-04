import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { GetCategoriesParams, CreateCategoryInput, UpdateCategoryInput } from "../types";

const categoryListInclude = Prisma.validator<Prisma.ProductCategoryInclude>()({
  _count: { select: { products: true, children: true } },
});

const categoryDetailInclude = Prisma.validator<Prisma.ProductCategoryInclude>()({
  parent: { select: { id: true, name: true, slug: true } },
  children: {
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      _count: { select: { products: true } },
    },
  },
  _count: { select: { products: true, children: true } },
});

function buildCategoryWhere(params: GetCategoriesParams): Prisma.ProductCategoryWhereInput {
  const where: Prisma.ProductCategoryWhereInput = { isActive: true };

  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }

  if (params.parentId !== undefined) {
    where.parentId = params.parentId;
  }

  return where;
}

export const categoryRepository = {
  async findAll(params: GetCategoriesParams = {}) {
    const where = buildCategoryWhere(params);
    return db.productCategory.findMany({
      where,
      include: categoryListInclude,
      orderBy: { sortOrder: "asc" },
    });
  },

  async findBySlugOrId(slugOrId: string) {
    const numericId = parseInt(slugOrId);
    return db.productCategory.findFirst({
      where: {
        OR: [
          { slug: slugOrId },
          ...(numericId ? [{ id: numericId }] : []),
        ],
      },
      include: categoryDetailInclude,
    });
  },

  async findById(id: number) {
    return db.productCategory.findUnique({
      where: { id },
      include: categoryDetailInclude,
    });
  },

  async findBySlug(slug: string) {
    return db.productCategory.findUnique({
      where: { slug },
      include: categoryDetailInclude,
    });
  },

  async create(data: Prisma.ProductCategoryCreateInput) {
    return db.productCategory.create({
      data,
      include: categoryDetailInclude,
    });
  },

  async update(id: number, data: Prisma.ProductCategoryUpdateInput) {
    return db.productCategory.update({
      where: { id },
      data,
      include: categoryDetailInclude,
    });
  },

  async delete(id: number) {
    return db.productCategory.delete({ where: { id } });
  },

  async count(where?: Prisma.ProductCategoryWhereInput) {
    return db.productCategory.count({ where });
  },
};
