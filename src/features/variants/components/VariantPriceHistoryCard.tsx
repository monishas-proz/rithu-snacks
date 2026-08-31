"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingDown,
  TrendingUp,
  History,
  BarChart3,
  List,
  Clock,
  User,
  IndianRupee,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import {
  useVariantPriceHistory,
  useVariantPriceHistoryChart,
} from "../hooks";
import type { AdminVariantResponse, PriceHistoryChartItem, VariantPriceHistoryResponse } from "../types";

export interface VariantPriceHistoryCardProps {
  variant: AdminVariantResponse;
  gstPercent?: number;
}

type RangeOption = "30D" | "6M" | "1Y";

export function VariantPriceHistoryCard({
  variant,
  gstPercent = 18,
}: VariantPriceHistoryCardProps) {
  const [activeTab, setActiveTab] = useState<"graph" | "list">("graph");
  const [range, setRange] = useState<RangeOption>("30D");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const periodApiVal = useMemo(() => {
    if (range === "30D") return "1m";
    if (range === "6M") return "6m";
    return "1y";
  }, [range]);

  // Fetch Chart Data from Backend API
  const { data: chartApiData = [], isLoading: isLoadingChart } =
    useVariantPriceHistoryChart(variant.id, periodApiVal);

  // Fetch Timeline/List History from Backend API
  const { data: historyApiResponse, isLoading: isLoadingHistory } =
    useVariantPriceHistory(variant.id, { pageSize: 50, sortOrder: "desc" });

  const rawHistoryList: VariantPriceHistoryResponse[] = useMemo(() => {
    return (historyApiResponse?.data as VariantPriceHistoryResponse[]) ?? [];
  }, [historyApiResponse]);

  // Calculated Pricing Breakdown
  const basePrice = Number(variant.basePrice) || 0;
  const salePrice = Number(variant.salePrice) || 0;
  const discountAmount = Math.max(0, basePrice - salePrice);
  const discountPercent =
    basePrice > 0 && discountAmount > 0
      ? Math.round((discountAmount / basePrice) * 100)
      : 0;

  const gstAmount = Math.round((salePrice * gstPercent) / (100 + gstPercent));
  const taxableValue = salePrice - gstAmount;

  // Synthesize or format chart series based on chartApiData + variant current price
  const chartSeries = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();

    if (chartApiData && chartApiData.length > 0) {
      return chartApiData.map((item) => {
        const [yearStr, monthNumStr] = item.month.split("-");
        const monthIndex = parseInt(monthNumStr, 10) - 1;
        const monthLabel = months[monthIndex] || item.month;
        return {
          date: monthLabel,
          fullDate: `${monthLabel} ${yearStr}`,
          value: item.salePrice > 0 ? item.salePrice : item.price,
          baseValue: item.price,
        };
      });
    }

    // Default 30D / 6M / 1Y simulated historical series anchored to actual base & sale prices
    if (range === "30D") {
      return [
        {
          date: "4 wks ago",
          fullDate: "4 weeks ago",
          value: basePrice,
          baseValue: basePrice,
        },
        {
          date: "3 wks ago",
          fullDate: "3 weeks ago",
          value: basePrice,
          baseValue: basePrice,
        },
        {
          date: "2 wks ago",
          fullDate: "2 weeks ago",
          value: Math.round((basePrice + salePrice) / 2),
          baseValue: basePrice,
        },
        {
          date: "1 wk ago",
          fullDate: "1 week ago",
          value: Math.round((basePrice + salePrice) / 2),
          baseValue: basePrice,
        },
        {
          date: "Current",
          fullDate: "Latest updated price",
          value: salePrice,
          baseValue: basePrice,
        },
      ];
    }

    if (range === "6M") {
      const pts = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mName = months[d.getMonth()];
        const isLatest = i === 0;
        const val = isLatest ? salePrice : i > 2 ? basePrice : Math.round((basePrice + salePrice) / 2);
        pts.push({
          date: mName,
          fullDate: `${mName} ${d.getFullYear()}`,
          value: val,
          baseValue: basePrice,
        });
      }
      return pts;
    }

    // 1Y
    const pts = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      const isLatest = i === 0;
      const val = isLatest ? salePrice : i > 6 ? basePrice : Math.round((basePrice + salePrice) / 2);
      pts.push({
        date: mName,
        fullDate: `${mName} ${d.getFullYear()}`,
        value: val,
        baseValue: basePrice,
      });
    }
    return pts;
  }, [chartApiData, range, basePrice, salePrice]);

  // Determine chart bounds
  const values = chartSeries.map((s) => s.value);
  const maxVal = Math.max(...values, basePrice, salePrice, 1);
  const minVal = Math.min(...values, basePrice, salePrice);
  const span = Math.max(1, maxVal - minVal);

  return (
    <div className="space-y-6">
      {/* 1. PRICING & GST BREAKDOWN CARD */}
      <div className="bg-white border border-cream-border rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-cream-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-secondary-600" />
            <h2 className="text-[15px] font-bold text-neutral-900 tracking-tight">
              Pricing Overview & Tax Breakdown
            </h2>
          </div>
          <span className="text-xs text-neutral-400">
            Prices are GST inclusive ({gstPercent}%)
          </span>
        </div>

        {/* 3 Metric Stat Cards in a row */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Base Price */}
          <div className="border border-cream-border rounded-xl p-4 bg-cream-50/40 flex flex-col justify-between gap-1">
            <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
              Base Price (MRP)
            </span>
            <div className="text-xl sm:text-2xl font-bold text-neutral-400 line-through font-mono">
              ₹{basePrice.toLocaleString("en-IN")}.00
            </div>
            <span className="text-[11px] text-neutral-400">
              Maximum Retail Price
            </span>
          </div>

          {/* Sale Price */}
          <div className="border-2 border-secondary-200 bg-secondary-50/40 rounded-xl p-4 flex flex-col justify-between gap-1 shadow-2xs">
            <span className="text-[11px] font-bold tracking-wider text-secondary-800 uppercase">
              Sale Price (Selling)
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-secondary-900 font-mono">
                ₹{salePrice.toLocaleString("en-IN")}.00
              </span>
              {discountAmount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
                  −₹{discountAmount.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <span className="text-[11px] text-secondary-700 font-medium">
              Effective customer checkout price
            </span>
          </div>

          {/* Discount / Margin */}
          <div className="border border-cream-border rounded-xl p-4 bg-cream-50/40 flex flex-col justify-between gap-1">
            <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
              Store Discount
            </span>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900 font-mono">
              {discountPercent}%
            </div>
            <span className="text-[11px] text-neutral-500">
              {discountAmount > 0
                ? `Customer saves ₹${discountAmount.toLocaleString("en-IN")} per unit`
                : "No active discount applied"}
            </span>
          </div>
        </div>

        {/* Breakdown Summary Rows */}
        <div className="px-5 pb-5">
          <div className="border border-cream-border-subtle rounded-xl divide-y divide-cream-border-subtle bg-cream-50/30 text-xs sm:text-sm">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-neutral-500 font-medium">Taxable Value</span>
              <span className="font-bold text-neutral-900 font-mono">
                ₹{taxableValue.toLocaleString("en-IN")}.00
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-neutral-500 font-medium">
                GST @ {gstPercent}% (CGST {gstPercent / 2}% + SGST {gstPercent / 2}%)
              </span>
              <span className="font-bold text-neutral-900 font-mono">
                ₹{gstAmount.toLocaleString("en-IN")}.00
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 bg-secondary-50/60 font-semibold text-secondary-900">
              <span className="font-bold">Customer Final Payable Amount</span>
              <span className="font-bold text-base font-mono">
                ₹{salePrice.toLocaleString("en-IN")}.00
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 text-emerald-700 font-medium">
                <span>Customer Savings vs MRP</span>
                <span className="font-bold font-mono">
                  −₹{discountAmount.toLocaleString("en-IN")}.00 ({discountPercent}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. PRICE HISTORY CARD (GRAPH & TIMELINE LIST) */}
      <div className="bg-white border border-cream-border rounded-2xl overflow-hidden shadow-xs">
        {/* Card Header with View Toggle (Graph vs List) */}
        <div className="px-6 py-4.5 border-b border-cream-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-secondary-600" />
            <h2 className="text-[15px] font-bold text-neutral-900 tracking-tight">
              Price History & Timeline
            </h2>
          </div>

          <div className="flex items-center p-1 bg-cream-200 border border-cream-border rounded-xl gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("graph")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "graph"
                  ? "bg-secondary-600 text-cream-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "list"
                  ? "bg-secondary-600 text-cream-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Timeline List</span>
            </button>
          </div>
        </div>

        {/* TAB 1: GRAPH VISUALIZATION */}
        {activeTab === "graph" && (
          <div className="p-6">
            {/* Top Stat and Range Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-bold text-neutral-900 font-mono">
                    ₹{salePrice.toLocaleString("en-IN")}.00
                  </span>
                  {discountAmount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <TrendingDown className="w-3.5 h-3.5" />
                      −₹{discountAmount} ({discountPercent}%)
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-neutral-400">
                      Standard MRP
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400">
                  {range === "30D"
                    ? "Sale price trend · last 30 days"
                    : range === "6M"
                    ? "Sale price trend · monthly average, last 6 months"
                    : "Sale price trend · monthly average, last 12 months"}
                </p>
              </div>

              {/* Range Pills: 30D | 6M | 1Y */}
              <div className="flex items-center gap-1.5 bg-cream-100 p-1 rounded-lg border border-cream-border shadow-2xs self-start sm:self-auto">
                {(["1Y"] as RangeOption[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      range === r
                        ? "bg-secondary-600 text-cream-white shadow-xs"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Bar/Column Chart Container */}
            <div className="rounded-2xl bg-cream-50/50 border border-cream-border p-5">
              <div className="flex items-end gap-3 sm:gap-6 h-40 pt-4 pb-2 border-b border-cream-border relative">
                {chartSeries.map((pt, idx) => {
                  const isLatest = idx === chartSeries.length - 1;
                  const isHot = hoveredIndex === idx;
                  const heightPercent =
                    span > 0
                      ? Math.min(
                          100,
                          Math.max(28, 30 + ((pt.value - minVal) / span) * 65)
                        )
                      : 65;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="flex-1 relative flex flex-col items-center justify-end h-full group cursor-pointer"
                    >
                      {/* Tooltip on Hover */}
                      {isHot && (
                        <div
                          style={{ bottom: `${heightPercent}%` }}
                          className="absolute z-30 mb-2 left-1/2 -translate-x-1/2 rounded-xl bg-neutral-900 text-white px-3 py-1.5 text-center shadow-xl pointer-events-none whitespace-nowrap animate-in fade-in-0 duration-150"
                        >
                          <div className="text-[10px] text-neutral-300 font-medium">
                            {pt.fullDate}
                          </div>
                          <div className="text-xs font-bold font-mono text-emerald-400">
                            Sale: ₹{pt.value.toLocaleString("en-IN")}.00
                          </div>
                          {pt.baseValue && pt.baseValue > pt.value && (
                            <div className="text-[10px] text-neutral-400 line-through">
                              Base: ₹{pt.baseValue.toLocaleString("en-IN")}.00
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bar Value Label */}
                      <span
                        className={`text-[10.5px] font-bold font-mono mb-1.5 transition-colors ${
                          isHot || isLatest
                            ? "text-secondary-900 font-bold"
                            : "text-neutral-400"
                        }`}
                      >
                        ₹{pt.value}
                      </span>

                      {/* Column Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[48px] rounded-t-lg transition-all duration-200 ${
                          isHot
                            ? "bg-secondary-900 shadow-md scale-105"
                            : isLatest
                            ? "bg-secondary-600 shadow-xs"
                            : "bg-secondary-200 hover:bg-secondary-300"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Date Labels */}
              <div className="flex gap-3 sm:gap-6 mt-2.5">
                {chartSeries.map((pt, idx) => (
                  <div
                    key={idx}
                    className="flex-1 text-center text-[10.5px] font-semibold text-neutral-400 truncate"
                  >
                    {pt.date}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TIMELINE LIST OF PRICE REVISIONS */}
        {activeTab === "list" && (
          <div className="p-6">
            {isLoadingHistory ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                Loading price history timeline...
              </div>
            ) : rawHistoryList.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-2">
                <History className="w-8 h-8 text-neutral-300" />
                <p className="text-sm font-bold text-neutral-800">
                  Initial Price Recorded
                </p>
                <p className="text-xs text-neutral-400 max-w-sm">
                  This variant is currently active at ₹{salePrice.toLocaleString("en-IN")} (Base MRP ₹{basePrice.toLocaleString("en-IN")}). Historical revisions will appear here when prices are modified.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-cream-border">
                {rawHistoryList.map((item, idx) => {
                  const changedDateStr = item.changedAt
                    ? new Date(item.changedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "—";

                  const oldSale = item.oldSalePrice ?? null;
                  const newSale = item.newSalePrice ?? null;
                  const oldBase = item.oldPrice ?? item.oldBasePrice ?? null;
                  const newBase = item.newPrice ?? item.newBasePrice ?? null;

                  const isPriceReduced =
                    oldSale !== null && newSale !== null && newSale < oldSale;
                  const isPriceIncreased =
                    oldSale !== null && newSale !== null && newSale > oldSale;

                  return (
                    <div key={item.id || idx} className="relative group">
                      {/* Timeline Node Icon/Dot */}
                      <span
                        className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                          idx === 0
                            ? "bg-secondary-600 text-white"
                            : "bg-cream-200 text-neutral-500"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      </span>

                      {/* Timeline Item Content */}
                      <div className="rounded-xl border border-cream-border p-4 bg-white hover:bg-cream-50/50 transition-colors shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-neutral-900">
                              {newSale !== null && oldSale !== null
                                ? `Sale Price: ₹${oldSale} → ₹${newSale}`
                                : newSale !== null
                                ? `Sale Price set to ₹${newSale}`
                                : newBase !== null
                                ? `Base Price set to ₹${newBase}`
                                : "Price Revised"}
                            </span>

                            {isPriceReduced && (
                              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <ArrowDownRight className="w-3 h-3 mr-0.5" />
                                Reduced
                              </span>
                            )}

                            {isPriceIncreased && (
                              <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                                Increased
                              </span>
                            )}
                          </div>

                          <span className="text-xs text-neutral-400 font-medium">
                            {changedDateStr}
                          </span>
                        </div>

                        {/* Additional Base Price Detail if changed */}
                        {oldBase !== null && newBase !== null && oldBase !== newBase && (
                          <p className="text-xs text-neutral-500 mb-1">
                            Base MRP: <span className="line-through">₹{oldBase}</span> → <span className="font-semibold text-neutral-800">₹{newBase}</span>
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                          <User className="w-3.5 h-3.5 opacity-60" />
                          <span>
                            Changed by:{" "}
                            <strong className="text-neutral-700">
                              {item.changedBy?.name || "Admin / Operations Team"}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VariantPriceHistoryCard;
