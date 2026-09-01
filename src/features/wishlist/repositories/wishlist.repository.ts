import crypto from "crypto";
import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import { formatVariantMeasurement } from "@/features/variants/utils/measurement.util";
import type {
  CustomerWishlistItemDto,
  CustomerWishlistResponse,
} from "../types/wishlist.types";

export const wishlistItemInclude = Prisma.validator<Prisma.WishlistItemInclude>()({
  product: {
    select: {
      id: true,
      uuid: true,
      name: true,
      slug: true,
      isActive: true,
      deleted_at: true,
      images: {
        where: { is_active: true },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 1,
        select: { image_url: true },
      },
    },
  },
  product_variants: {
    select: {
      id: true,
      uuid: true,
      variant_name: true,
      sku: true,
      base_price: true,
      sale_price: true,
      unit_value: true,
      isActive: true,
      deleted_at: true,
      product_units: {
        select: {
          id: true,
          uuid: true,
          name: true,
          code: true,
          type: true,
        },
      },
      product_variant_images: {
        where: { is_active: true },
        orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }],
        take: 1,
        select: { image_url: true },
      },
    },
  },
});

export function formatWishlistItem(
  item: Prisma.WishlistItemGetPayload<{ include: typeof wishlistItemInclude }>
): CustomerWishlistItemDto | null {
  const variant = item.product_variants;
  const product = item.product;
  if (!variant || !product) return null;

  const salePrice =
    variant.sale_price !== null && Number(variant.sale_price) > 0
      ? Number(variant.sale_price)
      : null;
  const basePrice = Number(variant.base_price);
  const livePrice = salePrice ?? basePrice;

  const primaryImage =
    variant.product_variant_images?.[0]?.image_url ||
    product.images?.[0]?.image_url ||
    null;

  const measurement = formatVariantMeasurement(
    variant.product_units,
    variant.unit_value
  );

  const isAvailable =
    Boolean(variant.isActive) &&
    variant.deleted_at === null &&
    Boolean(product.isActive) &&
    product.deleted_at === null;

  return {
    id: item.uuid || String(item.id),
    variantId: variant.uuid || String(variant.id),
    variantName: variant.variant_name,
    sku: variant.sku,
    price: livePrice,
    basePrice,
    salePrice,
    measurement,
    primaryImage,
    isAvailable,
    product: {
      id: product.uuid || String(product.id),
      name: product.name,
      slug: product.slug,
    },
    createdAt: item.createdAt,
  };
}

export const wishlistRepository = {
  async findActiveWishlistByUserId(
    userId: bigint
  ): Promise<CustomerWishlistResponse> {
    const items = await db.wishlistItem.findMany({
      where: {
        userId,
        is_active: true,
      },
      include: wishlistItemInclude,
      orderBy: { createdAt: "desc" },
    });

    const formattedItems: CustomerWishlistItemDto[] = [];
    for (const item of items) {
      const formatted = formatWishlistItem(item);
      if (formatted) {
        formattedItems.push(formatted);
      }
    }

    return {
      items: formattedItems,
      totalItems: formattedItems.length,
    };
  },

  async findWishlistItemByUserAndVariant(userId: bigint, variantId: bigint) {
    return db.wishlistItem.findFirst({
      where: {
        userId,
        variant_id: variantId,
      },
      include: wishlistItemInclude,
    });
  },

  async addOrReactivateWishlistItem(params: {
    userId: bigint;
    productId: bigint;
    variantId: bigint;
    userInternalId: bigint;
  }): Promise<CustomerWishlistItemDto> {
    const existing = await db.wishlistItem.findFirst({
      where: {
        userId: params.userId,
        variant_id: params.variantId,
      },
      include: wishlistItemInclude,
    });

    if (existing) {
      if (!existing.is_active) {
        const updated = await db.wishlistItem.update({
          where: { id: existing.id },
          data: {
            is_active: true,
            updated_at: new Date(),
            updated_by: params.userInternalId,
          },
          include: wishlistItemInclude,
        });
        const formatted = formatWishlistItem(updated);
        if (!formatted) throw new Error("Failed to format wishlist item");
        return formatted;
      }
      const formatted = formatWishlistItem(existing);
      if (!formatted) throw new Error("Failed to format wishlist item");
      return formatted;
    }

    const created = await db.wishlistItem.create({
      data: {
        uuid: crypto.randomUUID(),
        userId: params.userId,
        productId: params.productId,
        variant_id: params.variantId,
        is_active: true,
        created_by: params.userInternalId,
        updated_by: params.userInternalId,
      },
      include: wishlistItemInclude,
    });

    const formatted = formatWishlistItem(created);
    if (!formatted) throw new Error("Failed to format wishlist item");
    return formatted;
  },

  async softRemoveWishlistItem(
    userId: bigint,
    variantId: bigint,
    userInternalId?: bigint
  ): Promise<boolean> {
    const existing = await db.wishlistItem.findFirst({
      where: {
        userId,
        variant_id: variantId,
        is_active: true,
      },
    });

    if (!existing) return false;

    await db.wishlistItem.update({
      where: { id: existing.id },
      data: {
        is_active: false,
        updated_at: new Date(),
        updated_by: userInternalId ?? userId,
      },
    });

    return true;
  },

  async getWishlistItemCount(userId: bigint): Promise<number> {
    return db.wishlistItem.count({
      where: {
        userId,
        is_active: true,
        product_variants: {
          isActive: true,
          deleted_at: null,
        },
        product: {
          isActive: true,
          deleted_at: null,
        },
      },
    });
  },
};
