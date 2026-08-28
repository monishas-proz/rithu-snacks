"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { variantKeys } from "@/lib/api/query-keys";
import {
  createAdminVariant,
  updateAdminVariant,
  deleteAdminVariant,
} from "../api/get-variants";

export function useCreateVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productUuid,
      data,
    }: {
      productUuid: string;
      data: Record<string, unknown>;
    }) => createAdminVariant(productUuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantKeys.all });
    },
  });
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productUuid,
      variantUuid,
      data,
    }: {
      productUuid: string;
      variantUuid: string;
      data: Record<string, unknown>;
    }) => updateAdminVariant(productUuid, variantUuid, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: variantKeys.all });
      queryClient.invalidateQueries({
        queryKey: variantKeys.detail(variables.variantUuid),
      });
    },
  });
}

export function useDeleteVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productUuid,
      variantUuid,
    }: {
      productUuid: string;
      variantUuid: string;
    }) => deleteAdminVariant(productUuid, variantUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantKeys.all });
    },
  });
}

export function useCreateVariantImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productUuid,
      variantUuid,
      images,
    }: {
      productUuid: string;
      variantUuid: string;
      images: Array<{
        imageUrl: string;
        sortOrder?: number;
        isPrimary?: boolean;
      }>;
    }) => {
      const { createAdminVariantImages } = await import("../api/get-variants");
      return createAdminVariantImages(productUuid, variantUuid, images);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: variantKeys.all });
      queryClient.invalidateQueries({
        queryKey: [...variantKeys.all, "images", variables.variantUuid],
      });
    },
  });
}

export function useUpdateVariantImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productUuid,
      variantUuid,
      imageUuid,
      data,
    }: {
      productUuid: string;
      variantUuid: string;
      imageUuid: string;
      data: { imageUrl?: string; sortOrder?: number };
    }) => {
      const { updateAdminVariantImage } = await import("../api/get-variants");
      return updateAdminVariantImage(productUuid, variantUuid, imageUuid, data);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: variantKeys.all });
      queryClient.invalidateQueries({
        queryKey: [...variantKeys.all, "images", variables.variantUuid],
      });
    },
  });
}

export function useSetPrimaryVariantImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productUuid,
      variantUuid,
      imageUuid,
    }: {
      productUuid: string;
      variantUuid: string;
      imageUuid: string;
    }) => {
      const { setPrimaryAdminVariantImage } = await import("../api/get-variants");
      return setPrimaryAdminVariantImage(productUuid, variantUuid, imageUuid);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: variantKeys.all });
      queryClient.invalidateQueries({
        queryKey: [...variantKeys.all, "images", variables.variantUuid],
      });
      queryClient.invalidateQueries({
        queryKey: variantKeys.detail(variables.variantUuid),
      });
    },
  });
}

export function useDeleteVariantImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productUuid,
      variantUuid,
      imageUuid,
    }: {
      productUuid: string;
      variantUuid: string;
      imageUuid: string;
    }) => {
      const { deleteAdminVariantImage } = await import("../api/get-variants");
      return deleteAdminVariantImage(productUuid, variantUuid, imageUuid);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: variantKeys.all });
      queryClient.invalidateQueries({
        queryKey: [...variantKeys.all, "images", variables.variantUuid],
      });
    },
  });
}
