export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
] as const;

export const PAYMENT_STATUSES = [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
] as const;

export const PAYMENT_METHODS = [
  "CASH_ON_DELIVERY",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "UPI",
  "NET_BANKING",
  "WALLET",
] as const;

export const DELIVERY_METHODS = [
  "STANDARD",
  "EXPRESS",
  "SAME_DAY",
  "PICKUP",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export interface OrderItemDisplay {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  image: string | null;
  variantId: number | null;
  variantName: string | null;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderAddressDisplay {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderPaymentDisplay {
  id: number;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  reference: string | null;
}

export interface OrderDeliveryDisplay {
  id: number;
  method: DeliveryMethod;
  cost: number;
  status: string;
  createdAt: Date;
}

export interface OrderShippingDisplay {
  id: number;
  carrier: string | null;
  trackingNumber: string | null;
  status: string;
  estimatedDelivery: Date | null;
  actualDelivery: Date | null;
}

export interface OrderListItem {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  totalItems: number;
  couponCode: string | null;
  createdAt: Date;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  items?: OrderItemDisplay[];
  payment?: OrderPaymentDisplay | null;
  delivery?: OrderDeliveryDisplay | null;
}

export interface OrderDetail extends OrderListItem {
  items: OrderItemDisplay[];
  address: OrderAddressDisplay | null;
  payments: OrderPaymentDisplay[];
  delivery: OrderDeliveryDisplay | null;
  shipping: OrderShippingDisplay | null;
  notes: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  } | null;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetOrdersResult {
  data: OrderListItem[];
  meta: PaginationMeta;
}

export interface OrderTotals {
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
}

export interface CheckoutSummary {
  items: OrderItemDisplay[];
  totals: OrderTotals;
  count: number;
  coupon: {
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    discountAmount: number;
  } | null;
  delivery: {
    method: DeliveryMethod;
    label: string;
    cost: number;
  } | null;
}

export interface PlaceOrderInput {
  addressId: number;
  deliveryMethod?: DeliveryMethod;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface CancelOrderInput {
  reason?: string;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}
