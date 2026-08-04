"use client";

import { useQuery } from "@tanstack/react-query";
import { brandKeys } from "@/lib/api/query-keys";
import { getBrands, getBrand } from "../api/get-brands";
import type { GetBrandsParams } from "../types";

export function useBrands(params?: GetBrandsParams) {
  const queryParams: Record<string, string | number | boolean | undefined> = {};
  if (params?.search) queryParams.search = params.search;
  if (params?.page) queryParams.page = params.page;
  if (params?.limit) queryParams.limit = params.limit;
  if (params?.isActive !== undefined) queryParams.isActive = params.isActive;

  return useQuery({
    queryKey: brandKeys.list(queryParams),
    queryFn: () => getBrands(queryParams),
  });
}

export function useBrand(slugOrId: string | null) {
  return useQuery({
    queryKey: brandKeys.detail(slugOrId ?? ""),
    queryFn: () => getBrand(slugOrId!),
    enabled: !!slugOrId,
  });
}
