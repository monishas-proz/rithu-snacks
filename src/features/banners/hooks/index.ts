"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { bannerApi } from "../api/get-banners";
import type {
  BannerListQueryInput,
  CreateBannerInput,
  UpdateBannerInput,
  BannerPositionListQueryInput,
  CreateBannerPositionInput,
  UpdateBannerPositionInput,
} from "../types";

export const BANNER_KEYS = {
  all: ["banners"] as const,
  lists: () => [...BANNER_KEYS.all, "list"] as const,
  list: (params?: BannerListQueryInput) =>
    [...BANNER_KEYS.lists(), params] as const,
  details: () => [...BANNER_KEYS.all, "detail"] as const,
  detail: (uuid: string) => [...BANNER_KEYS.details(), uuid] as const,

  positions: ["banner-positions"] as const,
  positionLists: () => [...BANNER_KEYS.positions, "list"] as const,
  positionList: (params?: BannerPositionListQueryInput) =>
    [...BANNER_KEYS.positionLists(), params] as const,
  positionDetails: () => [...BANNER_KEYS.positions, "detail"] as const,
  positionDetail: (uuid: string) =>
    [...BANNER_KEYS.positionDetails(), uuid] as const,
};

export function useBanners(
  params?: BannerListQueryInput,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: BANNER_KEYS.list(params),
    queryFn: () => bannerApi.getBanners(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useBanner(uuid: string | null) {
  return useQuery({
    queryKey: BANNER_KEYS.detail(uuid ?? ""),
    queryFn: () => bannerApi.getBanner(uuid!),
    enabled: !!uuid,
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
    mutationFn: ({ uuid, data }: { uuid: string; data: UpdateBannerInput }) =>
      bannerApi.updateBanner(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANNER_KEYS.all });
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => bannerApi.deleteBanner(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANNER_KEYS.all });
    },
  });
}

export function useBannerPositions(
  params?: BannerPositionListQueryInput,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: BANNER_KEYS.positionList(params),
    queryFn: () => bannerApi.getBannerPositions(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useCreateBannerPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBannerPositionInput) =>
      bannerApi.createBannerPosition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANNER_KEYS.positions });
    },
  });
}

export function useUpdateBannerPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      uuid,
      data,
    }: {
      uuid: string;
      data: UpdateBannerPositionInput;
    }) => bannerApi.updateBannerPosition(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANNER_KEYS.positions });
    },
  });
}

export function useDeleteBannerPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => bannerApi.deleteBannerPosition(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANNER_KEYS.positions });
    },
  });
}

