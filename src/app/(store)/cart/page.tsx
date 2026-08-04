"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { CartItem } from "@/features/cart/components/CartItem";
import { CartSummary } from "@/features/cart/components/CartSummary";
import { CartEmpty } from "@/features/cart/components/CartEmpty";
import {
  useCart,
  useUpdateCart,
  useRemoveCartItem,
} from "@/features/cart/hooks/use-cart";

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: cart, isLoading, error, refetch } = useCart();
  const updateCart = useUpdateCart();
  const removeCartItem = useRemoveCartItem();

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState />
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    router.push("/login?callbackUrl=/cart");
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState
          message="Failed to load cart. Please try again."
          onRetry={refetch}
        />
      </div>
    );
  }

  const items = cart?.items ?? [];
  const summary = cart?.summary ?? {
    subtotal: 0,
    discount: 0,
    tax: 0,
    shippingCharge: 0,
    grandTotal: 0,
    totalItems: 0,
  };

  const handleUpdateQuantity = (itemId: number, quantity: number) => {
    updateCart.mutate({ itemId, quantity });
  };

  const handleRemoveItem = (itemId: number) => {
    removeCartItem.mutate(itemId);
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
        Shopping Cart ({summary.totalItems} items)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
              isUpdating={updateCart.isPending}
              isRemoving={removeCartItem.isPending}
            />
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <CartSummary
              summary={summary}
              onCheckout={handleCheckout}
              isCheckingOut={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
