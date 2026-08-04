import { apiClient } from "@/lib/api/api-client";
import type {
  CheckoutSummary,
  DeliveryMethod,
  GetOrdersParams,
  GetOrdersResult,
  OrderDetail,
  OrderListItem,
  PlaceOrderInput,
  UpdateOrderStatusInput,
} from "../types";

function buildParams(params?: GetOrdersParams) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.status) searchParams.set("status", params.status);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function getOrders(params?: GetOrdersParams): Promise<GetOrdersResult> {
  const response = await apiClient.get<GetOrdersResult>(`/api/orders${buildParams(params)}`);
  return response.data!;
}

export async function getOrder(id: number): Promise<OrderDetail> {
  const response = await apiClient.get<OrderDetail>(`/api/orders/${id}`);
  return response.data!;
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderDetail> {
  const response = await apiClient.get<OrderDetail>(
    `/api/orders/number/${orderNumber}`
  );
  return response.data!;
}

export async function placeOrder(input: PlaceOrderInput): Promise<OrderDetail> {
  const response = await apiClient.post<OrderDetail>("/api/orders", input);
  return response.data!;
}

export async function cancelOrder(
  id: number,
  input?: { reason?: string }
): Promise<OrderDetail> {
  const response = await apiClient.patch<OrderDetail>(
    `/api/orders/${id}/cancel`,
    input ?? {}
  );
  return response.data!;
}

export async function cancelOrderAdmin(
  id: number,
  input?: { reason?: string }
): Promise<OrderDetail> {
  const response = await apiClient.patch<OrderDetail>(
    `/api/admin/orders/${id}/cancel`,
    input ?? {}
  );
  return response.data!;
}

export async function getAdminOrders(params?: GetOrdersParams): Promise<GetOrdersResult> {
  const response = await apiClient.get<GetOrdersResult>(
    `/api/admin/orders${buildParams(params)}`
  );
  return response.data!;
}

export async function getAdminOrder(id: number): Promise<OrderDetail> {
  const response = await apiClient.get<OrderDetail>(`/api/admin/orders/${id}`);
  return response.data!;
}

export async function updateOrderStatus(
  id: number,
  input: UpdateOrderStatusInput
): Promise<OrderDetail> {
  const response = await apiClient.patch<OrderDetail>(
    `/api/admin/orders/${id}/status`,
    input
  );
  return response.data!;
}

export async function getCheckoutSummary(
  input: { deliveryMethod?: DeliveryMethod; couponCode?: string }
): Promise<CheckoutSummary> {
  const response = await apiClient.post<CheckoutSummary>(
    "/api/checkout/summary",
    input ?? {}
  );
  return response.data!;
}
