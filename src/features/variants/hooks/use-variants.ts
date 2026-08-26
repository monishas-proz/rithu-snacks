"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { variantKeys } from "@/lib/api/query-keys";
import {
  getAdminVariants,
  getAdminProductVariants,
  getAdminVariant,
  getCustomerVariants,
} from "../api/get-variants";
import type {
  GetAdminVariantsParams,
  CustomerGlobalVariantListParams,
} from "../types";

export function useCustomerVariants(params?: CustomerGlobalVariantListParams) {
  const queryParams: Record<string, string | number | boolean | undefined> = {
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 20,
    search: params?.search,
    categoryIds: params?.categoryIds?.length ? params.categoryIds.join(",") : undefined,
    brandIds: params?.brandIds?.length ? params.brandIds.join(",") : undefined,
    productIds: params?.productIds?.length ? params.productIds.join(",") : undefined,
    sortBy: params?.sortBy ?? "createdAt",
    sortOrder: params?.sortOrder ?? "desc",
  };

  return useQuery({
    queryKey: variantKeys.list({ ...queryParams, type: "customer" }),
    queryFn: () => getCustomerVariants(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVariants(params?: GetAdminVariantsParams) {
  const queryParams: Record<string, string | number | boolean | undefined> = {};
  if (params?.page) queryParams.page = params.page;
  if (params?.pageSize) queryParams.pageSize = params.pageSize;
  if (params?.search) queryParams.search = params.search;
  if (params?.productId) queryParams.productId = params.productId;
  if (params?.productUuid) queryParams.productUuid = params.productUuid;

  return useQuery({
    queryKey: variantKeys.list(queryParams),
    queryFn: () => getAdminVariants(queryParams),
    placeholderData: keepPreviousData,
  });
}

export function useProductVariants(
  productUuid: string | null,
  params?: GetAdminVariantsParams
) {
  const queryParams: Record<string, string | number | boolean | undefined> = {};
  if (params?.page) queryParams.page = params.page;
  if (params?.pageSize) queryParams.pageSize = params.pageSize;
  if (params?.search) queryParams.search = params.search;

  return useQuery({
    queryKey: productUuid
      ? ([...variantKeys.all, "product", productUuid, queryParams] as const)
      : variantKeys.list(queryParams),
    queryFn: () =>
      productUuid
        ? getAdminProductVariants(productUuid, queryParams)
        : getAdminVariants(queryParams),
    enabled: !!productUuid,
    placeholderData: keepPreviousData,
  });
}

export function useVariant(
  productUuid: string | null,
  variantUuid: string | null
) {
  return useQuery({
    queryKey: variantKeys.detail(variantUuid ?? ""),
    queryFn: () => getAdminVariant(productUuid!, variantUuid!),
    enabled: !!productUuid && !!variantUuid,
  });
}

export function useVariantImages(
  productUuid: string | null,
  variantUuid: string | null
) {
  return useQuery({
    queryKey: variantUuid
      ? ([...variantKeys.all, "images", variantUuid] as const)
      : (["variants", "images"] as const),
    queryFn: async () => {
      if (!productUuid || !variantUuid) return [];
      const { getAdminVariantImages } = await import("../api/get-variants");
      return getAdminVariantImages(productUuid, variantUuid);
    },
    enabled: !!productUuid && !!variantUuid,
  });
}

export const useAdminVariants = useVariants;
export const useAdminVariant = useVariant;
