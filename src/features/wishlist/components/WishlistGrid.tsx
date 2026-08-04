"use client";

import { WishlistCard } from "./WishlistCard";
import type { WishlistItemWithProduct } from "../types";

interface WishlistGridProps {
  items: WishlistItemWithProduct[];
  onRemove: (productId: number) => void;
  onMoveToCart?: (productId: number) => void;
  removingId?: number | null;
  movingId?: number | null;
}

function WishlistGrid({
  items,
  onRemove,
  onMoveToCart,
  removingId,
  movingId,
}: WishlistGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <WishlistCard
          key={item.id}
          item={item}
          onRemove={onRemove}
          onMoveToCart={onMoveToCart}
          isRemoving={removingId === item.productId}
          isMovingToCart={movingId === item.productId}
        />
      ))}
    </div>
  );
}

export { WishlistGrid };
