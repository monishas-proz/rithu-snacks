"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { categoryKeys } from "@/lib/api/query-keys";
import { getCategories, getCategory } from "../api/get-categories";
import type { GetCategoriesParams } from "../types";

export function useCategories(params?: GetCategoriesParams) {
  const queryParams: Record<string, string | number | boolean | undefined> = {};

  if (params?.page !== undefined) {
    queryParams.page = params.page;
  }

  if (params?.pageSize !== undefined) {
    queryParams.pageSize = params.pageSize;
  }

  if (params?.search) {
    queryParams.search = params.search;
  }

  if (params?.parentId !== undefined && params?.parentId !== null) {
    queryParams.parentId = params.parentId;
  }

  return useQuery({
    queryKey: categoryKeys.list(queryParams),
    queryFn: () => getCategories(queryParams),
    placeholderData: keepPreviousData,
  });
}

export function useCategory(slugOrId: string | null) {
  return useQuery({
    queryKey: categoryKeys.detail(slugOrId ?? ""),
    queryFn: () => getCategory(slugOrId!),
    enabled: !!slugOrId,
  });
}