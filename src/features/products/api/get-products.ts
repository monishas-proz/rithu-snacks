import { apiClient } from "@/lib/api/api-client";
import type { ProductListItem, ProductDetail } from "../types";

export async function getProducts(params?: Record<string, string | number | boolean | undefined | null>) {
  const response = await apiClient.get<ProductListItem[]>("/api/products", { params });
  return response;
}

export async function getProduct(slugOrId: string) {
  const response = await apiClient.get<ProductDetail>(`/api/products/${slugOrId}`);
  return response;
}

export async function createProduct(data: Record<string, unknown>) {
  const response = await apiClient.post<ProductDetail>("/api/products", data);
  return response;
}

export async function updateProduct(id: number, data: Record<string, unknown>) {
  const response = await apiClient.put<ProductDetail>(`/api/products/${id}`, data);
  return response;
}

export async function deleteProduct(id: number) {
  const response = await apiClient.delete<null>(`/api/products/${id}`);
  return response;
}
