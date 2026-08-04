import { apiClient } from "@/lib/api/api-client";
import type { GetWishlistResult, WishlistItemWithProduct, WishlistStatusResult } from "../types";

export async function getWishlist(): Promise<GetWishlistResult> {
  const response = await apiClient.get<GetWishlistResult>("/api/wishlist");
  return response.data!;
}

export async function addToWishlist(data: {
  productId: number;
}): Promise<WishlistItemWithProduct> {
  const response = await apiClient.post<WishlistItemWithProduct>(
    "/api/wishlist",
    data
  );
  return response.data!;
}

export async function removeFromWishlist(
  productId: number
): Promise<void> {
  await apiClient.delete(`/api/wishlist/${productId}`);
}

export async function checkWishlistStatus(
  productId: number
): Promise<WishlistStatusResult> {
  const response = await apiClient.get<WishlistStatusResult>(
    `/api/wishlist/status`,
    { params: { productId: String(productId) } }
  );
  return response.data!;
}
