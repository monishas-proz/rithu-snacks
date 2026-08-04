"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartKeys, orderKeys, adminOrderKeys, checkoutKeys } from "@/lib/api/query-keys";
import {
  getOrders,
  getOrder,
  getOrderByNumber,
  placeOrder,
  cancelOrder,
  cancelOrderAdmin,
  getAdminOrders,
  getAdminOrder,
  updateOrderStatus,
  getCheckoutSummary,
} from "../api/get-orders";
import type {
  DeliveryMethod,
  GetOrdersParams,
  PlaceOrderInput,
  UpdateOrderStatusInput,
} from "../types";

export function useOrders(params?: GetOrdersParams) {
  return useQuery({
    queryKey: orderKeys.list(
      params as Record<string, unknown> | undefined
    ),
    queryFn: () => getOrders(params),
  });
}

export function useOrder(id: number | null) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? 0),
    queryFn: () => getOrder(id!),
    enabled: !!id,
  });
}

export function useOrderByNumber(orderNumber: string | null) {
  return useQuery({
    queryKey: ["orders", "by-number", orderNumber ?? ""] as const,
    queryFn: () => getOrderByNumber(orderNumber!),
    enabled: !!orderNumber,
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PlaceOrderInput) => placeOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: checkoutKeys.all });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      cancelOrder(id, { reason }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
    },
  });
}

export function useCancelOrderAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      cancelOrderAdmin(id, { reason }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useAdminOrders(params?: GetOrdersParams) {
  return useQuery({
    queryKey: adminOrderKeys.list(
      params as Record<string, unknown> | undefined
    ),
    queryFn: () => getAdminOrders(params),
  });
}

export function useAdminOrder(id: number | null) {
  return useQuery({
    queryKey: adminOrderKeys.detail(id ?? 0),
    queryFn: () => getAdminOrder(id!),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: UpdateOrderStatusInput & { id: number }) =>
      updateOrderStatus(id, { status }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useCheckoutSummary(
  deliveryMethod: DeliveryMethod,
  couponCode: string | null
) {
  return useQuery({
    queryKey: checkoutKeys.list({ deliveryMethod, couponCode }),
    queryFn: () =>
      getCheckoutSummary({
        deliveryMethod,
        couponCode: couponCode ?? undefined,
      }),
  });
}
