"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface StatusTab {
  label: string;
  href: string;
}

const TABS: StatusTab[] = [
  { label: "All", href: "/admin/dashboard/orders" },
  { label: "Pending", href: "/admin/dashboard/orders/pending" },
  { label: "Confirmed", href: "/admin/dashboard/orders/confirmed" },
  { label: "Processing", href: "/admin/dashboard/orders/processing" },
  { label: "Packed", href: "/admin/dashboard/orders/packed" },
  { label: "Shipped", href: "/admin/dashboard/orders/shipped" },
  { label: "Out for Delivery", href: "/admin/dashboard/orders/out-for-delivery" },
  { label: "Delivered", href: "/admin/dashboard/orders/delivered" },
  { label: "Cancelled", href: "/admin/dashboard/orders/cancelled" },
  { label: "Returned", href: "/admin/dashboard/orders/returned" },
];

export function OrderStatusTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/admin/dashboard/orders"
            ? pathname === "/admin/dashboard/orders"
            : pathname === tab.href || pathname.startsWith(tab.href + "/");

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors border",
              isActive
                ? "bg-[#7A2224] text-[#FFF6EC] border-[#7A2224] shadow-xs"
                : "bg-white text-[#7C7169] border-[#EBE1D6] hover:bg-[#F7F2EC] hover:text-[#4A1516] hover:border-[#D8CBBC]"
            )}
          >
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
