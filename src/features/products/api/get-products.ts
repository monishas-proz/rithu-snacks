import { apiClient } from "@/lib/api/api-client";
import type { AdminProductResponse, GetAdminProductsResult } from "../types";

export async function getAdminProducts(
  params?: Record<string, string | number | boolean | undefined | null>
): Promise<GetAdminProductsResult> {
  const response = await apiClient.get<AdminProductResponse[]>(
    "/api/admin/products",
    { params }
  );

  return {
    data: response.data ?? [],
    meta: response.meta,
  };
}

export async function getAdminProduct(uuid: string) {
  return apiClient.get<AdminProductResponse>(`/api/admin/products/${uuid}`);
}

export async function createAdminProduct(data: Record<string, unknown>) {
  return apiClient.post<AdminProductResponse>("/api/admin/products", data);
}

export async function updateAdminProduct(
  uuid: string,
  data: Record<string, unknown>
) {
  return apiClient.put<AdminProductResponse>(
    `/api/admin/products/${uuid}`,
    data
  );
}

export async function deleteAdminProduct(uuid: string) {
  return apiClient.delete(`/api/admin/products/${uuid}`);
}

// Aliases for compatibility
export const getProducts = getAdminProducts;
export const getProduct = getAdminProduct;
export const createProduct = createAdminProduct;
export const updateProduct = (
  idOrUuid: string | number,
  data: Record<string, unknown>
) => updateAdminProduct(String(idOrUuid), data);
export const deleteProduct = (idOrUuid: string | number) =>
  deleteAdminProduct(String(idOrUuid));
