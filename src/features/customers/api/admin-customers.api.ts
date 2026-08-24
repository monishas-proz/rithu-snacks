import { apiClient } from "@/lib/api/api-client";
import type { AdminCustomerListInput } from "../validations/admin-customer.schema";
import type {
  AdminCustomerListItemDto,
  AdminCustomerListResponse,
} from "../types/admin-customer.types";

export async function getAdminCustomers(
  params?: Partial<AdminCustomerListInput>
): Promise<AdminCustomerListResponse> {
  const response = await apiClient.post<AdminCustomerListItemDto[]>(
    "/api/admin/customers",
    params ?? {
      page: 1,
      pageSize: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
    }
  );

  return {
    data: response.data ?? [],
    meta: (response.meta as AdminCustomerListResponse["meta"]) ?? {
      page: params?.page ?? 1,
      limit: params?.pageSize ?? 20,
      pageSize: params?.pageSize ?? 20,
      total: response.data?.length ?? 0,
      totalPages: 1,
    },
  };
}
