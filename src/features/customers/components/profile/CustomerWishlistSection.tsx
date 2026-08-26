"use client";

import * as React from "react";
import Image from "next/image";
import { Heart, Package } from "lucide-react";

export interface CustomerWishlistItemDto {
  id: string;
  productId: string;
  productName: string;
  categoryName?: string;
  brandName?: string;
  sku?: string;
  primaryImage?: string | null;
  price: number;
  comparePrice?: number | null;
  discountPercent?: number;
  inStock: boolean;
  addedAt: Date | string;
}

interface CustomerWishlistSectionProps {
  wishlist?: CustomerWishlistItemDto[];
}

export function CustomerWishlistSection({
  wishlist = [],
}: CustomerWishlistSectionProps) {
  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
          <Heart className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-neutral-900">
          Wishlist is Empty
        </h3>
        <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
          This customer has not added any items to their wishlist yet.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {wishlist.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-[#EDE8E1] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Image & Stock Badge */}
              <div className="relative h-40 w-full rounded-lg overflow-hidden border border-[#EDE8E1] bg-[#FAF8F5] flex items-center justify-center">
                {item.primaryImage ? (
                  <Image
                    src={item.primaryImage}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Package className="h-10 w-10 text-neutral-400" />
                )}

                <div className="absolute top-2.5 right-2.5">
                  {item.inStock ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAF7EE] text-[#1E833F] shadow-xs">
                      In Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FDE8E8] text-[#9B1C1C] shadow-xs">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{item.categoryName || "Snacks"}</span>
                  <span className="font-mono text-[10px] text-neutral-400">{item.sku}</span>
                </div>

                <h3 className="text-sm font-bold text-neutral-900 line-clamp-1 leading-snug">
                  {item.productName}
                </h3>

                {item.brandName && (
                  <p className="text-xs text-neutral-500">Brand: {item.brandName}</p>
                )}
              </div>

              {/* Price Row */}
              <div className="flex items-baseline gap-2 pt-1 border-t border-[#F2EFE9]">
                <span className="text-base font-bold text-[#801B2B] font-mono">
                  ₹{item.price.toLocaleString("en-IN")}
                </span>
                {item.comparePrice && item.comparePrice > item.price && (
                  <span className="text-xs text-neutral-400 line-through font-mono">
                    ₹{item.comparePrice.toLocaleString("en-IN")}
                  </span>
                )}
                {Boolean(item.discountPercent && item.discountPercent > 0) && (
                  <span className="text-[10px] font-semibold text-[#1E833F] bg-[#EAF7EE] px-1.5 py-0.5 rounded">
                    {item.discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-[#F2EFE9] text-[11px] text-neutral-400">
              Added: {new Date(item.addedAt).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
