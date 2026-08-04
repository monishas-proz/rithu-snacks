import { db } from "@/lib/db/prisma";
import type { WishlistItemWithProduct, WishlistProduct } from "../types";

const wishlistProductInclude = {
  images: { take: 1, orderBy: { isPrimary: "desc" as const } },
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
} as const;

function mapWishlistItem(item: {
  id: number;
  userId: number;
  productId: number;
  createdAt: Date;
  product: WishlistProduct;
}): WishlistItemWithProduct {
  return {
    ...item,
    product: item.product,
  };
}

export const wishlistRepository = {
  async findByUserId(userId: number) {
    return db.wishlistItem.findMany({
      where: { userId },
      include: { product: { include: wishlistProductInclude } },
      orderBy: { createdAt: "desc" as const },
    });
  },

  async findByUserAndProduct(userId: number, productId: number) {
    return db.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
  },

  async addItem(userId: number, productId: number) {
    return db.wishlistItem.create({
      data: { userId, productId },
      include: { product: { include: wishlistProductInclude } },
    });
  },

  async removeItem(userId: number, productId: number) {
    return db.wishlistItem.delete({
      where: { userId_productId: { userId, productId } },
    });
  },

  async removeItemById(id: number) {
    return db.wishlistItem.delete({
      where: { id },
    });
  },

  async count(userId: number) {
    return db.wishlistItem.count({
      where: { userId },
    });
  },
};
