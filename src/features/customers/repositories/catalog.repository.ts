import { db } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma";
import { formatVariantMeasurement } from "@/features/variants/utils/measurement.util";
import type {
  CustomerBrandListInput,
  CustomerCategoryListInput,
  CustomerProductListInput,
  CustomerVariantListInput,
  CustomerGlobalVariantListInput,
} from "../validations/catalog.schema";
import type {
  CustomerBrandDto,
  CustomerCategoryDto,
  CustomerProductListItemDto,
  CustomerProductDetailDto,
  CustomerVariantListItemDto,
  CustomerVariantDetailDto,
  CustomerVariantImageDto,
} from "../types/catalog.types";

export const catalogRepository = {
  // ----------------------------------------------------
  // BRAND REPOSITORY METHODS
  // ----------------------------------------------------
  async findCustomerBrands(params: CustomerBrandListInput) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: Prisma.ProductBrandWhereInput = {
      isActive: true,
      deleted_at: null,
      status: true,
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { description: { contains: params.search } },
      ];
    }

    const orderBy: Prisma.ProductBrandOrderByWithRelationInput =
      params.sortBy === "createdAt"
        ? { createdAt: params.sortOrder ?? "asc" }
        : { name: params.sortOrder ?? "asc" };

    const [brands, total] = await Promise.all([
      db.productBrand.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          produt_brand_images: {
            where: { is_active: true },
            take: 1,
          },
        },
      }),
      db.productBrand.count({ where }),
    ]);

    const data: CustomerBrandDto[] = brands.map((b) => ({
      id: b.uuid || String(b.id),
      name: b.name,
      image: b.produt_brand_images[0]?.image_url ?? null,
    }));

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

  async findCustomerBrandByUuid(uuid: string): Promise<CustomerBrandDto | null> {
    const brand = await db.productBrand.findFirst({
      where: {
        uuid,
        isActive: true,
        deleted_at: null,
        status: true,
      },
      include: {
        produt_brand_images: {
          where: { is_active: true },
          take: 1,
        },
      },
    });

    if (!brand) return null;

    return {
      id: brand.uuid || String(brand.id),
      name: brand.name,
      image: brand.produt_brand_images[0]?.image_url ?? null,
    };
  },

  // ----------------------------------------------------
  // CATEGORY REPOSITORY METHODS
  // ----------------------------------------------------
  async findCustomerCategories(params: CustomerCategoryListInput) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: Prisma.ProductCategoryWhereInput = {
      isActive: true,
      deleted_at: null,
      status: true,
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { description: { contains: params.search } },
      ];
    }

    const orderBy: Prisma.ProductCategoryOrderByWithRelationInput =
      params.sortBy === "createdAt"
        ? { createdAt: params.sortOrder ?? "asc" }
        : { name: params.sortOrder ?? "asc" };

    const [categories, total] = await Promise.all([
      db.productCategory.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          product_category_images: {
            where: { is_active: true },
            take: 1,
          },
        },
      }),
      db.productCategory.count({ where }),
    ]);

    const data: CustomerCategoryDto[] = categories.map((c) => ({
      id: c.uuid || String(c.id),
      name: c.name,
      image: c.icon || c.product_category_images[0]?.image_url || null,
    }));

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

  async findCustomerCategoryByUuid(uuid: string): Promise<CustomerCategoryDto | null> {
    const category = await db.productCategory.findFirst({
      where: {
        uuid,
        isActive: true,
        deleted_at: null,
        status: true,
      },
      include: {
        product_category_images: {
          where: { is_active: true },
          take: 1,
        },
      },
    });

    if (!category) return null;

    return {
      id: category.uuid || String(category.id),
      name: category.name,
      image: category.icon || category.product_category_images[0]?.image_url || null,
    };
  },

  // ----------------------------------------------------
  // PRODUCT REPOSITORY METHODS
  // ----------------------------------------------------
  async findCustomerProducts(params: CustomerProductListInput) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      deleted_at: null,
    };

    // Filter by Brand UUIDs
    if (params.brandIds && params.brandIds.length > 0) {
      const matchingBrands = await db.productBrand.findMany({
        where: { uuid: { in: params.brandIds }, isActive: true, deleted_at: null },
        select: { id: true },
      });
      where.brandId = { in: matchingBrands.map((b) => b.id) };
    }

    // Filter by Category UUIDs
    if (params.categoryIds && params.categoryIds.length > 0) {
      const matchingCategories = await db.productCategory.findMany({
        where: { uuid: { in: params.categoryIds }, isActive: true, deleted_at: null },
        select: { id: true },
      });
      where.categoryId = { in: matchingCategories.map((c) => c.id) };
    }

    // Search filter
    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { description: { contains: params.search } },
        { shortDescription: { contains: params.search } },
      ];
    }

    // Price range filter on active variants
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      const minP = params.minPrice ?? 0;
      const maxP = params.maxPrice ?? Number.MAX_SAFE_INTEGER;

      where.variants = {
        some: {
          isActive: true,
          deleted_at: null,
          OR: [
            {
              sale_price: { gte: minP, lte: maxP },
            },
            {
              base_price: { gte: minP, lte: maxP },
            },
          ],
        },
      };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (params.sortBy === "name") {
      orderBy = { name: params.sortOrder ?? "asc" };
    } else if (params.sortBy === "createdAt") {
      orderBy = { createdAt: params.sortOrder ?? "desc" };
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy: params.sortBy === "price" ? undefined : orderBy,
        ...(params.sortBy === "price" ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
        include: {
          brand: { select: { id: true, uuid: true, name: true } },
          images: {
            where: { is_active: true },
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            take: 1,
          },
          variants: {
            where: { isActive: true, deleted_at: null },
            include: {
              product_variant_images: {
                where: { is_active: true },
                orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }],
                take: 1,
              },
            },
          },
        },
      }),
      db.product.count({ where }),
    ]);

    // Map each product & calculate minPrice/maxPrice
    let items: CustomerProductListItemDto[] = products.map((p) => {
      let minP = Number(p.base_price);
      let maxP = Number(p.base_price);

      if (p.variants.length > 0) {
        const prices = p.variants.map((v) =>
          v.sale_price !== null ? Number(v.sale_price) : Number(v.base_price)
        );
        minP = Math.min(...prices);
        maxP = Math.max(...prices);
      }

      // Resolve primary image from product.images or variant images
      let imgUrl: string | null = p.images[0]?.image_url ?? null;
      if (!imgUrl && p.variants.length > 0) {
        imgUrl = p.variants[0].product_variant_images[0]?.image_url ?? null;
      }

      return {
        id: p.uuid || String(p.id),
        name: p.name,
        description: p.shortDescription || p.description || null,
        brand: p.brand
          ? {
              id: p.brand.uuid || String(p.brand.id),
              name: p.brand.name,
            }
          : null,
        category: null,
        image: imgUrl,
        minPrice: minP,
        maxPrice: maxP,
      };
    });

    // Populate category UUID/name if categoryId exists
    const categoryIds = products
      .map((p) => p.categoryId)
      .filter((id): id is bigint => id !== null && id !== undefined);

    if (categoryIds.length > 0) {
      const categories = await db.productCategory.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, uuid: true, name: true },
      });
      const catMap = new Map(categories.map((c) => [c.id.toString(), c]));

      products.forEach((p, idx) => {
        if (p.categoryId) {
          const cat = catMap.get(p.categoryId.toString());
          if (cat) {
            items[idx].category = {
              id: cat.uuid || String(cat.id),
              name: cat.name,
            };
          }
        }
      });
    }

    // Handle price sorting in JavaScript if requested
    if (params.sortBy === "price") {
      const isAsc = params.sortOrder === "asc";
      items.sort((a, b) => (isAsc ? a.minPrice - b.minPrice : b.minPrice - a.minPrice));
      items = items.slice((page - 1) * pageSize, page * pageSize);
    }

    return {
      data: items,
      meta: {
        page,
        limit: pageSize,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async findCustomerProductByUuid(uuid: string): Promise<CustomerProductDetailDto | null> {
    const product = await db.product.findFirst({
      where: {
        uuid,
        isActive: true,
        deleted_at: null,
      },
      include: {
        brand: { select: { id: true, uuid: true, name: true } },
        images: {
          where: { is_active: true },
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        },
        variants: {
          where: { isActive: true, deleted_at: null },
          include: {
            product_units: {
              select: { id: true, uuid: true, name: true, code: true, type: true },
            },
            product_variant_images: {
              where: { is_active: true },
              orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }],
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!product) return null;

    let categoryDto: { id: string; name: string } | null = null;
    if (product.categoryId) {
      const cat = await db.productCategory.findFirst({
        where: { id: product.categoryId },
        select: { id: true, uuid: true, name: true },
      });
      if (cat) {
        categoryDto = {
          id: cat.uuid || String(cat.id),
          name: cat.name,
        };
      }
    }

    let imgUrl: string | null = product.images[0]?.image_url ?? null;
    if (!imgUrl && product.variants.length > 0) {
      imgUrl = product.variants[0].product_variant_images[0]?.image_url ?? null;
    }

    const variantsDto: CustomerVariantListItemDto[] = product.variants.map((v) => {
      const primaryImg = v.product_variant_images[0]?.image_url ?? null;
      return {
        id: v.uuid || String(v.id),
        productId: product.uuid || String(product.id),
        productName: product.name,
        variantName: v.variant_name || `${v.unit_value} ${v.product_units?.code || ""}`,
        measurement: formatVariantMeasurement(v.product_units, v.unit_value),
        sku: v.sku,
        basePrice: Number(v.base_price),
        salePrice: v.sale_price !== null && Number(v.sale_price) > 0 ? Number(v.sale_price) : Number(v.base_price),
        primaryImage: primaryImg,
        outOfStock: Boolean(v.out_of_stock),
      };
    });

    return {
      id: product.uuid || String(product.id),
      name: product.name,
      description: product.description || product.shortDescription || null,
      brand: product.brand
        ? {
            id: product.brand.uuid || String(product.brand.id),
            name: product.brand.name,
          }
        : null,
      category: categoryDto,
      image: imgUrl,
      variants: variantsDto,
    };
  },

  // ----------------------------------------------------
  // VARIANT REPOSITORY METHODS
  // ----------------------------------------------------
  async findCustomerVariantsByProductUuid(
    productUuid: string,
    params: CustomerVariantListInput
  ) {
    const product = await db.product.findFirst({
      where: {
        uuid: productUuid,
        isActive: true,
        deleted_at: null,
      },
      select: { id: true, uuid: true, name: true },
    });

    if (!product) return null;

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: Prisma.ProductVariantWhereInput = {
      productId: product.id,
      isActive: true,
      deleted_at: null,
    };

    if (params.search) {
      where.OR = [
        { variant_name: { contains: params.search } },
        { sku: { contains: params.search } },
      ];
    }

    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      const minP = params.minPrice ?? 0;
      const maxP = params.maxPrice ?? Number.MAX_SAFE_INTEGER;

      where.OR = [
        {
          sale_price: { gte: minP, lte: maxP },
        },
        {
          base_price: { gte: minP, lte: maxP },
        },
      ];
    }

    let orderBy: Prisma.ProductVariantOrderByWithRelationInput = { createdAt: "desc" };
    if (params.sortBy === "variantName") {
      orderBy = { variant_name: params.sortOrder ?? "asc" };
    } else if (params.sortBy === "basePrice") {
      orderBy = { base_price: params.sortOrder ?? "asc" };
    } else if (params.sortBy === "salePrice") {
      orderBy = { sale_price: params.sortOrder ?? "asc" };
    } else if (params.sortBy === "createdAt") {
      orderBy = { createdAt: params.sortOrder ?? "desc" };
    }

    const [variants, total] = await Promise.all([
      db.productVariant.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          product_units: {
            select: { id: true, uuid: true, name: true, code: true, type: true },
          },
          product_variant_images: {
            where: { is_active: true },
            orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }],
            take: 1,
          },
        },
      }),
      db.productVariant.count({ where }),
    ]);

    const data: CustomerVariantListItemDto[] = variants.map((v) => ({
      id: v.uuid || String(v.id),
      productId: product.uuid || String(product.id),
      productName: product.name,
      variantName: v.variant_name || `${v.unit_value} ${v.product_units?.code || ""}`,
      measurement: formatVariantMeasurement(v.product_units, v.unit_value),
      sku: v.sku,
      basePrice: Number(v.base_price),
      salePrice: v.sale_price !== null ? Number(v.sale_price) : Number(v.base_price),
      primaryImage: v.product_variant_images[0]?.image_url ?? null,
      outOfStock: Boolean(v.out_of_stock),
    }));

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

  async findCustomerVariantByUuids(
    productUuid: string,
    variantUuid: string
  ): Promise<CustomerVariantDetailDto | null> {
    const variant = await db.productVariant.findFirst({
      where: {
        uuid: variantUuid,
        isActive: true,
        deleted_at: null,
        product: {
          uuid: productUuid,
          isActive: true,
          deleted_at: null,
        },
      },
      include: {
        product: {
          select: { id: true, uuid: true, name: true },
        },
        product_units: {
          select: { id: true, uuid: true, name: true, code: true, type: true },
        },
        product_variant_images: {
          where: { is_active: true },
          orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }],
        },
      },
    });

    if (!variant || !variant.product) return null;

    const images: CustomerVariantImageDto[] = variant.product_variant_images.map((img) => ({
      id: img.uuid || String(img.id),
      imageUrl: img.image_url,
      sortOrder: img.sort_order,
      isPrimary: Boolean(img.is_primary),
    }));

    const primaryImg =
      variant.product_variant_images.find((img) => img.is_primary)?.image_url ||
      variant.product_variant_images[0]?.image_url ||
      null;

    return {
      id: variant.uuid || String(variant.id),
      productId: variant.product.uuid || String(variant.product.id),
      productName: variant.product.name,
      variantName: variant.variant_name || `${variant.unit_value} ${variant.product_units?.code || ""}`,
      measurement: formatVariantMeasurement(variant.product_units, variant.unit_value),
      sku: variant.sku,
      basePrice: Number(variant.base_price),
      salePrice: variant.sale_price !== null ? Number(variant.sale_price) : Number(variant.base_price),
      primaryImage: primaryImg,
      outOfStock: Boolean(variant.out_of_stock),
      images,
    };
  },

  async findCustomerGlobalVariants(params: CustomerGlobalVariantListInput) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: Prisma.ProductVariantWhereInput = {
      isActive: true,
      deleted_at: null,
      product: {
        isActive: true,
        deleted_at: null,
      },
    };

    // Filter by Product UUIDs
    if (params.productIds && params.productIds.length > 0) {
      const matchingProducts = await db.product.findMany({
        where: { uuid: { in: params.productIds }, isActive: true, deleted_at: null },
        select: { id: true },
      });
      const pIds = matchingProducts.map((p) => p.id);
      where.productId = { in: pIds };
    }

    // Filter by Brand UUIDs
    if (params.brandIds && params.brandIds.length > 0) {
      const matchingBrands = await db.productBrand.findMany({
        where: { uuid: { in: params.brandIds }, isActive: true, deleted_at: null },
        select: { id: true },
      });
      const bIds = matchingBrands.map((b) => b.id);
      where.product = {
        ...(where.product as Prisma.ProductWhereInput),
        brandId: { in: bIds },
      };
    }

    // Filter by Category UUIDs
    if (params.categoryIds && params.categoryIds.length > 0) {
      const matchingCategories = await db.productCategory.findMany({
        where: { uuid: { in: params.categoryIds }, isActive: true, deleted_at: null },
        select: { id: true },
      });
      const cIds = matchingCategories.map((c) => c.id);
      where.product = {
        ...(where.product as Prisma.ProductWhereInput),
        categoryId: { in: cIds },
      };
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
    if (minP !== undefined && minP !== null || maxP !== undefined && maxP !== null) {
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
    let orderBy: Prisma.ProductVariantOrderByWithRelationInput = { createdAt: "desc" };
    if (params.sortBy === "variantName") {
      orderBy = { variant_name: params.sortOrder ?? "asc" };
    } else if (params.sortBy === "basePrice") {
      orderBy = { base_price: params.sortOrder ?? "asc" };
    } else if (params.sortBy === "salePrice") {
      orderBy = { sale_price: params.sortOrder ?? "asc" };
    } else if (params.sortBy === "productName") {
      orderBy = { product: { name: params.sortOrder ?? "asc" } };
    } else if (params.sortBy === "createdAt") {
      orderBy = { createdAt: params.sortOrder ?? "desc" };
    }

    const [variants, total] = await Promise.all([
      db.productVariant.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          product: {
            select: { id: true, uuid: true, name: true },
          },
          product_units: {
            select: { id: true, uuid: true, name: true, code: true, type: true },
          },
          product_variant_images: {
            where: { is_active: true },
            orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }],
            take: 1,
          },
        },
      }),
      db.productVariant.count({ where }),
    ]);

    const data: CustomerVariantListItemDto[] = variants.map((v) => ({
      id: v.uuid || String(v.id),
      productId: v.product ? v.product.uuid || String(v.product.id) : "",
      productName: v.product ? v.product.name : "",
      variantName: v.variant_name || `${v.unit_value} ${v.product_units?.code || ""}`,
      measurement: formatVariantMeasurement(v.product_units, v.unit_value),
      sku: v.sku,
      basePrice: Number(v.base_price),
      salePrice: v.sale_price !== null ? Number(v.sale_price) : Number(v.base_price),
      primaryImage: v.product_variant_images[0]?.image_url ?? null,
      outOfStock: Boolean(v.out_of_stock),
    }));

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
};
