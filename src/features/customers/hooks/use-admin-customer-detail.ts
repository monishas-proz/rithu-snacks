"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminCustomerKeys } from "@/lib/api/query-keys";
import { getAdminCustomerDetail } from "../api/admin-customers.api";
import type { AdminCustomerListResponse } from "../types/admin-customer.types";

export function useAdminCustomerDetail(id: string) {
  const queryClient = useQueryClient();
  const cleanId = id?.trim();

  return useQuery({
    queryKey: adminCustomerKeys.detail(cleanId),
    queryFn: () => getAdminCustomerDetail(cleanId),
    initialData: () => {
      if (!cleanId) return undefined;
      const cachedQueries = queryClient.getQueriesData<AdminCustomerListResponse>({
        queryKey: adminCustomerKeys.all,
      });

      for (const [, listData] of cachedQueries) {
        if (listData?.data && Array.isArray(listData.data)) {
          const found = listData.data.find(
            (c) =>
              c.id === cleanId ||
              c.userId === cleanId ||
              (c.customerId && c.customerId.toLowerCase() === cleanId.toLowerCase())
          );
          if (found) return found;
        }
      }
      return undefined;
    },
    enabled: Boolean(cleanId && cleanId !== "default"),
    staleTime: 30 * 1000,
  });
}
