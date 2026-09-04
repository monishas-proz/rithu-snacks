import { apiClient } from "@/lib/api/api-client";
import type { CartResponse, CartCountResponse } from "../types";
import type { AddCartItemInput, UpdateCartItemInput } from "../validations/cart.schema";

export async function getCart(): Promise<CartResponse> {
  const response = await apiClient.get<CartResponse>("/api/customer/cart");
  return response.data!;
}

export async function addToCart(data: AddCartItemInput): Promise<CartResponse> {
  const response = await apiClient.post<CartResponse>("/api/customer/cart/items", data);
  return response.data!;
}

export async function updateCartItem(
  variantUnitPriceId: string,
  data: UpdateCartItemInput
): Promise<CartResponse> {
  const response = await apiClient.put<CartResponse>(
    `/api/customer/cart/items/${variantUnitPriceId}`,
    data
  );
  return response.data!;
}

export async function removeCartItem(variantUnitPriceId: string): Promise<CartResponse> {
  const response = await apiClient.delete<CartResponse>(
    `/api/customer/cart/items/${variantUnitPriceId}`
  );
  return response.data!;
}

export async function clearCart(): Promise<void> {
  await apiClient.delete("/api/customer/cart");
}

export async function getCartCount(): Promise<CartCountResponse> {
  const response = await apiClient.get<CartCountResponse>("/api/customer/cart/count");
  return response.data!;
}
