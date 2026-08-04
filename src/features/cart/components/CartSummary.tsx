"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { formatPrice } from "@/lib/utils";
import type { CartSummary as CartSummaryType } from "../types";

interface CartSummaryProps {
  summary: CartSummaryType;
  onCheckout?: () => void;
  isCheckingOut?: boolean;
}

function CartSummary({
  summary,
  onCheckout,
  isCheckingOut = false,
}: CartSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Subtotal ({summary.totalItems} items)
            </span>
            <span>{formatPrice(summary.subtotal)}</span>
          </div>

          {summary.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-green-600">-{formatPrice(summary.discount)}</span>
            </div>
          )}

          {summary.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatPrice(summary.tax)}</span>
            </div>
          )}

          {summary.shippingCharge > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatPrice(summary.shippingCharge)}</span>
            </div>
          )}

          {summary.shippingCharge === 0 && summary.totalItems > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-green-600">Free</span>
            </div>
          )}
        </div>

        <div className="border-t" />

        <div className="flex justify-between font-semibold">
          <span>Grand Total</span>
          <span className="text-primary">{formatPrice(summary.grandTotal)}</span>
        </div>

        {onCheckout && (
          <Button
            className="w-full"
            onClick={onCheckout}
            disabled={isCheckingOut || summary.totalItems === 0}
          >
            {isCheckingOut ? "Processing..." : "Proceed to Checkout"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export { CartSummary };
