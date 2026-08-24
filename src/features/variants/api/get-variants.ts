import { apiClient } from "@/lib/api/api-client";
import type {
  AdminVariantResponse,
  AdminVariantImageResponse,
  GetAdminVariantsResult,
} from "../types";

export async function getAdminVariants(
  params?: Record<string, string | number | boolean | undefined | null>
): Promise<GetAdminVariantsResult> {
  const response = await apiClient.get<AdminVariantResponse[]>(
    "/api/admin/variants",
    { params }
  );

  return {
    data: response.data ?? [],
    meta: response.meta,
  };
}

export async function getAdminProductVariants(
  productUuid: string,
  params?: Record<string, string | number | boolean | undefined | null>
): Promise<GetAdminVariantsResult> {
  const response = await apiClient.get<AdminVariantResponse[]>(
    `/api/admin/products/${productUuid}/variants`,
    { params }
  );

  return {
    data: response.data ?? [],
    meta: response.meta,
  };
}

export async function getAdminVariant(
  productUuid: string,
  variantUuid: string
) {
  return apiClient.get<AdminVariantResponse>(
    `/api/admin/products/${productUuid}/variants/${variantUuid}`
  );
}

export async function createAdminVariant(
  productUuid: string,
  data: Record<string, unknown>
) {
  return apiClient.post<AdminVariantResponse>(
    `/api/admin/products/${productUuid}/variants`,
    data
  );
}

export async function updateAdminVariant(
  productUuid: string,
  variantUuid: string,
  data: Record<string, unknown>
) {
  return apiClient.put<AdminVariantResponse>(
    `/api/admin/products/${productUuid}/variants/${variantUuid}`,
    data
  );
}

export async function deleteAdminVariant(
  productUuid: string,
  variantUuid: string
) {
  return apiClient.delete(
    `/api/admin/products/${productUuid}/variants/${variantUuid}`
  );
}

// Variant Images API
export async function getAdminVariantImages(
  productUuid: string,
  variantUuid: string
): Promise<AdminVariantImageResponse[]> {
  const response = await apiClient.get<AdminVariantImageResponse[]>(
    `/api/admin/products/${productUuid}/variants/${variantUuid}/images`
  );
  return response.data ?? [];
}

export async function createAdminVariantImages(
  productUuid: string,
  variantUuid: string,
  images: Array<{
    imageUrl: string;
    sortOrder?: number;
    isPrimary?: boolean;
  }>
): Promise<AdminVariantImageResponse[]> {
  const response = await apiClient.post<AdminVariantImageResponse[]>(
    `/api/admin/products/${productUuid}/variants/${variantUuid}/images`,
    images
  );
  return response.data ?? [];
}

export async function updateAdminVariantImage(
  productUuid: string,
  variantUuid: string,
  imageUuid: string,
  data: { imageUrl?: string; sortOrder?: number }
) {
  return apiClient.put<AdminVariantImageResponse>(
    `/api/admin/products/${productUuid}/variants/${variantUuid}/images/${imageUuid}`,
    data
  );
}

export async function deleteAdminVariantImage(
  productUuid: string,
  variantUuid: string,
  imageUuid: string
) {
  return apiClient.delete(
    `/api/admin/products/${productUuid}/variants/${variantUuid}/images/${imageUuid}`
  );
}

// Multipart File Upload Helpers
export async function uploadVariantImageFile(
  file: File,
  folder: string = "variants"
): Promise<{ path: string }> {
  const formData = new FormData();
  formData.append("folder", folder);
  formData.append("file", file);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to upload image");
  }

  return result.data;
}

export async function uploadVariantImageFiles(
  files: File[],
  folder: string = "variants"
): Promise<{ paths: string[] }> {
  const formData = new FormData();
  formData.append("folder", folder);
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch("/api/admin/uploads", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to upload images");
  }

  return result.data;
}

// Aliases
export const getVariants = getAdminVariants;
export const getVariant = getAdminVariant;
export const createVariant = createAdminVariant;
export const updateVariant = updateAdminVariant;
export const deleteVariant = deleteAdminVariant;
