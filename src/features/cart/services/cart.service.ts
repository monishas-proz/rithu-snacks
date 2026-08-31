import { db } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/api-error";
import { userRepository } from "@/features/users/repositories/user.repository";
import { formatVariantMeasurement } from "@/features/variants/utils/measurement.util";
import { cartRepository } from "../repositories/cart.repository";
import type {
  AddCartItemInput,
  UpdateCartItemInput,
} from "../validations/cart.schema";
import type {
  CartResponse,
  CartItemResponse,
  CartCountResponse,
} from "../types/cart.types";

function calculateVariantPrice(variant: {
  base_price: unknown;
  sale_price: unknown;
}): number {
  const salePrice =
    variant.sale_price !== null && variant.sale_price !== undefined
      ? Number(variant.sale_price)
      : 0;
  const basePrice =
    variant.base_price !== null && variant.base_price !== undefined
      ? Number(variant.base_price)
      : 0;

  return salePrice > 0 ? salePrice : basePrice;
}

function formatCartResponse(
  cart: Awaited<ReturnType<typeof cartRepository.findActiveCartByUserId>>
): CartResponse {
  if (!cart) {
    return {
      id: null,
      items: [],
      subtotal: 0,
      totalItems: 0,
    };
  }

  let subtotal = 0;
  let totalItems = 0;

  const items: CartItemResponse[] = cart.items
    .filter((item) => item.variant && item.product && item.is_active)
    .map((item) => {
      const variant = item.variant;
      const product = item.product;

      const currentPrice = calculateVariantPrice(variant);
      const priceAtAdd = Number(item.price_at_add);
      const priceChanged = priceAtAdd !== currentPrice;
      const itemTotal = item.quantity * currentPrice;

      subtotal += itemTotal;
      totalItems += item.quantity;

      const primaryImg =
        variant.product_variant_images?.[0]?.image_url ||
        product.images?.[0]?.image_url ||
        null;

      const measurement = formatVariantMeasurement(
        variant.product_units,
        variant.unit_value
      );

      const variantName =
        variant.variant_name ||
        `${variant.unit_value} ${variant.product_units?.code || ""}`.trim();

      return {
        id: item.uuid || String(item.id),
        productId: product.uuid || String(product.id),
        variantId: variant.uuid || String(variant.id),
        productName: product.name,
        variantName,
        measurement,
        primaryImage: primaryImg,
        quantity: item.quantity,
        priceAtAdd,
        currentPrice,
        priceChanged,
        itemTotal,
      };
    });

  return {
    id: cart.uuid || String(cart.id),
    items,
    subtotal,
    totalItems,
  };
}

async function resolveInternalUserId(sessionUserId: string): Promise<bigint> {
  const user = await userRepository.findById(sessionUserId);
  if (!user) {
    throw ApiError.unauthorized("Please login to access your cart");
  }
  if (!user.isActive || user.is_active === false) {
    throw ApiError.forbidden("Your account is inactive or blocked. Please contact support.");
  }
  return BigInt(user.internalId);
}

export const cartService = {
  async getCart(sessionUserId: string): Promise<CartResponse> {
    const userId = await resolveInternalUserId(sessionUserId);
    const cart = await cartRepository.findActiveCartByUserId(userId);
    return formatCartResponse(cart);
  },

  async addItem(
    sessionUserId: string,
    input: AddCartItemInput
  ): Promise<CartResponse> {
    const userId = await resolveInternalUserId(sessionUserId);

    // 1. Validate requested variant & parent product
    const variant = await db.productVariant.findFirst({
      where: {
        uuid: input.variantId,
      },
      include: {
        product: true,
      },
    });

    if (!variant || variant.deleted_at !== null) {
      throw ApiError.notFound("Product variant not found");
    }

    if (!variant.isActive || !variant.product || !variant.product.isActive || variant.product.deleted_at !== null) {
      throw ApiError.badRequest("Product variant is unavailable");
    }

    const currentPrice = calculateVariantPrice(variant);

    // 2. Add to cart in transaction
    const updatedCart = await cartRepository.addItemToCart({
      userId,
      productId: variant.productId,
      variantId: variant.id,
      quantity: input.quantity,
      currentPrice,
      adminOrUserId: userId,
    });

    return formatCartResponse(updatedCart);
  },

  async updateItemQuantity(
    sessionUserId: string,
    variantUuid: string,
    input: UpdateCartItemInput
  ): Promise<CartResponse> {
    const userId = await resolveInternalUserId(sessionUserId);

    // Validate variant exists and is active
    const variant = await db.productVariant.findFirst({
      where: {
        uuid: variantUuid,
        deleted_at: null,
      },
      include: {
        product: true,
      },
    });

    if (!variant) {
      throw ApiError.notFound("Product variant not found");
    }

    if (!variant.isActive || !variant.product || !variant.product.isActive || variant.product.deleted_at !== null) {
      throw ApiError.badRequest("Product variant is unavailable");
    }

    const currentPrice = calculateVariantPrice(variant);

    const updatedCart = await cartRepository.updateItemQuantity({
      userId,
      variantUuid,
      quantity: input.quantity,
      currentPrice,
      adminOrUserId: userId,
    });

    if (!updatedCart) {
      throw ApiError.notFound("Cart item not found");
    }

    return formatCartResponse(updatedCart);
  },

  async removeItem(
    sessionUserId: string,
    variantUuid: string
  ): Promise<CartResponse> {
    const userId = await resolveInternalUserId(sessionUserId);

    const updatedCart = await cartRepository.removeCartItem({
      userId,
      variantUuid,
      adminOrUserId: userId,
    });

    if (!updatedCart) {
      throw ApiError.notFound("Cart item not found");
    }

    return formatCartResponse(updatedCart);
  },

  async clearCart(sessionUserId: string): Promise<void> {
    const userId = await resolveInternalUserId(sessionUserId);
    await cartRepository.clearCart({
      userId,
      adminOrUserId: userId,
    });
  },

  async getCartCount(sessionUserId: string): Promise<CartCountResponse> {
    const userId = await resolveInternalUserId(sessionUserId);
    return cartRepository.getCartItemCount(userId);
  },
};
