"use client";

import Link from "next/link";
import { getImageUrl, formatPrice } from "@/lib/utils";
import type { OrderItemDisplay } from "../types";

interface OrderItemsListProps {
  items: OrderItemDisplay[];
  compact?: boolean;
}

export function OrderItemsList({ items, compact = false }: OrderItemsListProps) {
  return (
    <div className="divide-y divide-gray-100">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-4 py-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            {item.image ? (
              <img
                src={getImageUrl(item.image)}
                alt={item.productName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                No image
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <Link
              href={`/products/${item.productSlug}`}
              className="font-medium text-sm hover:text-primary truncate block"
            >
              {item.productName}
            </Link>
            {item.variantName && (
              <p className="text-xs text-muted-foreground">{item.variantName}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Qty: {item.quantity}
              {compact && (
                <span className="ml-2 font-medium text-foreground">
                  {formatPrice(item.price)}
                </span>
              )}
            </p>
          </div>

          {!compact && (
            <div className="text-right shrink-0">
              <p className="text-sm font-medium">{formatPrice(item.total)}</p>
              <p className="text-xs text-muted-foreground">
                {formatPrice(item.price)} x {item.quantity}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
