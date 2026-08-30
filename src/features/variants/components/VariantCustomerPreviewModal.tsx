"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Smartphone,
  Monitor,
  ShoppingBag,
  Heart,
  Sparkles,
  Layers,
  CheckCircle2,
  Package,
  ArrowRight,
  Eye,
  Info,
} from "lucide-react";
import { FormModal } from "@/components/common/FormModal";
import { Button } from "@/components/ui/button";
import { SNACKSLOGOS, ICONS } from "@/constants/storefront";
import type { AdminVariantResponse } from "../types";

export interface VariantCustomerPreviewModalProps {
  variant: AdminVariantResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

function resolveFallbackImage(name: string): string {
  const lower = (name || "").toLowerCase();
  if (lower.includes("murukku") && lower.includes("kai")) return SNACKSLOGOS.kai_murukku;
  if (lower.includes("murukku") && lower.includes("thenkuzhal")) return SNACKSLOGOS.thenkuzhal_murukku;
  if (lower.includes("murukku") || lower.includes("butter")) return SNACKSLOGOS.special_butter_murukku;
  if (lower.includes("chip")) return SNACKSLOGOS.special_spicy_chips;
  if (lower.includes("mixture") || lower.includes("namkeen")) return SNACKSLOGOS.mixture;
  if (lower.includes("laddu")) return SNACKSLOGOS.laddu;
  if (lower.includes("jalebi")) return SNACKSLOGOS.jalebi;
  if (lower.includes("palkova")) return SNACKSLOGOS.palkova;
  return SNACKSLOGOS.special_butter_murukku;
}

export function VariantCustomerPreviewModal({
  variant,
  isOpen,
  onClose,
}: VariantCustomerPreviewModalProps) {
  const [activeView, setActiveView] = useState<"catalog" | "cart">("catalog");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [simulatedQuantity, setSimulatedQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!variant) return null;

  const discountPercent =
    variant.basePrice > variant.salePrice && variant.basePrice > 0
      ? Math.round(((variant.basePrice - variant.salePrice) / variant.basePrice) * 100)
      : 0;

  const measurementStr =
    variant.measurement && typeof variant.measurement === "object"
      ? `${variant.measurement.value} ${variant.measurement.unit}`
      : variant.variantName || "100g";

  const displayImage = variant.primaryImage || resolveFallbackImage(variant.productName || variant.variantName);

  return (
    <FormModal
      open={isOpen}
      onClose={onClose}
      title="Storefront Customer View Preview"
      description={`Preview how users see and interact with "${variant.variantName}" on the storefront`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl bg-cream-100 p-3 border border-cream-border">
          {/* View Mode Selector */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-cream-border shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveView("catalog")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeView === "catalog"
                  ? "bg-[var(--color-secondary-600)] text-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Catalog Card View</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("cart")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeView === "cart"
                  ? "bg-[var(--color-secondary-600)] text-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Cart Item View</span>
            </button>
          </div>

          {/* Device Simulator Toggle */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-cream-border shadow-2xs">
            <button
              type="button"
              onClick={() => setDeviceMode("desktop")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                deviceMode === "desktop"
                  ? "bg-cream-200 text-neutral-900 font-bold"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
              title="Desktop Viewport"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode("mobile")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                deviceMode === "mobile"
                  ? "bg-cream-200 text-neutral-900 font-bold"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
              title="Mobile Viewport"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        {/* Live Simulation Container */}
        <div className="flex justify-center rounded-2xl bg-neutral-50/80 p-4 sm:p-8 border border-neutral-200 min-h-[380px] items-center">
          {activeView === "catalog" && (
            <div
              className={`transition-all duration-300 ${
                deviceMode === "mobile"
                  ? "w-full max-w-[280px]"
                  : "w-full max-w-[340px]"
              }`}
            >
              {/* Actual Storefront Product Card Rendering */}
              <div className="group bg-white rounded-2xl border border-gray-200 p-3 sm:p-4 transition-all duration-300 flex flex-col justify-between hover:border-[var(--brown-700)] hover:shadow-xl shadow-xs">
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden rounded-xl bg-cream-50 border border-cream-border-subtle">
                  <Image
                    src={displayImage}
                    alt={variant.productName || variant.variantName}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Discount Ribbon */}
                  {discountPercent > 0 && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-xs">
                      {discountPercent}% OFF
                    </div>
                  )}

                  {/* Wishlist Button Simulation */}
                  <button
                    type="button"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center hover:bg-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors ${
                        isWishlisted
                          ? "fill-red-500 text-red-500"
                          : "text-neutral-600"
                      }`}
                    />
                  </button>
                </div>

                {/* Name + Weight */}
                <div className="flex mt-3.5 gap-2 justify-between items-start">
                  <h3 className="flex-1 pr-2 uppercase text-xs sm:text-[13px] font-bold leading-snug text-[var(--brown-900)]">
                    {variant.productName || variant.variantName}
                  </h3>

                  <div className="flex flex-col items-end shrink-0">
                    {/* Measurement Pill */}
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[var(--brown-700)] text-white rounded-xs">
                      {measurementStr}
                    </span>

                    {/* Pricing */}
                    <div className="flex gap-1.5 mt-2 items-center">
                      <p className="font-bold text-xs sm:text-sm text-[var(--brown-900)]">
                        ₹{Number(variant.salePrice).toLocaleString("en-IN")}.00
                      </p>

                      {variant.basePrice > variant.salePrice && (
                        <p className="text-gray-400 line-through text-[10px] sm:text-xs">
                          ₹{Number(variant.basePrice).toLocaleString("en-IN")}.00
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Simulated Storefront Add To Cart CTA */}
                <div className="w-full flex justify-end mt-4">
                  <button
                    type="button"
                    className="w-full sm:w-[75%] py-2 px-3 rounded-md bg-[#d28b18] hover:bg-[#b87612] text-white text-xs font-bold uppercase tracking-wider text-center shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    Add To Cart
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeView === "cart" && (
            <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-[var(--color-secondary-600)]" />
                <span>Simulated Cart Item</span>
              </h4>

              <div className="flex gap-4 items-center">
                {/* Image */}
                <div className="relative h-18 w-18 rounded-xl bg-cream-100 border border-cream-border overflow-hidden shrink-0">
                  <Image
                    src={displayImage}
                    alt={variant.variantName}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold text-neutral-900 truncate">
                    {variant.productName || "Product"}
                  </h5>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">
                    Variant: <span className="text-neutral-800 font-semibold">{variant.variantName}</span>
                  </p>
                  <p className="text-xs text-neutral-400">
                    Weight: <span className="font-semibold text-neutral-700">{measurementStr}</span>
                  </p>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setSimulatedQuantity(Math.max(1, simulatedQuantity - 1))}
                      className="h-6 w-6 flex items-center justify-center rounded bg-gray-100 text-neutral-700 hover:bg-gray-200 font-bold text-xs cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold px-1">{simulatedQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setSimulatedQuantity(simulatedQuantity + 1)}
                      className="h-6 w-6 flex items-center justify-center rounded bg-gray-100 text-neutral-700 hover:bg-gray-200 font-bold text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-neutral-900">
                      ₹{(Number(variant.salePrice) * simulatedQuantity).toLocaleString("en-IN")}.00
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Technical Variant Metadata Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-cream-50 border border-cream-border text-xs">
          <div>
            <span className="text-neutral-400 font-medium block">SKU Code</span>
            <span className="font-mono font-bold text-neutral-800">{variant.sku}</span>
          </div>
          <div>
            <span className="text-neutral-400 font-medium block">Active Status</span>
            <span className={`font-bold ${variant.isActive ? "text-emerald-700" : "text-neutral-500"}`}>
              {variant.isActive ? "Active (In Catalog)" : "Inactive (Hidden)"}
            </span>
          </div>
          <div>
            <span className="text-neutral-400 font-medium block">Base Price / MRP</span>
            <span className="font-semibold text-neutral-800">₹{variant.basePrice}</span>
          </div>
          <div>
            <span className="text-neutral-400 font-medium block">Effective Sale Price</span>
            <span className="font-bold text-emerald-700">₹{variant.salePrice}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-5 text-xs font-semibold"
          >
            Close Preview
          </Button>
        </div>
      </div>
    </FormModal>
  );
}

export default VariantCustomerPreviewModal;
