import { customerWishlistApi } from "@/features/customers/api/customer-wishlist.api";
import type { CustomerWishlistResponse } from "../types/wishlist.types";

export async function getWishlist(): Promise<CustomerWishlistResponse> {
  try {
    return await customerWishlistApi.getWishlist();
  } catch {
    return { items: [], totalItems: 0 };
  }
}

export async function addToWishlist(data: {
  productId?: number;
  variantId?: string;
}): Promise<any> {
  try {
    if (data.variantId) {
      return await customerWishlistApi.addToWishlist(data.variantId);
    }
    return null;
  } catch {
    return null;
  }
}

export async function removeFromWishlist(
  id: number | string
): Promise<void> {
  try {
    await customerWishlistApi.removeFromWishlist(String(id));
  } catch {
    // Graceful error handling
  }
}

export async function checkWishlistStatus(
  _productId: number | string
): Promise<{ isInWishlist: boolean }> {
  return { isInWishlist: false };
}
