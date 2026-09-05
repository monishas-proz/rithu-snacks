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
  CustomerVariantUnitPriceDto,
} from "../types/catalog.types";

/**
 * Selling price is not stored on the unit price row - it is basePrice minus
 * any active offer/discount, computed here at read time. No offer/discount
 * engine is wired up for the storefront yet, so this currently returns
 * basePrice unchanged. When one exists, apply it here so every price shown
 * to customers (list, detail, cart, wishlist) flows through this single
 * function instead of reading base_price directly.
 */
function computeSellingPrice(basePrice: number): number {
  return basePrice;
}

// Unit prices are always loaded with this shape when we need to derive a
// variant's display sku/price/measurement (the storefront still shows one
// price per variant - the default unit price - since cart/wishlist/orders
// key off the item-level variant, not a specific unit price).
const unitPriceListArgs = {
  where: { deleted_at: null, isActive: true },
  include: {
    product_units: {
      select: { id: true, uuid: true, name: true, code: true, type: true },
    },
  },
  orderBy: [{ is_default: "desc" as const }, { createdAt: "asc" as const }],
};

type VariantUnitPriceForDto = {
  uuid: string;
  sku: string;
  base_price: Prisma.Decimal | number;
  unit_value: Prisma.Decimal | number;
  is_default: boolean;
  product_units: { id: bigint; uuid: string | null; name: string; code: string; type: string } | null;
};

function pickDefaultUnitPrice(
  unitPrices: VariantUnitPriceForDto[] | null | undefined
): VariantUnitPriceForDto | null {
  if (!unitPrices || unitPrices.length === 0) return null;
  return unitPrices.find((up) => up.is_default) ?? unitPrices[0];
}

function toVariantListItemDto(
  variant: {
    id: bigint;
    uuid: string;
    variant_name: string | null;
    out_of_stock?: boolean;
    ingredients?: string | null;
    is_ready_to_mix?: boolean;
    cooking_recipe?: string | null;
    shelf_life?: string | null;
    variant_unit_prices?: VariantUnitPriceForDto[] | null;
    product_variant_images?: Array<{ image_url: string }> | null;
  },
  productUuid: string,
  productName: string
): CustomerVariantListItemDto {
  const defaultUnitPrice = pickDefaultUnitPrice(variant.variant_unit_prices);

  const unitPrices: CustomerVariantUnitPriceDto[] = (
    variant.variant_unit_prices || []
  ).map((up) => {
    const basePrice = Number(up.base_price);
    return {
      id: up.uuid,
      sku: up.sku,
      measurement: formatVariantMeasurement(up.product_units, up.unit_value ?? 0),
      basePrice,
      sellingPrice: computeSellingPrice(basePrice),
      isDefault: Boolean(up.is_default),
    };
  });

  return {
    id: variant.uuid || String(variant.id),
    productId: productUuid,
    productName,
    variantName: variant.variant_name || "",
    measurement: formatVariantMeasurement(
      defaultUnitPrice?.product_units,
      defaultUnitPrice?.unit_value ?? 0
    ),
    sku: defaultUnitPrice?.sku ?? "",
    basePrice: defaultUnitPrice ? Number(defaultUnitPrice.base_price) : 0,
    // Selling price is not stored - it is basePrice minus any active
    // offer/discount (see computeSellingPrice). Mirrored here for callers
    // that still read `salePrice` directly instead of `unitPrices`.
    salePrice: defaultUnitPrice
      ? computeSellingPrice(Number(defaultUnitPrice.base_price))
      : 0,
    primaryImage: variant.product_variant_images?.[0]?.image_url ?? null,
    outOfStock: Boolean(variant.out_of_stock),
    ingredients: variant.ingredients ?? null,
    isReadyToMix: Boolean(variant.is_ready_to_mix),
    cookingRecipe: variant.cooking_recipe ?? null,
    shelfLife: variant.shelf_life ?? null,
    unitPrices,
  };
}

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
      where.OR = [{ name: { contains: params.search } }];
    }

    // Price range filter on active variants' unit prices
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      const minP = params.minPrice ?? 0;
      const maxP = params.maxPrice ?? Number.MAX_SAFE_INTEGER;

      where.variants = {
        some: {
          isActive: true,
          deleted_at: null,
          variant_unit_prices: {
            some: {
              deleted_at: null,
              isActive: true,
              base_price: { gte: minP, lte: maxP },
            },
          },
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
              variant_unit_prices: unitPriceListArgs,
            },
          },
        },
      }),
      db.product.count({ where }),
    ]);

    // Map each product & calculate minPrice/maxPrice across all variants' unit prices
    let items: CustomerProductListItemDto[] = products.map((p) => {
      const allPrices = p.variants.flatMap((v) =>
        (v.variant_unit_prices || []).map((up) => Number(up.base_price))
      );

      let minP = allPrices.length > 0 ? Math.min(...allPrices) : 0;
      let maxP = allPrices.length > 0 ? Math.max(...allPrices) : 0;

      // Resolve primary image from product.images or variant images
      let imgUrl: string | null = p.images[0]?.image_url ?? null;
      if (!imgUrl && p.variants.length > 0) {
        imgUrl = p.variants[0].product_variant_images[0]?.image_url ?? null;
      }

      const primaryVariant =
        p.variants.find((v) => v.is_default) ?? p.variants[0] ?? null;

      return {
        id: p.uuid || String(p.id),
        name: p.name,
        description:
          primaryVariant?.short_description || primaryVariant?.description || null,
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
            product_variant_images: {
              where: { is_active: true },
              orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }],
            },
            variant_unit_prices: unitPriceListArgs,
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

    const productUuid = product.uuid || String(product.id);
    const variantsDto: CustomerVariantListItemDto[] = product.variants.map((v) =>
      toVariantListItemDto(v, productUuid, product.name)
    );

    const primaryVariant =
      product.variants.find((v) => v.is_default) ?? product.variants[0] ?? null;

    return {
      id: productUuid,
      name: product.name,
      description:
        primaryVariant?.description || primaryVariant?.short_description || null,
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
        { variant_unit_prices: { some: { sku: { contains: params.search } } } },
      ];
    }

    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      const minP = params.minPrice ?? 0;
      const maxP = params.maxPrice ?? Number.MAX_SAFE_INTEGER;

      where.variant_unit_prices = {
        some: {
          deleted_at: null,
          isActive: true,
          base_price: { gte: minP, lte: maxP },
        },
      };
    }

    // Price/sku sorting now lives on VariantUnitPrice (one-to-many), so we
    // fetch by createdAt/variantName at the DB level and, when price sorting
    // is requested, sort in-memory by each variant's default unit price.
    let orderBy: Prisma.ProductVariantOrderByWithRelationInput = { createdAt: "desc" };
    if (params.sortBy === "variantName") {
      orderBy = { variant_name: params.sortOrder ?? "asc" };
    } else if (params.sortBy === "createdAt") {
      orderBy = { createdAt: params.sortOrder ?? "desc" };
    }

    const isPriceSort = params.sortBy === "basePrice" || params.sortBy === "salePrice";

    const [variants, total] = await Promise.all([
      db.productVariant.findMany({
        where,
        orderBy,
        ...(isPriceSort ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
        include: {
          product_variant_images: {
            where: { is_active: true },
            orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }],
            take: 1,
          },
          variant_unit_prices: unitPriceListArgs,
        },
      }),
      db.productVariant.count({ where }),
    ]);

    let data: CustomerVariantListItemDto[] = variants.map((v) =>
      toVariantListItemDto(v, product.uuid || String(product.id), product.name)
    );

    if (isPriceSort) {
      const isAsc = params.sortOrder !== "desc";
      data.sort((a, b) => (isAsc ? a.basePrice - b.basePrice : b.basePrice - a.basePrice));
      data = data.slice((page - 1) * pageSize, page * pageSize);
    }

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
        product_variant_images: {
          where: { is_active: true },
          orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }],
        },
        variant_unit_prices: unitPriceListArgs,
      },
    });

    if (!variant || !variant.product) return null;

    const images: CustomerVariantImageDto[] = variant.product_variant_images.map((img) => ({
      id: img.uuid || String(img.id),
      imageUrl: img.image_url,
      sortOrder: img.sort_order,
      isPrimary: Boolean(img.is_primary),
    }));

    const listItem = toVariantListItemDto(
      variant,
      variant.product.uuid || String(variant.product.id),
      variant.product.name
    );

    return {
      ...listItem,
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
        { variant_unit_prices: { some: { sku: { contains: params.search } } } },
        { product: { name: { contains: params.search } } },
      ];
    }

    // Price range filter
    const minP = params.minPrice ?? undefined;
    const maxP = params.maxPrice ?? undefined;
    if ((minP !== undefined && minP !== null) || (maxP !== undefined && maxP !== null)) {
      const minVal = minP ?? 0;
      const maxVal = maxP ?? Number.MAX_SAFE_INTEGER;

      const priceCondition: Prisma.ProductVariantWhereInput = {
        variant_unit_prices: {
          some: { deleted_at: null, isActive: true, base_price: { gte: minVal, lte: maxVal } },
        },
      };

      if (where.OR) {
        where.AND = [priceCondition];
      } else {
        Object.assign(where, priceCondition);
      }
    }

    // Sorting
    let orderBy: Prisma.ProductVariantOrderByWithRelationInput = { createdAt: "desc" };
    if (params.sortBy === "variantName") {
      orderBy = { variant_name: params.sortOrder ?? "asc" };
    } else if (params.sortBy === "productName") {
      orderBy = { product: { name: params.sortOrder ?? "asc" } };
    } else if (params.sortBy === "createdAt") {
      orderBy = { createdAt: params.sortOrder ?? "desc" };
    }

    const isPriceSort = params.sortBy === "basePrice" || params.sortBy === "salePrice";

    const [variants, total] = await Promise.all([
      db.productVariant.findMany({
        where,
        orderBy,
        ...(isPriceSort ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
        include: {
          product: {
            select: { id: true, uuid: true, name: true },
          },
          product_variant_images: {
            where: { is_active: true },
            orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }],
            take: 1,
          },
          variant_unit_prices: unitPriceListArgs,
        },
      }),
      db.productVariant.count({ where }),
    ]);

    let data: CustomerVariantListItemDto[] = variants.map((v) =>
      toVariantListItemDto(
        v,
        v.product ? v.product.uuid || String(v.product.id) : "",
        v.product ? v.product.name : ""
      )
    );

    if (isPriceSort) {
      const isAsc = params.sortOrder !== "desc";
      data.sort((a, b) => (isAsc ? a.basePrice - b.basePrice : b.basePrice - a.basePrice));
      data = data.slice((page - 1) * pageSize, page * pageSize);
    }

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
