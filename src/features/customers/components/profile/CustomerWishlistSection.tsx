"use client";

import * as React from "react";
import Image from "next/image";
import { Heart, Package, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MockWishlistItem } from "../../mocks/customer-profile.mock";

interface CustomerWishlistSectionProps {
  wishlist: MockWishlistItem[];
}

export function CustomerWishlistSection({
  wishlist,
}: CustomerWishlistSectionProps) {
  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
            <Heart className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800">
              Wishlisted Products
            </h2>
            <p className="text-xs text-neutral-500">
              {wishlist.length} item{wishlist.length === 1 ? "" : "s"} saved for later
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {wishlist.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:border-neutral-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Image & Stock Badge */}
              <div className="relative h-40 w-full rounded-xl overflow-hidden border border-neutral-100 bg-neutral-100 flex items-center justify-center">
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
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success-700 bg-white/95 px-2 py-0.5 rounded-full shadow-xs border border-success-200">
                      <CheckCircle2 className="h-3 w-3" />
                      In Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-white/95 px-2 py-0.5 rounded-full shadow-xs border border-rose-200">
                      <XCircle className="h-3 w-3" />
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{item.categoryName || "Snacks"}</span>
                  <span className="font-mono text-[10px]">{item.sku}</span>
                </div>

                <h3 className="text-sm font-bold text-neutral-900 line-clamp-1 leading-snug">
                  {item.productName}
                </h3>

                {item.brandName && (
                  <p className="text-xs text-neutral-500">Brand: {item.brandName}</p>
                )}
              </div>

              {/* Price Row */}
              <div className="flex items-baseline gap-2 pt-1 border-t border-neutral-100">
                <span className="text-base font-bold text-neutral-900 font-mono">
                  ₹{item.price.toLocaleString("en-IN")}
                </span>
                {item.comparePrice && item.comparePrice > item.price && (
                  <span className="text-xs text-neutral-400 line-through font-mono">
                    ₹{item.comparePrice.toLocaleString("en-IN")}
                  </span>
                )}
                {item.discountPercent > 0 && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {item.discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-neutral-100 text-[11px] text-neutral-400">
              Added: {new Date(item.addedAt).toLocaleDateString("en-IN", {
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
