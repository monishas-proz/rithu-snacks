"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { useOrderByNumber } from "@/features/orders/hooks";
import { OrderStatusBadge, PaymentStatusBadge } from "@/features/orders/components/OrderStatusBadge";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");

  const { data: order, isLoading, error, refetch } = useOrderByNumber(orderNumber);

  if (isLoading) {
    return <LoadingState text="Confirming your order..." />;
  }

  if (error || !order) {
    return (
      <ErrorState
        title="Order not found"
        message={
          error?.message ??
          "We could not find your order. Please check your orders page."
        }
        onRetry={refetch}
      />
    );
  }

  const payment = order.payments[0];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold">Order Placed Successfully!</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for your purchase. We have received your order and will
          process it shortly.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-muted-foreground" />
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Order Number</span>
            <span className="font-semibold">{order.orderNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Order Date</span>
            <span>{formatDateTime(order.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Payment</span>
            {payment ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {payment.method.replace(/_/g, " ")}
                </span>
                <PaymentStatusBadge status={payment.status} />
              </div>
            ) : (
              <span>—</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Items</span>
            <span>{order.totalItems} item(s)</span>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold">{formatPrice(order.totalAmount)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/orders" className="flex-1">
          <Button className="w-full" variant="outline" size="lg">
            <Package className="mr-2 h-4 w-4" />
            View My Orders
          </Button>
        </Link>
        <Link href="/products" className="flex-1">
          <Button className="w-full" size="lg">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Continue Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingState text="Loading confirmation..." />}>
      <SuccessContent />
    </Suspense>
  );
}
