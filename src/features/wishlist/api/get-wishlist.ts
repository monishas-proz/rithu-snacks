import { apiClient } from "@/lib/api/api-client";
import type { CustomerWishlistResponse, CustomerWishlistItemDto } from "../types";

export async function getWishlist(): Promise<CustomerWishlistResponse> {
  const response = await apiClient.get<CustomerWishlistResponse>("/api/customer/wishlist");
  return response.data!;
}

export async function addToWishlist(variantUnitPriceId: string): Promise<CustomerWishlistItemDto> {
  const response = await apiClient.post<CustomerWishlistItemDto>("/api/customer/wishlist", {
    variantUnitPriceId,
  });
  return response.data!;
}

export async function removeFromWishlist(variantUnitPriceId: string): Promise<void> {
  await apiClient.delete(`/api/customer/wishlist/${variantUnitPriceId}`);
}

export async function moveWishlistItemToCart(variantUnitPriceId: string): Promise<void> {
  await apiClient.post(`/api/customer/wishlist/${variantUnitPriceId}/move-to-cart`);
}

export async function getWishlistCount(): Promise<{ count: number }> {
  const response = await apiClient.get<{ count: number }>("/api/customer/wishlist/count");
  return response.data!;
}
