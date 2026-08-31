"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Mail,
  MapPin,
  MoreVertical,
} from "lucide-react";
import type {
  AdminCustomerListItemDto,
  AdminCustomerDetailDto,
} from "../../types/admin-customer.types";

interface CustomerTopBarProps {
  customer: AdminCustomerListItemDto | AdminCustomerDetailDto;
}

export function CustomerTopBar({ customer }: CustomerTopBarProps) {
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const moreRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    }

    if (isMoreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMoreOpen]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Breadcrumb: Customers > Customer Name */}
      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
        <Link
          href="/admin/dashboard/customers"
          className="text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          Customers
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
        <span className="font-bold text-neutral-900 truncate max-w-[220px] sm:max-w-md">
          {customer.name || "Customer Profile"}
        </span>
      </div>

      {/* Action Buttons: Email & More (⋮) */}
      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        {/* Email Button */}
        {customer.email ? (
          <a
            href={`mailto:${customer.email}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-secondary-600 text-secondary-600 bg-white hover:bg-secondary-50 text-xs font-semibold transition-colors shadow-2xs"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Email</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-neutral-300 text-neutral-400 bg-neutral-50 text-xs font-semibold cursor-not-allowed opacity-60"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Email</span>
          </button>
        )}

        {/* More Button with Disabled Block User Dropdown */}
        <div className="relative inline-block text-left" ref={moreRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMoreOpen((prev) => !prev);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-cream-border bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 transition-colors shadow-2xs cursor-pointer"
            aria-expanded={isMoreOpen}
            aria-haspopup="true"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {isMoreOpen && (
            <div
              className="absolute right-0 mt-1.5 w-40 rounded-xl border border-cream-border bg-white p-1.5 shadow-lg z-50"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                disabled
                className="w-full flex items-center px-3 py-2 text-xs font-medium text-neutral-400 bg-transparent rounded-lg cursor-not-allowed select-none opacity-60"
                aria-disabled="true"
              >
                Block User
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CustomerProfileHeaderProps {
  customer: AdminCustomerListItemDto | AdminCustomerDetailDto;
  totalSpent?: number;
  totalOrders?: number;
  location?: string;
}

export function CustomerProfileHeader({
  customer,
  totalSpent = 0,
  totalOrders = 0,
  location,
}: CustomerProfileHeaderProps) {
  const initial = customer.name?.charAt(0)?.toUpperCase() || "C";

  const memberSince = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  const formattedSpent = totalSpent > 0
    ? `₹${totalSpent.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "₹0.00";

  return (
    <div className="rounded-2xl border border-cream-border bg-white p-6 sm:p-7 shadow-xs h-full flex flex-col justify-center">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 w-full my-auto">
        {/* Left Subsection: Avatar & Personal Details */}
        <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
          <div className="relative h-20 w-20 sm:h-22 sm:w-22 rounded-full overflow-hidden border border-cream-border bg-cream-100 flex items-center justify-center shrink-0 shadow-2xs">
            {customer.profileImage ? (
              <Image
                src={customer.profileImage}
                alt={customer.name || "Customer"}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold text-secondary-600">
                {initial}
              </span>
            )}
          </div>

          <div className="space-y-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 leading-tight truncate">
              {customer.name || "Customer"}
            </h2>

            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-600 pt-0.5">
              <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">{location || "Seattle, WA"}</span>
            </div>

            {memberSince && (
              <p className="text-xs sm:text-sm text-neutral-500 pt-0.5">
                Customer since {memberSince}
              </p>
            )}
          </div>
        </div>

        {/* Subtle Vertical Divider */}
        <div className="hidden sm:block w-px self-stretch bg-cream-border mx-4 sm:mx-6 my-1" />

        {/* Right Subsection: Spent & Orders Stats */}
        <div className="flex sm:flex-col justify-between sm:justify-center gap-4 sm:gap-4 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-cream-border shrink-0 sm:min-w-[130px]">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 font-mono">
              Total Spent
            </p>
            <p className="text-xl sm:text-2xl font-bold text-secondary-600 font-mono leading-tight mt-0.5">
              {formattedSpent}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 font-mono">
              Total Orders
            </p>
            <p className="text-xl sm:text-2xl font-bold text-neutral-900 font-mono leading-tight mt-0.5">
              {totalOrders}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
