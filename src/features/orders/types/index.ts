import type { orders_order_status, orders_payment_status, order_addresses_type } from "@/generated/prisma";
import type { VariantMeasurement } from "@/features/variants/utils/measurement.util";

export type OrderStatus = orders_order_status;
export type PaymentStatus = orders_payment_status;
export type OrderAddressType = order_addresses_type;

export interface OrderCustomerDto {
  id: string; // user.uuid
  customerId: string | null; // user.cust_id
  name: string;
  email: string | null;
  phone: string | null;
}

export interface OrderItemResponse {
  id: string; // item.uuid
  productId: string; // product.uuid
  variantId: string; // variant.uuid
  productName: string; // snapshot
  variantName: string; // snapshot
  sku: string; // snapshot
  measurement: VariantMeasurement;
  primaryImage: string | null;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  totalPrice: number;
}

export interface OrderAddressResponse {
  id: string; // address.uuid
  type: OrderAddressType;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

export interface OrderStatusHistoryResponse {
  id: string; // history id string or uuid
  status: string;
  note: string | null;
  createdAt: Date;
}

export interface OrderDeliveryStaffDto {
  id: string; // staff.uuid
  name: string;
  email: string | null;
  phone: string | null;
}

export interface OrderDeliveryDto {
  isAssigned: boolean;
  assignmentStatus: string | null;
  deliveryId: string | null;
  staff: OrderDeliveryStaffDto | null;
  assignedAt: Date | string | null;
}

export interface OrderListItemResponse {
  id: string; // order.uuid
  orderNumber: string;
  customer: OrderCustomerDto;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingCharge: number;
  totalAmount: number;
  totalItems: number;
  delivery?: OrderDeliveryDto;
  notes: string | null;
  placedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDetailResponse extends OrderListItemResponse {
  items: OrderItemResponse[];
  shippingAddress: OrderAddressResponse | null;
  billingAddress: OrderAddressResponse | null;
  statusHistory: OrderStatusHistoryResponse[];
}

export interface OrderStatusTransitionResponse {
  id: string;
  orderNumber: string;
  status: OrderStatus;
}

export interface OrderPaginationMeta {
  page: number;
  limit: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface OrderListResponse<T = OrderListItemResponse> {
  data: T[];
  meta: OrderPaginationMeta;
}

export type DeliveryMethod = "standard" | "express";

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface OrderListItem {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: Date | string;
  items?: OrderItemResponse[];
  customer?: OrderCustomerDto;
}

export interface OrderDetail extends OrderListItem {
  shippingAddress?: OrderAddressResponse | null;
  billingAddress?: OrderAddressResponse | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingCharge: number;
  notes?: string | null;
}

export interface GetOrdersResult {
  orders: OrderListItem[];
  pagination?: OrderPaginationMeta;
  total?: number;
}

export interface PlaceOrderInput {
  addressId: string;
  billingAddressId?: string;
  notes?: string;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  note?: string;
}

export interface CheckoutSummary {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingCharge: number;
  totalAmount: number;
  couponCode?: string | null;
  appliedCoupon?: unknown;
}

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

