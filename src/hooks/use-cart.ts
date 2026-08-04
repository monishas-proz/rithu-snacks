"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type { CartItem, ApiResponse } from "@/types";

export function useCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => apiClient.get<{ items: CartItem[] }>("/api/cart"),
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { productId: number; variantId?: number; quantity?: number }) =>
      apiClient.post("/api/cart", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      apiClient.put(`/api/cart/${itemId}`, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) =>
      apiClient.delete(`/api/cart/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
