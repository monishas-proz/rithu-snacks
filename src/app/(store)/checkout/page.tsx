"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MapPin,
  Truck,
  Ticket,
  CreditCard,
  Loader2,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup } from "@/components/ui/Radio";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/features/cart/hooks/use-cart";
import { AddressList } from "@/features/addresses/components/AddressList";
import { useAddresses } from "@/features/addresses/hooks";
import { useCheckout } from "@/features/checkout/checkout-context";
import {
  useCheckoutSummary,
  usePlaceOrder,
} from "@/features/orders/hooks";
import { OrderItemsList } from "@/features/orders/components/OrderItemsList";
import { OrderTotals } from "@/features/orders/components/OrderTotals";
import {
  DELIVERY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from "@/features/orders/constants";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [couponInput, setCouponInput] = useState("");

  const { data: cart, isLoading: cartLoading, error: cartError, refetch: refetchCart } = useCart();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const checkout = useCheckout();
  const placeOrder = usePlaceOrder();

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useCheckoutSummary(checkout.deliveryMethod, checkout.couponCode);

  if (status === "loading" || cartLoading) {
    return <LoadingState text="Loading checkout..." />;
  }

  if (status === "unauthenticated" || !session) {
    router.push("/login?callbackUrl=/checkout");
    return null;
  }

  if (cartError) {
    return (
      <ErrorState
        message="Failed to load your cart. Please try again."
        onRetry={refetchCart}
      />
    );
  }

  const items = cart?.items ?? [];
  const selectedAddress = addresses?.find((a) => a.id === checkout.addressId);

  if (items.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        <EmptyState
          title="Your cart is empty"
          description="Add some products to your cart before proceeding to checkout."
        >
          <Link href="/products">
            <Button>
              Browse Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </EmptyState>
      </div>
    );
  }

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    checkout.setCouponCode(couponInput.trim().toUpperCase());
  };

  const handleRemoveCoupon = () => {
    checkout.setCouponCode(null);
    setCouponInput("");
  };

  const handlePlaceOrder = () => {
    if (!checkout.addressId) return;
    placeOrder.mutate(
      {
        addressId: checkout.addressId,
        deliveryMethod: checkout.deliveryMethod,
        couponCode: checkout.couponCode ?? undefined,
        paymentMethod: checkout.paymentMethod,
        notes: checkout.notes || undefined,
      },
      {
        onSuccess: (order) => {
          checkout.resetCheckout();
          router.push(`/checkout/success?orderNumber=${order.orderNumber}`);
        },
      }
    );
  };

  const canPlaceOrder = !!checkout.addressId && !!checkout.paymentMethod;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Delivery Address
              </CardTitle>
              <Link
                href="/checkout/address"
                className="text-sm font-medium text-primary hover:underline"
              >
                {selectedAddress ? "Change" : "Select"} Address
              </Link>
            </CardHeader>
            <CardContent>
              {addressesLoading ? (
                <LoadingState size="sm" text="Loading addresses..." />
              ) : selectedAddress ? (
                <div className="rounded-lg border border-primary bg-primary/5 p-4 text-sm">
                  <p className="font-medium">
                    {selectedAddress.firstName} {selectedAddress.lastName}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {selectedAddress.addressLine1}
                    {selectedAddress.addressLine2
                      ? `, ${selectedAddress.addressLine2}`
                      : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {selectedAddress.city}, {selectedAddress.state} -{" "}
                    {selectedAddress.postalCode}
                  </p>
                  <p className="text-muted-foreground">
                    Phone: {selectedAddress.phone}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Choose a delivery address or add a new one.
                  </p>
                  <AddressList
                    addresses={addresses ?? []}
                    selectable
                    selectedId={checkout.addressId}
                    onSelect={(id) => checkout.setAddressId(id)}
                    onAdd={() => router.push("/checkout/address")}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4 text-muted-foreground" />
                Delivery Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                name="deliveryMethod"
                value={checkout.deliveryMethod}
                onValueChange={(value) =>
                  checkout.setDeliveryMethod(
                    value as typeof checkout.deliveryMethod
                  )
                }
                options={Object.entries(DELIVERY_OPTIONS).map(
                  ([value, option]) => ({
                    value,
                    label: `${option.label} — ${
                      option.cost === 0 ? "Free" : formatPrice(option.cost)
                    }`,
                    description: option.description,
                  })
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                Coupon
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checkout.couponCode ? (
                <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-green-700">
                      Coupon applied: {checkout.couponCode}
                    </p>
                    {summary?.coupon && (
                      <p className="text-xs text-green-600">
                        You saved {formatPrice(summary.coupon.discountAmount)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveCoupon}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex h-10 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <Button variant="outline" onClick={handleApplyCoupon}>
                    Apply
                  </Button>
                </div>
              )}

              {summaryError && checkout.couponCode && (
                <p className="mt-2 text-sm text-destructive">
                  {summaryError.message}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                name="paymentMethod"
                value={checkout.paymentMethod}
                onValueChange={(value) =>
                  checkout.setPaymentMethod(
                    value as typeof checkout.paymentMethod
                  )
                }
                options={PAYMENT_METHOD_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                  description: option.description,
                }))}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                Order Summary ({summary?.count ?? items.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-72 overflow-y-auto">
                <OrderItemsList items={summary?.items ?? []} compact />
              </div>

              <div className="my-4 border-t" />

              {summaryLoading ? (
                <LoadingState size="sm" text="Calculating totals..." />
              ) : summary ? (
                <OrderTotals
                  totals={summary.totals}
                  couponLabel={summary.coupon?.code ?? null}
                />
              ) : (
                <ErrorState
                  title="Could not calculate totals"
                  message={summaryError?.message}
                  onRetry={refetchSummary}
                />
              )}

              <Button
                className="mt-5 w-full"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={
                  !canPlaceOrder || summaryLoading || placeOrder.isPending
                }
              >
                {placeOrder.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Place Order
              </Button>

              {!checkout.addressId && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Select a delivery address to place your order.
                </p>
              )}

              {placeOrder.error && (
                <p className="mt-2 text-sm text-destructive">
                  {placeOrder.error.message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
