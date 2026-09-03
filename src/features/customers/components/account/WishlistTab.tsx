"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useWishlist, useRemoveFromWishlist } from "@/features/wishlist/hooks/use-wishlist";
import { useAddToCart } from "@/features/cart/hooks/use-cart";
import type { WishlistItem } from "@/features/wishlist/types";

export function WishlistTab() {
  const { data: wishlist, isLoading, error, refetch } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCart = useAddToCart();
  const [movingId, setMovingId] = useState<number | null>(null);

  const items: WishlistItem[] = wishlist?.items ?? [];

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="bg-theme-surface border border-theme-border rounded-xl p-4 animate-pulse space-y-3"
          >
            <div className="h-32 bg-theme-border rounded" />
            <div className="h-4 bg-theme-border-subtle rounded w-3/4" />
            <div className="h-4 bg-theme-border-subtle rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-theme-surface border border-theme-border rounded-2xl p-8 text-center space-y-4">
        <p className="text-sm text-theme-text-muted">Failed to load your wishlist.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="bg-theme-primary text-theme-primary-fg px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-theme-text-secondary">
          Wishlist {items.length > 0 && `(${items.length})`}
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="bg-theme-surface border border-theme-border rounded-2xl p-12 text-center shadow-2xs">
          <div className="w-16 h-16 mx-auto mb-4 rotate-45 border-2 border-theme-border-accent rounded-xl bg-theme-surface-alt flex items-center justify-center">
            <span className="-rotate-45 text-theme-primary text-xl font-bold">♥</span>
          </div>
          <h3 className="text-base font-bold uppercase tracking-wide text-theme-text-secondary">
            Your Wishlist is Empty
          </h3>
          <p className="text-xs text-theme-text-muted max-w-xs mx-auto mt-2 mb-6">
            Save your favorite traditional treats here to reorder whenever you crave them.
          </p>
          <Link href="/products">
            <button
              type="button"
              className="bg-theme-secondary hover:bg-theme-secondary-hover text-theme-secondary-fg text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-lg transition-colors cursor-pointer min-h-[44px]"
            >
              Explore Snacks
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-theme-surface border border-theme-border rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between"
            >
              <div className="h-32 sm:h-36 bg-[repeating-linear-gradient(45deg,#F6ECDC,#F6ECDC_8px,#EFE2CD_8px,#EFE2CD_16px)] flex items-center justify-center">
                <span className="text-[10px] font-mono text-theme-text-muted uppercase tracking-wider">
                  {item.name ? item.name.slice(0, 16) : "SNACK"}
                </span>
              </div>

              <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase text-theme-text-primary line-clamp-2 min-h-[32px]">
                    {item.name}
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-xs sm:text-sm font-semibold text-theme-primary">
                      {formatPrice(item.price)}
                    </span>
                    {item.mrp && item.mrp > item.price && (
                      <span className="text-[11px] text-theme-text-muted line-through">
                        {formatPrice(item.mrp)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleMoveToCart(item.productId)}
                    disabled={movingId === item.productId}
                    className="w-full bg-theme-secondary hover:bg-theme-secondary-hover text-theme-secondary-fg text-xs font-semibold uppercase tracking-wider py-2.5 rounded-md transition-colors cursor-pointer min-h-[40px] disabled:opacity-50"
                  >
                    {movingId === item.productId ? "Adding..." : "Add to Cart"}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeFromWishlist.mutate(item.productId)}
                    className="text-[11px] font-medium text-theme-text-muted hover:text-red-700 text-center py-1 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
