"use client";

import {
  MapPin,
  CreditCard,
  Truck,
  CalendarDays,
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
import { DELIVERY_OPTIONS } from "../constants";
import type { OrderDetail } from "../types";

interface OrderDetailViewProps {
  order: OrderDetail;
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
  const address = order.address;
  const payment = order.payments[0];
  const delivery = order.delivery;
  const shipping = order.shipping;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{order.orderNumber}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <OrderStatusBadge status={order.status} />
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={onCancel}
              disabled={isCancelling}
            >
              {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderItemsList items={order.items} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">
                    {address.firstName} {address.lastName}
                  </p>
                  <p>
                    {address.addressLine1}
                    {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                  </p>
                  <p>
                    {address.city}, {address.state} - {address.postalCode}
                  </p>
                  <p>{address.country}</p>
                  <p>Phone: {address.phone}</p>
                  <p>Email: {address.email}</p>
                </CardContent>
              </Card>
            )}

            {payment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Method</span>
                    <span className="font-medium text-foreground">
                      {payment.method.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Amount</span>
                    <span className="font-medium text-foreground">
                      {formatPrice(payment.amount)}
                    </span>
                  </div>
                  {payment.reference && (
                    <p className="text-xs">Ref: {payment.reference}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {delivery && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Method</span>
                    <span className="font-medium text-foreground">
                      {DELIVERY_OPTIONS[delivery.method]?.label ?? delivery.method}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cost</span>
                    <span className="font-medium text-foreground">
                      {delivery.cost === 0 ? "Free" : formatPrice(delivery.cost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span className="font-medium text-foreground">
                      {delivery.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {shipping && (shipping.trackingNumber || shipping.carrier) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tracking</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  {shipping.carrier && <p>Carrier: {shipping.carrier}</p>}
                  {shipping.trackingNumber && (
                    <p>Tracking: {shipping.trackingNumber}</p>
                  )}
                  <p>Status: {shipping.status.replace(/_/g, " ")}</p>
                  {shipping.estimatedDelivery && (
                    <p>
                      Estimated: {formatDateTime(shipping.estimatedDelivery)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTotals
                totals={{
                  subtotal: order.subtotal,
                  taxAmount: order.taxAmount,
                  shippingAmount: order.shippingAmount,
                  discountAmount: order.discountAmount,
                  totalAmount: order.totalAmount,
                }}
                couponLabel={order.couponCode}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
