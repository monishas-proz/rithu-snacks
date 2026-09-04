import { apiClient } from "@/lib/api/api-client";
import type {
  AdminProductResponse,
  GetAdminProductsResult,
  AdminProductListParams,
  GetAdminProductsParams,
} from "../types";

export async function getAdminProducts(
  params?: AdminProductListParams | GetAdminProductsParams
): Promise<GetAdminProductsResult> {
  const body: Record<string, unknown> = {};

  if (params?.page) body.page = Number(params.page);
  const limitValue =
    (params as AdminProductListParams)?.limit ?? params?.pageSize;
  if (limitValue !== undefined) {
    body.limit = Number(limitValue);
    body.pageSize = Number(limitValue);
  }
  if (
    params?.search !== undefined &&
    params?.search !== null &&
    params?.search !== ""
  ) {
    body.search = String(params.search).trim();
  }

  const p = params as AdminProductListParams | undefined;
  if (p?.isActive !== undefined && p?.isActive !== null) {
    body.isActive = Boolean(p.isActive);
  }
  if (p?.categoryId) body.categoryId = String(p.categoryId);
  if (p?.brandId) body.brandId = String(p.brandId);
  if (p?.hsnCodeId) body.hsnCodeId = String(p.hsnCodeId);
  if (p?.vegType) body.vegType = p.vegType;
  if (p?.isFeatured !== undefined && p?.isFeatured !== null) {
    body.isFeatured = Boolean(p.isFeatured);
  }
  if (p?.status !== undefined && p?.status !== null) {
    body.status = Boolean(p.status);
  }
  if (p?.sortBy) body.sortBy = String(p.sortBy);
  if (p?.sortOrder) body.sortOrder = String(p.sortOrder);

  const response = await apiClient.post<AdminProductResponse[]>(
    "/api/admin/products/list",
    body
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

export async function getStoreProducts(
  params?: Record<string, unknown>
) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.set(key, String(val));
      }
    });
  }
  const queryString = query.toString();
  const url = queryString ? `/api/products?${queryString}` : "/api/products";
  return apiClient.get<any>(url);
}

export async function getStoreProduct(idOrSlug: string) {
  return apiClient.get<any>(`/api/products/${encodeURIComponent(idOrSlug)}`);
}

// Aliases for compatibility
export const getProducts = getStoreProducts;
export const getProduct = getStoreProduct;
export const createProduct = createAdminProduct;
export const updateProduct = (
  idOrUuid: string | number,
  data: Record<string, unknown>
) => updateAdminProduct(String(idOrUuid), data);
export const deleteProduct = (idOrUuid: string | number) =>
  deleteAdminProduct(String(idOrUuid));
