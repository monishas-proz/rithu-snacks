"use client";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "../types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
};

const ORDER_STATUS_VARIANTS: Record<OrderStatus, BadgeProps["variant"]> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PROCESSING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
  RETURNED: "warning",
  REFUNDED: "secondary",
};

const PAYMENT_STATUS_VARIANTS: Record<PaymentStatus, BadgeProps["variant"]> = {
  PENDING: "warning",
  COMPLETED: "success",
  FAILED: "destructive",
  REFUNDED: "secondary",
  CANCELLED: "destructive",
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge variant={ORDER_STATUS_VARIANTS[status] ?? "secondary"} className={cn(className)}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  return (
    <Badge variant={PAYMENT_STATUS_VARIANTS[status] ?? "secondary"} className={cn(className)}>
      {PAYMENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
