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

type DefaultUnitPrice = {
  base_price: unknown;
} | null | undefined;

/**
 * Selling price is not stored on the unit price row - it is base_price minus
 * any active offer/discount. Offer/discount application is out of scope of
 * this cart pricing helper; callers should apply the existing offer logic on
 * top of this base price if/when it needs to be reflected in the cart.
 */
function calculateVariantPrice(unitPrice: DefaultUnitPrice): number {
  const basePrice =
    unitPrice?.base_price !== null && unitPrice?.base_price !== undefined
      ? Number(unitPrice.base_price)
      : 0;

  return basePrice;
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
    .filter((item) => item.variant_unit_price && item.product && item.is_active)
    .map((item) => {
      const unitPrice = item.variant_unit_price;
      const variant = unitPrice.variant;
      const product = item.product;

      const currentPrice = calculateVariantPrice(unitPrice);
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
        unitPrice.product_units,
        unitPrice.unit_value ?? 0
      );

      const variantName =
        variant.variant_name ||
        `${unitPrice.unit_value ?? ""} ${unitPrice.product_units?.code || ""}`.trim();

      return {
        id: item.uuid || String(item.id),
        productId: product.uuid || String(product.id),
        variantId: variant.uuid || String(variant.id),
        variantUnitPriceId: unitPrice.uuid || String(unitPrice.id),
        productName: product.name,
        variantName,
        measurement,
        primaryImage: primaryImg,
        quantity: item.quantity,
        price: currentPrice,
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

    // 1. Validate requested variant unit price (exact pack size) & parents
    let unitPrice = input.variantUnitPriceId
      ? await db.variantUnitPrice.findFirst({
          where: {
            uuid: input.variantUnitPriceId,
            deleted_at: null,
          },
          include: {
            variant: { include: { product: true } },
          },
        })
      : null;

    // If not found by unit price UUID or variantId was passed directly, try finding by variant UUID
    if (!unitPrice) {
      const variantUuid = input.variantId || input.variantUnitPriceId;
      if (variantUuid) {
        // Try finding default unit price of variant
        unitPrice = await db.variantUnitPrice.findFirst({
          where: {
            variant: { uuid: variantUuid },
            deleted_at: null,
          },
          orderBy: [{ is_default: "desc" }, { createdAt: "asc" }],
          include: {
            variant: { include: { product: true } },
          },
        });
      }
    }

    if (!unitPrice) {
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
      throw ApiError.badRequest("Product variant is unavailable");
    }

    const currentPrice = calculateVariantPrice(unitPrice);

    // 2. Add to cart in transaction
    const updatedCart = await cartRepository.addItemToCart({
      userId,
      productId: variant.productId,
      variantId: variant.id,
      variantUnitPriceId: unitPrice.id,
      quantity: input.quantity,
      currentPrice,
      adminOrUserId: userId,
    });

    return formatCartResponse(updatedCart);
  },

  async getCartItem(
    sessionUserId: string,
    identifier: string
  ): Promise<CartItemResponse> {
    const userId = await resolveInternalUserId(sessionUserId);

    const item = await cartRepository.findCartItem({
      userId,
      identifier,
    });

    if (!item) {
      throw ApiError.notFound("Cart item not found");
    }

    const unitPrice = item.variant_unit_price;
    const variant = unitPrice?.variant;
    const product = item.product;

    const currentPrice = unitPrice
      ? calculateVariantPrice(unitPrice)
      : Number(item.price_at_add);
    const priceAtAdd = Number(item.price_at_add);
    const priceChanged = priceAtAdd !== currentPrice;
    const itemTotal = item.quantity * currentPrice;

    const primaryImg =
      variant?.product_variant_images?.[0]?.image_url ||
      product?.images?.[0]?.image_url ||
      null;

    const measurement = formatVariantMeasurement(
      unitPrice?.product_units,
      unitPrice?.unit_value ?? 0
    );

    const variantName =
      variant?.variant_name ||
      `${unitPrice?.unit_value ?? ""} ${unitPrice?.product_units?.code || ""}`.trim();

    return {
      id: item.uuid || String(item.id),
      productId: product?.uuid || String(item.productId),
      variantId: variant?.uuid || "",
      variantUnitPriceId: unitPrice?.uuid || String(item.variantUnitPriceId),
      productName: product?.name || "",
      variantName,
      measurement,
      primaryImage: primaryImg,
      quantity: item.quantity,
      price: currentPrice,
      priceAtAdd,
      currentPrice,
      priceChanged,
      itemTotal,
    };
  },

  async updateItemQuantity(
    sessionUserId: string,
    identifier: string,
    input: UpdateCartItemInput
  ): Promise<CartResponse> {
    const userId = await resolveInternalUserId(sessionUserId);

    const existingItem = await cartRepository.findCartItem({
      userId,
      identifier,
    });

    if (!existingItem) {
      throw ApiError.notFound("Cart item not found");
    }

    const unitPrice = existingItem.variant_unit_price;
    const variant = unitPrice?.variant;

    if (
      !unitPrice ||
      !unitPrice.isActive ||
      unitPrice.deleted_at !== null ||
      !variant ||
      !variant.isActive ||
      variant.deleted_at !== null ||
      !existingItem.product ||
      !existingItem.product.isActive ||
      existingItem.product.deleted_at !== null
    ) {
      throw ApiError.badRequest("Product variant is unavailable");
    }

    const currentPrice = calculateVariantPrice(unitPrice);

    const updatedCart = await cartRepository.updateItemQuantity({
      userId,
      variantUnitPriceUuid: identifier,
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
    identifier: string
  ): Promise<CartResponse> {
    const userId = await resolveInternalUserId(sessionUserId);

    const updatedCart = await cartRepository.removeCartItem({
      userId,
      variantUnitPriceUuid: identifier,
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
