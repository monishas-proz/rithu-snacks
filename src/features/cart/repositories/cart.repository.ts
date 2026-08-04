import { db } from "@/lib/db/prisma";
import type { CartItemWithProduct, CartProduct, CartVariant } from "../types";

const cartItemInclude = {
  product: {
    include: {
      images: { take: 1, orderBy: { isPrimary: "desc" as const } },
      category: { select: { id: true, name: true, slug: true } },
    },
  },
  variant: true,
} as const;

function mapCartItem(item: {
  id: number;
  cartId: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
  product: CartProduct;
  variant: CartVariant | null;
}): CartItemWithProduct {
  const product = item.product as unknown as CartProduct & {
    images: CartProduct["images"];
    category: CartProduct["category"];
  };
  const variantStock = item.variant ? item.variant.stockQuantity : product.stockQuantity;
  return {
    ...item,
    product: {
      ...product,
      stockQuantity: variantStock,
    },
  };
}

export const cartRepository = {
  async findByUserId(userId: number) {
    return db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: cartItemInclude,
          orderBy: { createdAt: "desc" as const },
        },
      },
    });
  },

  async createCart(userId: number) {
    return db.cart.create({
      data: { userId },
      include: {
        items: {
          include: cartItemInclude,
        },
      },
    });
  },

  async findItemById(itemId: number, cartId: number) {
    return db.cartItem.findFirst({
      where: { id: itemId, cartId },
      include: {
        product: true,
        variant: true,
      },
    });
  },

  async findItemByProduct(cartId: number, productId: number, variantId: number | null) {
    return db.cartItem.findFirst({
      where: {
        cartId,
        productId,
        variantId: variantId ?? null,
      },
    });
  },

  async addItem(cartId: number, productId: number, variantId: number | null, quantity: number, price: number) {
    return db.cartItem.create({
      data: {
        cartId,
        productId,
        variantId: variantId ?? null,
        quantity,
        price,
      },
      include: cartItemInclude,
    });
  },

  async updateItemQuantity(itemId: number, quantity: number) {
    return db.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  },

  async removeItem(itemId: number) {
    return db.cartItem.delete({
      where: { id: itemId },
    });
  },

  async clearCart(cartId: number) {
    return db.cartItem.deleteMany({
      where: { cartId },
    });
  },

  async getItemCount(cartId: number) {
    return db.cartItem.aggregate({
      where: { cartId },
      _sum: { quantity: true },
    });
  },

  async getCartWithItems(userId: number) {
    return db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: cartItemInclude,
          orderBy: { createdAt: "desc" as const },
        },
      },
    });
  },
};
