import { apiClient } from "@/lib/api/api-client";
import type { BrandListItem, BrandDetail, GetBrandsResult } from "../types";

export async function getBrands(params?: Record<string, string | number | boolean | undefined | null>) {
  const response = await apiClient.get<BrandListItem[]>("/api/brands", { params });
  return {
    data: response.data!,
    meta: response.meta!,
  } satisfies GetBrandsResult;
}

export async function getBrand(slugOrId: string) {
  const response = await apiClient.get<BrandDetail>(`/api/brands/${slugOrId}`);
  return response;
}

export async function createBrand(data: Record<string, unknown>) {
  const response = await apiClient.post<BrandDetail>("/api/brands", data);
  return response;
}

export async function updateBrand(id: number, data: Record<string, unknown>) {
  const response = await apiClient.put<BrandDetail>(`/api/brands/${id}`, data);
  return response;
}

export async function deleteBrand(id: number) {
  const response = await apiClient.delete<null>(`/api/brands/${id}`);
  return response;
}
