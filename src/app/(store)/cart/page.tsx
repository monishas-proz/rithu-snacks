"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { CartEmpty } from "@/features/cart/components/CartEmpty";
import { ProductCard } from "@/components/storefront";
import {
  useCart,
  useUpdateCart,
  useRemoveCartItem,
} from "@/features/cart/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { mapCartItemToStorefrontProduct } from "@/lib/storefront";
import type { CartItemResponse } from "@/features/cart/types";

export default function CartPage() {
  const { status } = useSession();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const {
    data: cart,
    isLoading,
    error,
    refetch,
  } = useCart({ enabled: status === "authenticated" });
  const updateCart = useUpdateCart();
  const removeCartItem = useRemoveCartItem();

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login?callbackUrl=/cart");
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState
          message="Failed to load cart. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const items = cart?.items ?? [];

  const handleIncrease = (item: CartItemResponse) => {
    setPendingId(item.variantUnitPriceId);
    updateCart.mutate(
      { variantUnitPriceId: item.variantUnitPriceId, quantity: item.quantity + 1 },
      { onSettled: () => setPendingId(null) }
    );
  };

  const handleDecrease = (item: CartItemResponse) => {
    if (item.quantity <= 1) return;
    setPendingId(item.variantUnitPriceId);
    updateCart.mutate(
      { variantUnitPriceId: item.variantUnitPriceId, quantity: item.quantity - 1 },
      { onSettled: () => setPendingId(null) }
    );
  };

  const handleRemove = (item: CartItemResponse) => {
    setPendingId(item.variantUnitPriceId);
    removeCartItem.mutate(item.variantUnitPriceId, {
      onSettled: () => setPendingId(null),
    });
  };

  const handleCheckout = () => {
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        <CartEmpty />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        Shopping Cart ({cart?.totalItems ?? 0} items)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              type="cart"
              product={mapCartItemToStorefrontProduct(item)}
              quantity={item.quantity}
              actions={{
                increaseQuantity: () => handleIncrease(item),
                decreaseQuantity: () => handleDecrease(item),
              }}
              onRemove={() => handleRemove(item)}
              onButtonClick={handleCheckout}
              disabled={pendingId === item.variantUnitPriceId}
            />
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold">Order Summary</h2>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Subtotal ({cart?.totalItems ?? 0} items)
              </span>
              <span>{formatPrice(cart?.subtotal ?? 0)}</span>
            </div>

            <div className="border-t" />

            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(cart?.subtotal ?? 0)}</span>
            </div>

            <Button className="w-full" onClick={handleCheckout}>
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
