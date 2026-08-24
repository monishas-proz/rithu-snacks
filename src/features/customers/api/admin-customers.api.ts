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

export async function getAdminCustomerDetail(
  idOrUuid: string
): Promise<AdminCustomerListItemDto> {
  const cleanId = idOrUuid.trim();

  // 1. Fetch customer list (page 1 with up to 100 items)
  const firstPage = await getAdminCustomers({
    page: 1,
    pageSize: 100,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  let match = firstPage.data.find(
    (c) =>
      c.id === cleanId ||
      c.userId === cleanId ||
      (c.customerId && c.customerId.toLowerCase() === cleanId.toLowerCase())
  );

  if (match) {
    return match;
  }

  // 2. If not found in first page and more pages exist, search subsequent pages
  const totalPages = firstPage.meta?.totalPages || 1;
  for (let page = 2; page <= totalPages; page++) {
    const pageResult = await getAdminCustomers({
      page,
      pageSize: 100,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    match = pageResult.data.find(
      (c) =>
        c.id === cleanId ||
        c.userId === cleanId ||
        (c.customerId && c.customerId.toLowerCase() === cleanId.toLowerCase())
    );

    if (match) {
      return match;
    }
  }

  // 3. Fallback search (in case cleanId is name, email, phone, or cust_id)
  const searchResult = await getAdminCustomers({
    search: cleanId,
    pageSize: 20,
  });

  match = searchResult.data.find(
    (c) =>
      c.id === cleanId ||
      c.userId === cleanId ||
      (c.customerId && c.customerId.toLowerCase() === cleanId.toLowerCase())
  ) || searchResult.data[0];

  if (!match) {
    throw new Error(`Customer with ID '${idOrUuid}' not found.`);
  }

  return match;
}
