"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bannerApi } from "../api/get-banners";
import { GetBannersParams, CreateBannerInput, UpdateBannerInput } from "../types";

const BANNER_KEYS = {
  all: ["banners"] as const,
  lists: () => [...BANNER_KEYS.all, "list"] as const,
  list: (params?: GetBannersParams) => [...BANNER_KEYS.lists(), params] as const,
  details: () => [...BANNER_KEYS.all, "detail"] as const,
  detail: (id: number) => [...BANNER_KEYS.details(), id] as const,
};

export function useBanners(params?: GetBannersParams) {
  return useQuery({
    queryKey: BANNER_KEYS.list(params),
    queryFn: () => bannerApi.getBanners(params),
  });
}

export function useBanner(id: number) {
  return useQuery({
    queryKey: BANNER_KEYS.detail(id),
    queryFn: () => bannerApi.getBanner(id),
    enabled: !!id,
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBannerInput) => bannerApi.createBanner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANNER_KEYS.all });
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBannerInput }) =>
      bannerApi.updateBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANNER_KEYS.all });
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => bannerApi.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANNER_KEYS.all });
    },
  });
}
