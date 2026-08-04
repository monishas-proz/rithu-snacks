import { apiClient } from "@/lib/api/api-client";
import type { ApiResponse } from "@/lib/api/api-response";
import type { CategoryListItem, CategoryDetail } from "../types";

export async function getCategories(params?: Record<string, string | number | boolean | undefined | null>) {
  const response = await apiClient.get<CategoryListItem[]>("/api/categories", { params });
  return response;
}

export async function getCategory(slugOrId: string) {
  const response = await apiClient.get<CategoryDetail>(`/api/categories/${slugOrId}`);
  return response;
}

export async function createCategory(data: Record<string, unknown>) {
  const response = await apiClient.post<CategoryDetail>("/api/categories", data);
  return response;
}

export async function updateCategory(id: number, data: Record<string, unknown>) {
  const response = await apiClient.put<CategoryDetail>(`/api/categories/${id}`, data);
  return response;
}

export async function deleteCategory(id: number) {
  const response = await apiClient.delete<null>(`/api/categories/${id}`);
  return response;
}
