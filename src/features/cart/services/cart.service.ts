import { db } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/api-error";
import { cartRepository } from "../repositories/cart.repository";
import type {
  AddToCartInput,
  UpdateCartItemInput,
  CartWithItems,
  CartSummary,
  CartItemWithProduct,
} from "../types";

function mapCartItemToNumber(item: {
  id: number;
  cartId: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  price: unknown;
  createdAt: Date;
  updatedAt: Date;
  product: Record<string, unknown>;
  variant: Record<string, unknown> | null;
}): CartItemWithProduct {
  const product = item.product as {
    id: number;
    name: string;
    slug: string;
    sku: string;
    price: unknown;
    comparePrice: unknown;
    discountPercent: unknown;
    isActive: boolean;
    isDigital: boolean;
    images: { id: number; url: string; altText: string | null }[];
    category: { id: number; name: string; slug: string } | null;
  };
  const variant = item.variant as {
    id: number;
    name: string;
    sku: string;
    price: unknown;
    comparePrice: unknown;
    stockQuantity: number;
    isActive: boolean;
  } | null;

  return {
    id: item.id,
    cartId: item.cartId,
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    price: Number(item.price),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
      discountPercent: Number(product.discountPercent),
      isActive: product.isActive,
      isDigital: product.isDigital,
      stockQuantity: variant ? variant.stockQuantity : 0,
      images: product.images,
      category: product.category,
    },
    variant: variant
      ? {
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          price: Number(variant.price),
          comparePrice: variant.comparePrice ? Number(variant.comparePrice) : null,
          stockQuantity: variant.stockQuantity,
          isActive: variant.isActive,
        }
      : null,
  };
}

function calculateCartSummary(items: CartItemWithProduct[]): CartSummary {
  let subtotal = 0;
  let totalItems = 0;

  for (const item of items) {
    const effectivePrice = Number(item.price);
    subtotal += effectivePrice * item.quantity;
    totalItems += item.quantity;
  }

  const totalDiscount = 0;
  const tax = 0;
  const shippingCharge = 0;

  const grandTotal = Math.max(0, subtotal - totalDiscount + tax + shippingCharge);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(totalDiscount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shippingCharge: Math.round(shippingCharge * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    totalItems,
  };
}

export const cartService = {
  async getCart(userId: number): Promise<CartWithItems> {
    const cart = await cartRepository.getCartWithItems(userId);

    if (!cart) {
      return {
        id: 0,
        userId,
        sessionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        summary: {
          subtotal: 0,
          discount: 0,
          tax: 0,
          shippingCharge: 0,
          grandTotal: 0,
          totalItems: 0,
        },
      };
    }

    const mappedItems = cart.items.map(mapCartItemToNumber);
    const summary = calculateCartSummary(mappedItems);

    return {
      id: cart.id,
      userId: cart.userId,
      sessionId: cart.sessionId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items: mappedItems,
      summary,
    };
  },

  async addToCart(userId: number, input: AddToCartInput): Promise<CartWithItems> {
    const product = await db.product.findUnique({
      where: { id: input.productId },
      include: { variants: true },
    });

    if (!product || !product.isActive) {
      throw new ApiError("Product not found or inactive", 404);
    }

    const quantity = input.quantity ?? 1;
    let price = Number(product.price);
    let stockQuantity = 0;

    if (input.variantId) {
      const variant = product.variants.find((v) => v.id === input.variantId);
      if (!variant || !variant.isActive) {
        throw new ApiError("Product variant not found or inactive", 404);
      }
      price = Number(variant.price);
      stockQuantity = variant.stockQuantity;
    } else {
      const inventory = await db.inventory.findFirst({
        where: { productId: input.productId, variantId: null },
      });
      stockQuantity = inventory?.quantity ?? 0;
    }

    if (stockQuantity < quantity) {
      throw new ApiError(
        `Insufficient stock. Available: ${stockQuantity}`,
        400
      );
    }

    let cart = await cartRepository.findByUserId(userId);
    if (!cart) {
      cart = await cartRepository.createCart(userId);
    }

    const existingItem = await cartRepository.findItemByProduct(
      cart.id,
      input.productId,
      input.variantId ?? null
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (stockQuantity < newQuantity) {
        throw new ApiError(
          `Insufficient stock. Available: ${stockQuantity}, in cart: ${existingItem.quantity}`,
          400
        );
      }
      await cartRepository.updateItemQuantity(existingItem.id, newQuantity);
    } else {
      await cartRepository.addItem(
        cart.id,
        input.productId,
        input.variantId ?? null,
        quantity,
        price
      );
    }

    return this.getCart(userId);
  },

  async updateCartItem(
    userId: number,
    input: UpdateCartItemInput,
    itemId: number
  ): Promise<CartWithItems> {
    const cart = await cartRepository.findByUserId(userId);
    if (!cart) {
      throw new ApiError("Cart not found", 404);
    }

    const cartItem = await cartRepository.findItemById(itemId, cart.id);
    if (!cartItem) {
      throw new ApiError("Cart item not found", 404);
    }

    let stockQuantity = 0;
    if (cartItem.variantId) {
      const variant = await db.productVariant.findUnique({
        where: { id: cartItem.variantId },
      });
      stockQuantity = variant?.stockQuantity ?? 0;
    } else {
      const inventory = await db.inventory.findFirst({
        where: { productId: cartItem.productId, variantId: null },
      });
      stockQuantity = inventory?.quantity ?? 0;
    }

    if (stockQuantity < input.quantity) {
      throw new ApiError(
        `Insufficient stock. Available: ${stockQuantity}`,
        400
      );
    }

    await cartRepository.updateItemQuantity(itemId, input.quantity);
    return this.getCart(userId);
  },

  async removeCartItem(userId: number, itemId: number): Promise<CartWithItems> {
    const cart = await cartRepository.findByUserId(userId);
    if (!cart) {
      throw new ApiError("Cart not found", 404);
    }

    const cartItem = await cartRepository.findItemById(itemId, cart.id);
    if (!cartItem) {
      throw new ApiError("Cart item not found", 404);
    }

    await cartRepository.removeItem(itemId);
    return this.getCart(userId);
  },

  async clearCart(userId: number): Promise<CartWithItems> {
    const cart = await cartRepository.findByUserId(userId);
    if (!cart) {
      throw new ApiError("Cart not found", 404);
    }

    await cartRepository.clearCart(cart.id);
    return this.getCart(userId);
  },

  async getCartSummary(userId: number): Promise<CartSummary> {
    const cart = await this.getCart(userId);
    return cart.summary;
  },
};
