import { db } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/api-error";
import { userRepository } from "@/features/users/repositories/user.repository";
import { cartService } from "@/features/cart/services/cart.service";
import { wishlistRepository } from "../repositories/wishlist.repository";
import type { AddWishlistInput } from "../validations/wishlist.schema";
import type {
  CustomerWishlistItemDto,
  CustomerWishlistResponse,
} from "../types/wishlist.types";

async function resolveInternalUser(sessionUserId: string) {
  const user = await userRepository.findById(sessionUserId);
  if (!user || !user.internalId) {
    throw ApiError.unauthorized("User not found or unauthorized");
  }
  if (!user.isActive || user.is_active === false) {
    throw ApiError.forbidden("Your account is inactive or blocked. Please contact support.");
  }
  return user;
}

async function validateActiveVariantUnitPrice(identifier: string) {
  let unitPrice = await db.variantUnitPrice.findFirst({
    where: {
      uuid: identifier,
      deleted_at: null,
    },
    include: {
      variant: {
        include: { product: true },
      },
    },
  });

  if (!unitPrice) {
    // Try looking up by variant UUID
    unitPrice = await db.variantUnitPrice.findFirst({
      where: {
        variant: { uuid: identifier },
        deleted_at: null,
      },
      orderBy: [{ is_default: "desc" }, { createdAt: "asc" }],
      include: {
        variant: {
          include: { product: true },
        },
      },
    });
  }

  if (!unitPrice || unitPrice.deleted_at !== null) {
    throw ApiError.notFound("Product pack size not found");
  }

  const variant = unitPrice.variant;

  if (
    !unitPrice.isActive ||
    !variant ||
    !variant.isActive ||
    variant.deleted_at !== null ||
    !variant.product ||
    !variant.product.isActive ||
    variant.product.deleted_at !== null
  ) {
    throw ApiError.badRequest("Product variant is inactive or unavailable");
  }

  return unitPrice;
}

export const wishlistService = {
  async getCustomerWishlist(
    sessionUserId: string
  ): Promise<CustomerWishlistResponse> {
    const user = await resolveInternalUser(sessionUserId);
    return wishlistRepository.findActiveWishlistByUserId(BigInt(user.internalId));
  },

  async addToWishlist(
    sessionUserId: string,
    input: AddWishlistInput
  ): Promise<CustomerWishlistItemDto> {
    const user = await resolveInternalUser(sessionUserId);
    const identifier = input.variantUnitPriceId || input.variantId;
    if (!identifier) {
      throw ApiError.badRequest("Either variantUnitPriceId or variantId is required");
    }

    const unitPrice = await validateActiveVariantUnitPrice(identifier);

    return wishlistRepository.addOrReactivateWishlistItem({
      userId: BigInt(user.internalId),
      productId: unitPrice.variant.productId,
      variantId: unitPrice.variant_id,
      variantUnitPriceId: unitPrice.id,
      userInternalId: BigInt(user.internalId),
    });
  },

  async removeFromWishlist(
    sessionUserId: string,
    identifier: string
  ): Promise<void> {
    const user = await resolveInternalUser(sessionUserId);
    let unitPrice = await db.variantUnitPrice.findFirst({
      where: { uuid: identifier },
    });

    if (!unitPrice) {
      unitPrice = await db.variantUnitPrice.findFirst({
        where: { variant: { uuid: identifier } },
        orderBy: [{ is_default: "desc" }, { createdAt: "asc" }],
      });
    }

    if (!unitPrice) {
      throw ApiError.notFound("Product pack size not found");
    }

    const removed = await wishlistRepository.softRemoveWishlistItem(
      BigInt(user.internalId),
      unitPrice.id,
      BigInt(user.internalId)
    );

    if (!removed) {
      throw ApiError.notFound("Item not found in wishlist");
    }
  },

  async moveToCart(sessionUserId: string, variantUnitPriceUuid: string) {
    const user = await resolveInternalUser(sessionUserId);
    const unitPrice = await validateActiveVariantUnitPrice(variantUnitPriceUuid);

    const wishlistItem =
      await wishlistRepository.findWishlistItemByUserAndVariant(
        user.internalId,
        unitPrice.id
      );

    if (!wishlistItem || !wishlistItem.is_active) {
      throw ApiError.notFound("Item not found in wishlist");
    }

    // 1. Add to active cart
    const cart = await cartService.addItem(sessionUserId, {
      variantUnitPriceId: unitPrice.uuid,
      quantity: 1,
    });

    // 2. Remove from wishlist
    await wishlistRepository.softRemoveWishlistItem(
      user.internalId,
      unitPrice.id,
      user.internalId
    );

    return {
      cart,
      movedVariantUnitPriceId: unitPrice.uuid,
    };
  },

  async getAdminCustomerWishlist(
    customerUuid: string
  ): Promise<CustomerWishlistResponse> {
    const customer = await db.user.findFirst({
      where: {
        uuid: customerUuid,
        deleted_at: null,
        role: {
          slug: "customer",
        },
      },
    });

    if (!customer) {
      throw ApiError.notFound("Customer not found");
    }

    return wishlistRepository.findActiveWishlistByUserId(customer.id);
  },

  async getWishlistCount(sessionUserId: string): Promise<{ count: number }> {
    const user = await resolveInternalUser(sessionUserId);
    const count = await wishlistRepository.getWishlistItemCount(BigInt(user.internalId));
    return { count };
  },
};
