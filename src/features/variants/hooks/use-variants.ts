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
  AdminVariantListParams,
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
    isActive:false
  };

  return useQuery({
    queryKey: variantKeys.list({ ...queryParams, type: "customer" }),
    queryFn: () => getCustomerVariants(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVariants(
  params?: AdminVariantListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: variantKeys.list((params ?? {}) as Record<string, unknown>),
    queryFn: () => getAdminVariants(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useProductVariants(
  productUuid: string | null,
  params?: GetAdminVariantsParams
) {
  return useQuery({
    queryKey: productUuid
      ? ([...variantKeys.all, "product", productUuid, params ?? {}] as const)
      : variantKeys.list((params ?? {}) as Record<string, unknown>),
    queryFn: () =>
      productUuid
        ? getAdminProductVariants(
            productUuid,
            params as Record<string, string | number | boolean | undefined | null>
          )
        : getAdminVariants(params),
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
