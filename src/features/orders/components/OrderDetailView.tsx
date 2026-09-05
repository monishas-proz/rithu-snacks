"use client";

import {
  MapPin,
  CreditCard,
  Truck,
  CalendarDays,
  User,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { OrderItemsList } from "./OrderItemsList";
import { OrderTotals } from "./OrderTotals";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "./OrderStatusBadge";
import type { OrderDetailResponse, OrderDetail } from "../types";

interface OrderDetailViewProps {
  order: OrderDetailResponse | OrderDetail;
  onCancel?: () => void;
  isCancelling?: boolean;
  canCancel?: boolean;
}

export function OrderDetailView({
  order,
  onCancel,
  isCancelling = false,
  canCancel = false,
}: OrderDetailViewProps) {
  const shippingAddress =
    ("shippingAddress" in order ? order.shippingAddress : (order as any).address) ||
    null;
  const billingAddress =
    ("billingAddress" in order ? order.billingAddress : null) || null;
  const customer = "customer" in order ? order.customer : (order as any).user;
  const shippingCharge =
    "shippingCharge" in order
      ? order.shippingCharge
      : (order as any).shippingAmount || 0;
  const statusHistory =
    "statusHistory" in order ? order.statusHistory || [] : [];
  const delivery = "delivery" in order ? order.delivery : (order as any).delivery;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">
            {order.orderNumber}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Placed on {formatDateTime((order as any).placedAt || order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          {order.paymentStatus && (
            <PaymentStatusBadge status={order.paymentStatus} />
          )}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              className="text-error-600 border-error-200 hover:bg-error-50"
              onClick={onCancel}
              disabled={isCancelling}
            >
              {isCancelling && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Order Items ({order.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderItemsList items={order.items || []} />
            </CardContent>
          </Card>

          {/* Customer, Address & Delivery Staff Information */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Customer Details */}
            {customer && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Customer Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1.5 text-neutral-600">
                  <p className="font-semibold text-neutral-900">
                    {customer.name || "Customer"}
                  </p>
                  {customer.customerId && (
                    <p className="text-xs font-mono text-neutral-500">
                      ID: {customer.customerId}
                    </p>
                  )}
                  {customer.email && <p>Email: {customer.email}</p>}
                  {customer.phone && <p>Phone: {customer.phone}</p>}
                </CardContent>
              </Card>
            )}

            {/* Shipping Address */}
            {shippingAddress && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-neutral-600 space-y-1">
                  <p className="font-semibold text-neutral-900">
                    {shippingAddress.fullName}
                  </p>
                  <p>
                    {shippingAddress.addressLine1}
                    {shippingAddress.addressLine2
                      ? `, ${shippingAddress.addressLine2}`
                      : ""}
                  </p>
                  {shippingAddress.landmark && (
                    <p className="text-xs text-neutral-500">
                      Landmark: {shippingAddress.landmark}
                    </p>
                  )}
                  <p>
                    {shippingAddress.city}, {shippingAddress.state}{" "}
                    {shippingAddress.pincode ? `- ${shippingAddress.pincode}` : ""}
                  </p>
                  <p>{shippingAddress.country || "India"}</p>
                  <p className="pt-1 text-xs text-neutral-500">
                    Phone: {shippingAddress.phone}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Assigned Delivery Staff */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  Assigned Staff
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-neutral-600">
                {delivery?.staff ? (
                  <>
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary-600 text-white text-xs font-bold shrink-0">
                        {delivery.staff.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 truncate">
                          {delivery.staff.name}
                        </p>
                        {delivery.assignmentStatus && (
                          <span className="inline-block text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded capitalize">
                            {delivery.assignmentStatus.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                    {delivery.staff.phone && (
                      <p className="text-xs">
                        Phone: <span className="font-mono">{delivery.staff.phone}</span>
                      </p>
                    )}
                    {delivery.staff.email && (
                      <p className="text-xs truncate">Email: {delivery.staff.email}</p>
                    )}
                    {delivery.assignedAt && (
                      <p className="text-xs text-neutral-400 pt-1">
                        Assigned on {formatDateTime(delivery.assignedAt)}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="py-2">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">
                      Unassigned
                    </span>
                    <p className="text-xs text-neutral-400 mt-2">
                      No delivery staff assigned yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-700">
                <p className="italic bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  &ldquo;{order.notes}&rdquo;
                </p>
              </CardContent>
            </Card>
          )}

          {/* Status Timeline */}
          {statusHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Status History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statusHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-start gap-3 text-sm pb-3 border-b border-neutral-100 last:border-0 last:pb-0"
                    >
                      <div className="mt-0.5">
                        <OrderStatusBadge status={item.status} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {item.note && (
                          <p className="text-neutral-800 font-medium">
                            {item.note}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Totals Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTotals
                totals={{
                  subtotal: Number(order.subtotal || 0),
                  taxAmount: Number(order.taxAmount || 0),
                  shippingAmount: Number(shippingCharge || 0),
                  discountAmount: Number(order.discountAmount || 0),
                  totalAmount: Number(order.totalAmount || 0),
                }}
                couponLabel={(order as any).couponCode}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
