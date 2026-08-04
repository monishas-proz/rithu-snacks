"use client";

import { useQuery } from "@tanstack/react-query";
import { categoryKeys } from "@/lib/api/query-keys";
import { getCategories, getCategory } from "../api/get-categories";
import type { GetCategoriesParams } from "../types";

export function useCategories(params?: GetCategoriesParams) {
  const queryParams: Record<string, string | number | boolean | undefined> = {};
  if (params?.search) queryParams.search = params.search;
  if (params?.parentId !== undefined && params.parentId !== null) {
    queryParams.parentId = params.parentId;
  }

  return useQuery({
    queryKey: categoryKeys.list(queryParams),
    queryFn: () => getCategories(queryParams),
  });
}

export function useCategory(slugOrId: string | null) {
  return useQuery({
    queryKey: categoryKeys.detail(slugOrId ?? ""),
    queryFn: () => getCategory(slugOrId!),
    enabled: !!slugOrId,
  });
}
