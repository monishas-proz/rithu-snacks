import { apiClient } from "@/lib/api/api-client";
import type { CartWithItems } from "../types";

export async function getCart(): Promise<CartWithItems> {
  const response = await apiClient.get<CartWithItems>("/api/cart");
  return response.data!;
}

export async function addToCart(data: {
  productId: number;
  variantId?: number;
  quantity?: number;
}): Promise<CartWithItems> {
  const response = await apiClient.post<CartWithItems>("/api/cart", data);
  return response.data!;
}

export async function updateCartItem(
  itemId: number,
  data: { quantity: number }
): Promise<CartWithItems> {
  const response = await apiClient.put<CartWithItems>(
    `/api/cart/${itemId}`,
    data
  );
  return response.data!;
}

export async function removeCartItem(itemId: number): Promise<CartWithItems> {
  const response = await apiClient.delete<CartWithItems>(`/api/cart/${itemId}`);
  return response.data!;
}
