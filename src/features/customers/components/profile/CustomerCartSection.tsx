"use client";

import * as React from "react";
import Image from "next/image";
import { ShoppingCart, Package } from "lucide-react";
import type { CartResponse } from "@/features/cart/types/cart.types";

interface CustomerCartSectionProps {
  cart?: CartResponse | null;
}

export function CustomerCartSection({ cart }: CustomerCartSectionProps) {
  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  if (isEmpty) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
          <ShoppingCart className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-neutral-900">
          Cart is Empty
        </h3>
        <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
          This customer does not have any items currently saved in their active cart.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Subtotal Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800">
              Active Cart Items
            </h2>
            <p className="text-xs text-neutral-500">
              {cart?.totalItems || 0} total quantity across {items.length} unique variant{items.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-100 self-start sm:self-auto">
          <span className="text-xs font-medium text-neutral-500">Cart Subtotal:</span>
          <span className="text-base font-bold text-neutral-900 font-mono">
            ₹{(cart?.subtotal || 0).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Cart Items Table Container */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px] text-left text-sm">
            <thead className="bg-neutral-50/80 text-xs font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-4">Item Details</th>
                <th className="py-3.5 px-4">Measurement</th>
                <th className="py-3.5 px-4 text-right">Unit Price</th>
                <th className="py-3.5 px-4 text-center">Quantity</th>
                <th className="py-3.5 px-4 text-right">Item Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                  {/* Product & Variant */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-xl border border-neutral-200 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0">
                        {item.primaryImage ? (
                          <Image
                            src={item.primaryImage}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-neutral-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 leading-snug truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Variant: <span className="font-medium text-neutral-700">{item.variantName}</span>
                        </p>
                        <p className="text-[10px] font-mono text-neutral-400">
                          UUID: {item.variantId.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Measurement */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-700">
                      <span>{item.measurement.value} {item.measurement.unit}</span>
                      <span className="text-[10px] uppercase text-neutral-400 font-semibold">
                        ({item.measurement.type})
                      </span>
                    </span>
                  </td>

                  {/* Unit Price */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-medium text-neutral-700">
                    ₹{item.currentPrice.toLocaleString("en-IN")}
                  </td>

                  {/* Quantity */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-neutral-100 text-xs font-bold text-neutral-800">
                      {item.quantity}
                    </span>
                  </td>

                  {/* Total */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-neutral-900 font-mono">
                    ₹{item.itemTotal.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
