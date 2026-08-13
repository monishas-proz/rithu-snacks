import { apiClient } from "@/lib/api/api-client";
import type { BrandListItem, BrandDetail, GetBrandsResult } from "../types";

export async function getBrands(params?: Record<string, string | number | boolean | undefined | null>) {
  const response = await apiClient.get<BrandListItem[]>("/api/brands", { params });
  return {
    data: response.data!,
    meta: response.meta!,
  } satisfies GetBrandsResult;
}

export async function getBrand(uuid: string) {
  const response = await apiClient.get<BrandDetail>(`/api/admin/brands/${uuid}`);
  return response;
}

export async function createBrand(data: Record<string, unknown>) {
  const response = await apiClient.post<BrandDetail>("/api/admin/brands", data);
  return response;
}

export async function updateBrand(uuid: string, data: Record<string, unknown>) {
  const response = await apiClient.put<BrandDetail>(`/api/admin/brands/${uuid}`, data);
  return response;
}

export async function deleteBrand(uuid: string) {
  const response = await apiClient.delete<null>(`/api/admin/brands/${uuid}`);
  return response;
}
