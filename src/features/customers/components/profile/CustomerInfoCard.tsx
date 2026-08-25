"use client";

import * as React from "react";
import {
  Mail,
  Phone,
  MessageSquare,
  User,
  Calendar,
  Tag,
  Clock,
  Fingerprint,
  Shield,
  Hash,
} from "lucide-react";
import type {
  AdminCustomerListItemDto,
  AdminCustomerDetailDto,
} from "../../types/admin-customer.types";

interface CustomerInfoCardProps {
  customer: AdminCustomerListItemDto | AdminCustomerDetailDto;
}

export function CustomerInfoCard({ customer }: CustomerInfoCardProps) {
  const formatDate = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return "Never";
    return new Date(dateValue).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Contact & Personal Information Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <div className="p-1.5 rounded-lg bg-primary-50 text-primary-700">
            <User className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800">
            Personal & Contact Details
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {/* Email */}
          <div className="flex items-start gap-3 rounded-xl bg-neutral-50/70 p-3 border border-neutral-100">
            <Mail className="h-4 w-4 text-neutral-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-neutral-500 font-medium">Email Address</p>
              <p className="font-semibold text-neutral-900 truncate">
                {customer.email || "—"}
              </p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-3 rounded-xl bg-neutral-50/70 p-3 border border-neutral-100">
            <Phone className="h-4 w-4 text-neutral-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-neutral-500 font-medium">Phone Number</p>
              <p className="font-semibold text-neutral-900">
                {customer.phone || "—"}
              </p>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="flex items-start gap-3 rounded-xl bg-neutral-50/70 p-3 border border-neutral-100">
            <MessageSquare className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-neutral-500 font-medium">WhatsApp Number</p>
              <p className="font-semibold text-neutral-900">
                {customer.whatsappNo || (customer.isWhatsapp ? customer.phone : "—")}
              </p>
            </div>
          </div>

          {/* Gender */}
          <div className="flex items-start gap-3 rounded-xl bg-neutral-50/70 p-3 border border-neutral-100">
            <User className="h-4 w-4 text-neutral-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-neutral-500 font-medium">Gender</p>
              <p className="font-semibold text-neutral-900 capitalize">
                {customer.gender || "Not specified"}
              </p>
            </div>
          </div>

          {/* Date of Birth */}
          <div className="flex items-start gap-3 rounded-xl bg-neutral-50/70 p-3 border border-neutral-100">
            <Calendar className="h-4 w-4 text-neutral-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-neutral-500 font-medium">Date of Birth</p>
              <p className="font-semibold text-neutral-900">
                {customer.dob
                  ? new Date(customer.dob).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>

          {/* Referral Code */}
          <div className="flex items-start gap-3 rounded-xl bg-neutral-50/70 p-3 border border-neutral-100">
            <Tag className="h-4 w-4 text-neutral-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-neutral-500 font-medium">Referral Code</p>
              <p className="font-mono font-semibold text-neutral-900">
                {customer.referralCode || "None"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Identifiers & Activity Timestamps Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700">
            <Clock className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800">
            Identifiers & Activity Timestamps
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {/* Customer ID */}
          {/* <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Hash className="h-3.5 w-3.5" />
              <span>Customer ID</span>
            </div>
            <p className="font-mono text-xs font-semibold text-neutral-800 bg-neutral-100 px-2 py-1 rounded-md inline-block">
              {customer.customerId || "—"}
            </p>
          </div> */}

          {/* Profile UUID */}
          {/* <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Fingerprint className="h-3.5 w-3.5" />
              <span>Profile UUID</span>
            </div>
            <p className="font-mono text-xs text-neutral-700 truncate" title={customer.id}>
              {customer.id}
            </p>
          </div> */}

          {/* User Auth UUID */}
          {/* <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Shield className="h-3.5 w-3.5" />
              <span>User Auth ID</span>
            </div>
            <p className="font-mono text-xs text-neutral-700 truncate" title={customer.userId}>
              {customer.userId}
            </p>
          </div> */}

          {/* Created Date */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Registered Date</span>
            </div>
            <p className="text-xs font-medium text-neutral-800">
              {formatDate(customer.createdAt)}
            </p>
          </div>

          {/* Last Login */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Last Login</span>
            </div>
            <p className="text-xs font-medium text-neutral-800">
              {formatDate(customer.lastLoginAt)}
            </p>
          </div>

          {/* Profile Updated */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Profile Updated</span>
            </div>
            <p className="text-xs font-medium text-neutral-800">
              {formatDate(customer.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
