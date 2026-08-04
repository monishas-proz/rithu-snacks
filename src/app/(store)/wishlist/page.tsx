"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { WishlistGrid } from "@/features/wishlist/components/WishlistGrid";
import { WishlistEmpty } from "@/features/wishlist/components/WishlistEmpty";
import {
  useWishlist,
  useRemoveFromWishlist,
} from "@/features/wishlist/hooks/use-wishlist";
import { useAddToCart } from "@/features/cart/hooks/use-cart";

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);

  const { data: wishlist, isLoading, error, refetch } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCart = useAddToCart();

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState />
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    router.push("/login?callbackUrl=/wishlist");
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState
          message="Failed to load wishlist. Please try again."
          onRetry={refetch}
        />
      </div>
    );
  }

  const items = wishlist?.items ?? [];

  const handleRemove = (productId: number) => {
    setRemovingId(productId);
    removeFromWishlist.mutate(productId, {
      onSettled: () => setRemovingId(null),
    });
  };

  const handleMoveToCart = (productId: number) => {
    setMovingId(productId);
    addToCart.mutate(
      { productId, quantity: 1 },
      {
        onSettled: () => {
          setMovingId(null);
          removeFromWishlist.mutate(productId);
        },
      }
    );
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

      <WishlistGrid
        items={items}
        onRemove={handleRemove}
        onMoveToCart={handleMoveToCart}
        removingId={removingId}
        movingId={movingId}
      />
    </div>
  );
}
