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
