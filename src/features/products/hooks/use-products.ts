"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { productKeys } from "@/lib/api/query-keys";
import {
  getStoreProducts,
  getStoreProduct,
  getAdminProducts,
  getAdminProduct,
} from "../api/get-products";
import type { AdminProductListParams, GetAdminProductsParams } from "../types";

export function useProducts(
  params?: Record<string, unknown>,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: productKeys.list(params ?? {}),
    queryFn: () => getStoreProducts(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useProduct(idOrSlug: string | null) {
  return useQuery({
    queryKey: productKeys.detail(idOrSlug ?? ""),
    queryFn: () => getStoreProduct(idOrSlug!),
    enabled: !!idOrSlug,
  });
}

export function useAdminProducts(
  params?: AdminProductListParams | GetAdminProductsParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["admin", "products", "list", params ?? {}],
    queryFn: () => getAdminProducts(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useAdminProduct(uuid: string | null) {
  return useQuery({
    queryKey: ["admin", "products", "detail", uuid ?? ""],
    queryFn: () => getAdminProduct(uuid!),
    enabled: !!uuid,
  });
}
