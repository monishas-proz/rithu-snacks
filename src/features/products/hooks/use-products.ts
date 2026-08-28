"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { productKeys } from "@/lib/api/query-keys";
import { getAdminProducts, getAdminProduct } from "../api/get-products";
import type { AdminProductListParams, GetAdminProductsParams } from "../types";

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
  if (p?.vegType) queryParams.vegType = p.vegType;
  if (p?.isFeatured !== undefined) queryParams.isFeatured = p.isFeatured;
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

export const useAdminProducts = useProducts;
export const useAdminProduct = useProduct;
