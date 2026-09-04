"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { WishlistEmpty } from "@/features/wishlist/components/WishlistEmpty";
import { ProductCard } from "@/components/storefront";
import {
  useWishlist,
  useRemoveFromWishlist,
  useMoveWishlistItemToCart,
} from "@/features/wishlist/hooks/use-wishlist";
import { mapWishlistItemToStorefrontProduct } from "@/lib/storefront";
import type { CustomerWishlistItemDto } from "@/features/wishlist/types";

export default function WishlistPage() {
  const { status } = useSession();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const {
    data: wishlist,
    isLoading,
    error,
    refetch,
  } = useWishlist({ enabled: status === "authenticated" });
  const removeFromWishlist = useRemoveFromWishlist();
  const moveToCart = useMoveWishlistItemToCart();

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login?callbackUrl=/wishlist");
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState
          message="Failed to load wishlist. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const items = wishlist?.items ?? [];

  const handleRemove = (item: CustomerWishlistItemDto) => {
    setPendingId(item.variantUnitPriceId);
    removeFromWishlist.mutate(item.variantUnitPriceId, {
      onSettled: () => setPendingId(null),
    });
  };

  const handleMoveToCart = (item: CustomerWishlistItemDto) => {
    setPendingId(item.variantUnitPriceId);
    moveToCart.mutate(item.variantUnitPriceId, {
      onSettled: () => setPendingId(null),
    });
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
        <WishlistEmpty />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          My Wishlist ({items.length} items)
        </h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <ProductCard
            key={item.id}
            type="wishlist"
            product={mapWishlistItemToStorefrontProduct(item)}
            isWishlisted
            onWishlistClick={() => handleRemove(item)}
            onButtonClick={() => handleMoveToCart(item)}
            disabled={pendingId === item.variantUnitPriceId}
          />
        ))}
      </div>
    </div>
  );
}
