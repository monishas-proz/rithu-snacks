"use client";

import { useMemo } from "react";
import type { StaffDeliveryListItem } from "../types/delivery.types";

interface DeliveryStatsCardsProps {
  items?: StaffDeliveryListItem[];
  totalCount?: number;
  isLoading?: boolean;
}

export function DeliveryStatsCards({
  items = [],
  totalCount,
  isLoading = false,
}: DeliveryStatsCardsProps) {
  const stats = useMemo(() => {
    const total = totalCount ?? items.length;
    const pendingAcceptance = items.filter(
      (item) =>
        item.assignmentStatus === "pending" ||
        item.status === "pending"
    ).length;
    const outForDelivery = items.filter(
      (item) => item.status === "out_for_delivery"
    ).length;
    const delivered = items.filter(
      (item) => item.status === "delivered"
    ).length;

    return {
      total,
      pendingAcceptance,
      outForDelivery,
      delivered,
    };
  }, [items, totalCount]);

  const cards = [
    {
      label: "TOTAL ASSIGNED",
      value: isLoading ? "—" : String(stats.total),
      note: "Total assigned deliveries",
      noteColor: "text-neutral-500",
      accentBorder: "border-l-secondary-600",
    },
    {
      label: "PENDING ACCEPTANCE",
      value: isLoading ? "—" : String(stats.pendingAcceptance),
      note: stats.pendingAcceptance > 0 ? "Requires staff acceptance" : "All accepted",
      noteColor: stats.pendingAcceptance > 0 ? "text-amber-700 font-semibold" : "text-neutral-500",
      accentBorder: "border-l-amber-600",
    },
    {
      label: "OUT FOR DELIVERY",
      value: isLoading ? "—" : String(stats.outForDelivery),
      note: stats.outForDelivery > 0 ? "Currently on the road" : "None in transit",
      noteColor: stats.outForDelivery > 0 ? "text-indigo-700 font-semibold" : "text-neutral-500",
      accentBorder: "border-l-indigo-600",
    },
    {
      label: "COMPLETED DELIVERIES",
      value: isLoading ? "—" : String(stats.delivered),
      note: "Successfully delivered",
      noteColor: "text-emerald-700 font-semibold",
      accentBorder: "border-l-emerald-600",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`flex flex-col gap-1 rounded-xl border border-cream-border bg-white p-3 shadow-xs transition-shadow hover:shadow-sm border-l-[3px] ${card.accentBorder}`}
        >
          <div className="text-[10.5px] font-bold tracking-wider text-neutral-400 uppercase">
            {card.label}
          </div>
          <div className="text-xl font-bold tracking-tight text-neutral-900">
            {card.value}
          </div>
          <div className={`text-[11px] font-medium ${card.noteColor}`}>
            {card.note}
          </div>
        </div>
      ))}
    </section>
  );
}
