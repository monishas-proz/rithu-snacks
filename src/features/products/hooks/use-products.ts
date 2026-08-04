import { useQuery } from "@tanstack/react-query";
import { productKeys } from "@/lib/api/query-keys";
import { getProducts, getProduct } from "../api/get-products";
import type { GetProductsParams } from "../types";

export function useProducts(params?: GetProductsParams) {
  const queryParams: Record<string, string | number | boolean | undefined> = {};
  if (params?.page) queryParams.page = params.page;
  if (params?.limit) queryParams.limit = params.limit;
  if (params?.search) queryParams.search = params.search;
  if (params?.category) queryParams.category = params.category;
  if (params?.brand) queryParams.brand = params.brand;
  if (params?.sort) queryParams.sort = params.sort;
  if (params?.isFeatured !== undefined) queryParams.isFeatured = params.isFeatured;
  if (params?.minPrice !== undefined) queryParams.minPrice = params.minPrice;
  if (params?.maxPrice !== undefined) queryParams.maxPrice = params.maxPrice;

  return useQuery({
    queryKey: productKeys.list(queryParams),
    queryFn: () => getProducts(queryParams),
    placeholderData: (prev) => prev,
  });
}

export function useProduct(slugOrId: string | null) {
  return useQuery({
    queryKey: productKeys.detail(slugOrId ?? ""),
    queryFn: () => getProduct(slugOrId!),
    enabled: !!slugOrId,
  });
}
