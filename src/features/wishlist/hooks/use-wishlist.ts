"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { wishlistKeys } from "@/lib/api/query-keys";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
} from "../api/get-wishlist";

export function useWishlist() {
  return useQuery({
    queryKey: wishlistKeys.all,
    queryFn: getWishlist,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { productId: number }) => addToWishlist(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}

export function useWishlistStatus(productId: number) {
  return useQuery({
    queryKey: [...wishlistKeys.all, "status", productId],
    queryFn: () => checkWishlistStatus(productId),
    enabled: !!productId,
  });
}
