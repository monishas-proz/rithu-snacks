"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { productKeys } from "@/lib/api/query-keys";
import { getAdminProducts, getAdminProduct } from "../api/get-products";
import type { GetAdminProductsParams } from "../types";

export function useProducts(params?: GetAdminProductsParams) {
  const queryParams: Record<string, string | number | boolean | undefined> = {};
  if (params?.page) queryParams.page = params.page;
  if (params?.pageSize) queryParams.pageSize = params.pageSize;
  if (params?.search) queryParams.search = params.search;

  return useQuery({
    queryKey: productKeys.list(queryParams),
    queryFn: () => getAdminProducts(queryParams),
    placeholderData: keepPreviousData,
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
