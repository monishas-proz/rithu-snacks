"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  customerOrdersApi,
  type CustomerOrdersQueryParams,
  type CreateCustomerOrderPayload,
  type CancelCustomerOrderPayload,
} from "../api/customer-orders.api";

export const CUSTOMER_ORDERS_QUERY_KEY = ["customer", "orders"] as const;

export function useCustomerOrders(params: CustomerOrdersQueryParams = {}) {
  return useQuery({
    queryKey: [...CUSTOMER_ORDERS_QUERY_KEY, params],
    queryFn: () => customerOrdersApi.listOrders(params),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useCustomerOrderDetail(uuid: string) {
  return useQuery({
    queryKey: [...CUSTOMER_ORDERS_QUERY_KEY, "detail", uuid],
    queryFn: () => customerOrdersApi.getOrderByUuid(uuid),
    enabled: Boolean(uuid),
  });
}

export function useCreateCustomerOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCustomerOrderPayload) =>
      customerOrdersApi.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["customer", "cart"] });
    },
  });
}

export function useCancelCustomerOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      uuid,
      payload,
    }: {
      uuid: string;
      payload?: CancelCustomerOrderPayload;
    }) => customerOrdersApi.cancelOrder(uuid, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...CUSTOMER_ORDERS_QUERY_KEY, "detail", variables.uuid],
      });
    },
  });
}
