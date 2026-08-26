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
  return user;
}

async function validateActiveVariant(variantUuid: string) {
  const variant = await db.productVariant.findFirst({
    where: {
      uuid: variantUuid,
    },
    include: {
      product: true,
    },
  });

  if (!variant || variant.deleted_at !== null) {
    throw ApiError.notFound("Product variant not found");
  }

  if (
    !variant.isActive ||
    !variant.product ||
    !variant.product.isActive ||
    variant.product.deleted_at !== null
  ) {
    throw ApiError.badRequest("Product variant is inactive or unavailable");
  }

  return variant;
}

export const wishlistService = {
  async getCustomerWishlist(
    sessionUserId: string
  ): Promise<CustomerWishlistResponse> {
    const user = await resolveInternalUser(sessionUserId);
    return wishlistRepository.findActiveWishlistByUserId(user.internalId);
  },

  async addToWishlist(
    sessionUserId: string,
    input: AddWishlistInput
  ): Promise<CustomerWishlistItemDto> {
    const user = await resolveInternalUser(sessionUserId);
    const variant = await validateActiveVariant(input.variantId);

    return wishlistRepository.addOrReactivateWishlistItem({
      userId: user.internalId,
      productId: variant.productId,
      variantId: variant.id,
      userInternalId: user.internalId,
    });
  },

  async removeFromWishlist(
    sessionUserId: string,
    variantUuid: string
  ): Promise<void> {
    const user = await resolveInternalUser(sessionUserId);
    const variant = await db.productVariant.findFirst({
      where: { uuid: variantUuid },
    });

    if (!variant) {
      throw ApiError.notFound("Product variant not found");
    }

    const removed = await wishlistRepository.softRemoveWishlistItem(
      user.internalId,
      variant.id,
      user.internalId
    );

    if (!removed) {
      throw ApiError.notFound("Item not found in wishlist");
    }
  },

  async moveToCart(sessionUserId: string, variantUuid: string) {
    const user = await resolveInternalUser(sessionUserId);
    const variant = await validateActiveVariant(variantUuid);

    const wishlistItem =
      await wishlistRepository.findWishlistItemByUserAndVariant(
        user.internalId,
        variant.id
      );

    if (!wishlistItem || !wishlistItem.is_active) {
      throw ApiError.notFound("Item not found in wishlist");
    }

    // 1. Add to active cart
    const cart = await cartService.addItem(sessionUserId, {
      variantId: variant.uuid,
      quantity: 1,
    });

    // 2. Remove from wishlist
    await wishlistRepository.softRemoveWishlistItem(
      user.internalId,
      variant.id,
      user.internalId
    );

    return {
      cart,
      movedVariantId: variant.uuid,
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
};
