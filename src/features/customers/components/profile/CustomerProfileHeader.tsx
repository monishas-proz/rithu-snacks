"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MessageSquare,
  User,
  Calendar,
} from "lucide-react";
import type { AdminCustomerListItemDto } from "../../types/admin-customer.types";

interface CustomerProfileHeaderProps {
  customer: AdminCustomerListItemDto;
}

export function CustomerProfileHeader({ customer }: CustomerProfileHeaderProps) {
  const initial = customer.name?.charAt(0)?.toUpperCase() || "C";

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "banned":
        return <Badge variant="destructive">Banned</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const memberSince = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-4 flex-shrink-0">
      {/* Breadcrumb Navigation */}
      <AdminBreadcrumb
        items={[
          { label: "Sales" },
          { label: "Customers", href: "/admin/dashboard/customers" },
          { label: customer.name || "Customer Profile" },
        ]}
      />

      {/* Top Bar: Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/dashboard/customers"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 shadow-xs transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span>Back to Customers</span>
        </Link>
      </div>

      {/* Primary Customer Banner Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="relative h-16 w-16 sm:h-18 sm:w-18 overflow-hidden rounded-2xl border-2 border-neutral-200 bg-primary-100 flex items-center justify-center flex-shrink-0 shadow-xs">
            {customer.profileImage ? (
              <Image
                src={customer.profileImage}
                alt={customer.name}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-xl sm:text-2xl font-extrabold text-primary-700">
                {initial}
              </span>
            )}
          </div>

          <div className="text-center sm:text-left space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">
                {customer.name || "Customer"}
              </h1>
              {getStatusBadge(customer.status)}
              {customer.isBlocked && (
                <Badge variant="destructive">Blocked</Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-neutral-500 font-mono">
              <span className="bg-neutral-100 px-2 py-0.5 rounded-md font-medium text-neutral-700">
                {customer.customerId || `UUID: ${customer.id.slice(0, 8)}...`}
              </span>
              {memberSince && (
                <>
                  <span>•</span>
                  <span className="font-sans text-neutral-500">
                    Member since {memberSince}
                  </span>
                </>
              )}
            </div>

            {/* Verification & Channel Pills */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
              {customer.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success-700 bg-success-50 px-2.5 py-0.5 rounded-full border border-success-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Email Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                  <XCircle className="h-3 w-3" />
                  Email Unverified
                </span>
              )}

              {customer.phoneVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success-700 bg-success-50 px-2.5 py-0.5 rounded-full border border-success-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Phone Verified
                </span>
              ) : null}

              {customer.isWhatsapp && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <MessageSquare className="h-3 w-3" />
                  WhatsApp Opted
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
