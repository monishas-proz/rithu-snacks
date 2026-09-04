"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartKeys } from "@/lib/api/query-keys";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartCount,
} from "../api/get-cart";
import type { AddCartItemInput, UpdateCartItemInput } from "../validations/cart.schema";

export function useCart(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: cartKeys.all,
    queryFn: getCart,
    enabled: options?.enabled,
  });
}

export function useCartCount(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...cartKeys.all, "count"],
    queryFn: getCartCount,
    enabled: options?.enabled,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddCartItemInput) => addToCart(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useUpdateCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      variantUnitPriceId,
      quantity,
    }: UpdateCartItemInput & { variantUnitPriceId: string }) =>
      updateCartItem(variantUnitPriceId, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantUnitPriceId: string) => removeCartItem(variantUnitPriceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}
