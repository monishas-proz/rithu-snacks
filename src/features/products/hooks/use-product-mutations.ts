import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productKeys } from "@/lib/api/query-keys";
import { createProduct, updateProduct, deleteProduct } from "../api/get-products";
import { ApiClientError } from "@/lib/api/api-client";

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      updateProduct(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
