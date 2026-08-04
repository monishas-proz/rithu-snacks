import { ApiError } from "@/lib/api/api-error";
import { db } from "@/lib/db/prisma";
import { wishlistRepository } from "../repositories/wishlist.repository";
import { cartService } from "@/features/cart/services/cart.service";
import type {
  AddToWishlistInput,
  GetWishlistResult,
  WishlistStatusResult,
  WishlistItemWithProduct,
  WishlistProduct,
} from "../types";

function mapProduct(product: {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: unknown;
  comparePrice: unknown;
  discountPercent: unknown;
  isActive: boolean;
  isFeatured: boolean;
  images: { id: number; url: string; altText: string | null }[];
  category: { id: number; name: string; slug: string } | null;
  brand: { id: number; name: string; slug: string } | null;
}): WishlistProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    discountPercent: Number(product.discountPercent),
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    images: product.images,
    category: product.category,
    brand: product.brand,
  };
}

function mapWishlistItem(item: {
  id: number;
  userId: number;
  productId: number;
  createdAt: Date;
  product: {
    id: number;
    name: string;
    slug: string;
    sku: string;
    price: unknown;
    comparePrice: unknown;
    discountPercent: unknown;
    isActive: boolean;
    isFeatured: boolean;
    images: { id: number; url: string; altText: string | null }[];
    category: { id: number; name: string; slug: string } | null;
    brand: { id: number; name: string; slug: string } | null;
  };
}): WishlistItemWithProduct {
  return {
    id: item.id,
    userId: item.userId,
    productId: item.productId,
    createdAt: item.createdAt,
    product: mapProduct(item.product),
  };
}

export const wishlistService = {
  async getWishlist(userId: number): Promise<GetWishlistResult> {
    const items = await wishlistRepository.findByUserId(userId);
    const mappedItems = items.map(mapWishlistItem);
    return {
      items: mappedItems,
      count: mappedItems.length,
    };
  },

  async addToWishlist(
    userId: number,
    input: AddToWishlistInput
  ): Promise<WishlistItemWithProduct> {
    const product = await db.product.findUnique({
      where: { id: input.productId },
    });

    if (!product || !product.isActive) {
      throw new ApiError("Product not found or inactive", 404);
    }

    const existing = await wishlistRepository.findByUserAndProduct(
      userId,
      input.productId
    );

    if (existing) {
      throw new ApiError("Product is already in your wishlist", 409);
    }

    const item = await wishlistRepository.addItem(userId, input.productId);
    return mapWishlistItem(item);
  },

  async removeFromWishlist(
    userId: number,
    productId: number
  ): Promise<void> {
    const existing = await wishlistRepository.findByUserAndProduct(
      userId,
      productId
    );

    if (!existing) {
      throw new ApiError("Product not found in wishlist", 404);
    }

    await wishlistRepository.removeItem(userId, productId);
  },

  async checkWishlistStatus(
    userId: number,
    productId: number
  ): Promise<WishlistStatusResult> {
    const existing = await wishlistRepository.findByUserAndProduct(
      userId,
      productId
    );
    return {
      isInWishlist: !!existing,
      wishlistItemId: existing?.id ?? null,
    };
  },

  async moveToCart(
    userId: number,
    productId: number
  ) {
    const existing = await wishlistRepository.findByUserAndProduct(
      userId,
      productId
    );

    if (!existing) {
      throw new ApiError("Product not found in wishlist", 404);
    }

    await cartService.addToCart(userId, {
      productId,
      quantity: 1,
    });

    await wishlistRepository.removeItem(userId, productId);

    const cart = await cartService.getCart(userId);
    return { cart };
  },
};
