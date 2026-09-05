"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { productKeys } from "@/lib/api/query-keys";
import {
  getAdminProducts,
  getAdminProduct,
  getCustomerProducts,
  getCustomerProduct,
} from "../api/get-products";
import type {
  AdminProductListParams,
  GetAdminProductsParams,
  CustomerProductListParams,
} from "../types";

export function useCustomerProducts(params?: CustomerProductListParams) {
  const queryParams: Record<string, string | number | boolean | undefined> = {
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 20,
    search: params?.search,
    categoryIds: params?.categoryIds?.length ? params.categoryIds.join(",") : undefined,
    brandIds: params?.brandIds?.length ? params.brandIds.join(",") : undefined,
    sortBy: params?.sortBy ?? "createdAt",
    sortOrder: params?.sortOrder ?? "desc",
  };

  return useQuery({
    queryKey: productKeys.list({ ...queryParams, type: "customer" }),
    queryFn: () => getCustomerProducts(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCustomerProduct(uuid: string | null) {
  return useQuery({
    queryKey: productKeys.detail(uuid ? `customer-${uuid}` : ""),
    queryFn: () => getCustomerProduct(uuid!),
    enabled: !!uuid,
  });
}

export function useProducts(
  params?: AdminProductListParams | GetAdminProductsParams,
  options?: { enabled?: boolean }
) {
  const queryParams: Record<string, string | number | boolean | undefined> = {};
  if (params?.page) queryParams.page = params.page;
  if (params?.pageSize) queryParams.pageSize = params.pageSize;
  if ((params as AdminProductListParams)?.limit) {
    queryParams.limit = (params as AdminProductListParams).limit;
  }
  if (params?.search) queryParams.search = params.search;

  const p = params as AdminProductListParams | undefined;
  if (p?.isActive !== undefined) queryParams.isActive = p.isActive;
  if (p?.categoryId) queryParams.categoryId = p.categoryId;
  if (p?.brandId) queryParams.brandId = p.brandId;
  if (p?.hsnCodeId) queryParams.hsnCodeId = p.hsnCodeId;
  if (p?.status !== undefined) queryParams.status = p.status;
  if (p?.sortBy) queryParams.sortBy = p.sortBy;
  if (p?.sortOrder) queryParams.sortOrder = p.sortOrder;

  return useQuery({
    queryKey: productKeys.list(queryParams),
    queryFn: () => getAdminProducts(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useProduct(uuid: string | null) {
  return useQuery({
    queryKey: productKeys.detail(uuid ?? ""),
    queryFn: () => getAdminProduct(uuid!),
    enabled: !!uuid,
  });
}

export function useProductImages(productUuid: string | null) {
  return useQuery({
    queryKey: productUuid
      ? ([...productKeys.all, "images", productUuid] as const)
      : (["products", "images"] as const),
    queryFn: async () => {
      if (!productUuid) return [];
      const { getAdminProductImages } = await import("../api/get-products");
      return getAdminProductImages(productUuid);
    },
    enabled: !!productUuid,
  });
}

export const useAdminProducts = useProducts;
export const useAdminProduct = useProduct;
