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
      <div className="p-8 text-center">
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
    <div className="w-full">
      {/* Subtotal Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#F2EFE9] bg-[#FAF8F5]">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 font-mono">
            Active Cart Items
          </h4>
          <p className="text-xs text-neutral-500">
            {cart?.totalItems || 0} total quantity across {items.length} unique variant{items.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 font-medium">Cart Subtotal:</span>
          <span className="text-base font-bold text-[#801B2B] font-mono">
            ₹{(cart?.subtotal || 0).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Cart Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[580px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#F2EFE9]">
              <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
                Item Details
              </th>
              <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
                Measurement
              </th>
              <th className="py-4 px-6 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
                Unit Price
              </th>
              <th className="py-4 px-6 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
                Quantity
              </th>
              <th className="py-4 px-6 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
                Item Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2EFE9]">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                {/* Product & Variant */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-lg border border-[#EDE8E1] bg-[#FAF8F5] overflow-hidden flex items-center justify-center shrink-0">
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
                    </div>
                  </div>
                </td>

                {/* Measurement */}
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-[#F8F6F2] text-neutral-700">
                    <span>{item.measurement.value} {item.measurement.unit}</span>
                  </span>
                </td>

                {/* Unit Price */}
                <td className="py-4 px-6 text-right whitespace-nowrap font-medium text-neutral-700 font-mono">
                  ₹{item.currentPrice.toLocaleString("en-IN")}
                </td>

                {/* Quantity */}
                <td className="py-4 px-6 text-center whitespace-nowrap">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-[#F8F6F2] text-xs font-bold text-neutral-800">
                    {item.quantity}
                  </span>
                </td>

                {/* Total */}
                <td className="py-4 px-6 text-right whitespace-nowrap font-bold text-[#801B2B] font-mono">
                  ₹{item.itemTotal.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
