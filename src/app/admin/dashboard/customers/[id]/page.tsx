"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  CustomerProfileHeader,
  CustomerInfoCard,
  CustomerAddressesSection,
  CustomerCartSection,
} from "@/features/customers/components";
import { useAdminCustomerDetail } from "@/features/customers/hooks";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { User, MapPin, ShoppingCart, Layers } from "lucide-react";

type ProfileTab = "all" | "overview" | "addresses" | "cart";

export default function AdminCustomerProfilePage() {
  const params = useParams<{ id: string }>();
  const customerId = params?.id ? decodeURIComponent(params.id) : "";

  // Real backend API call using TanStack Query
  const {
    data: customer,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminCustomerDetail(customerId);

  const [activeTab, setActiveTab] = React.useState<ProfileTab>("all");

  const tabs: Array<{
    id: ProfileTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
      { id: "all", label: "All Sections", icon: Layers },
      { id: "overview", label: "Profile Info", icon: User },
      { id: "addresses", label: "Addresses", icon: MapPin },
      { id: "cart", label: "Active Cart", icon: ShoppingCart },
    ];

  if (isLoading) {
    return <LoadingState text="Loading customer profile..." />;
  }

  if (isError || !customer) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Customer profile not found or failed to load."
        }
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Header & Overview Banner */}
      <CustomerProfileHeader customer={customer} />

      {/* Navigation Tabs Bar Container */}
      <div className="w-full rounded-2xl border border-neutral-200 bg-white p-2 shadow-xs">
        <div className="w-full overflow-x-auto pb-0.5">
          <div className="flex items-center gap-1.5 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${isActive
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200/80"
                    }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-neutral-500"
                      }`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content Sections */}
      <div className="space-y-8">
        {/* Overview / Personal Info */}
        {(activeTab === "all" || activeTab === "overview") && (
          <section id="section-overview" className="space-y-3">
            {activeTab === "all" && (
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                <span>Section 1</span>
                <span>•</span>
                <span>Customer Overview</span>
              </div>
            )}
            <CustomerInfoCard customer={customer} />
          </section>
        )}

        {/* Addresses Section */}
        {(activeTab === "all" || activeTab === "addresses") && (
          <section id="section-addresses" className="space-y-3">
            {activeTab === "all" && (
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 pt-4 border-t border-neutral-200">
                <span>Section 2</span>
                <span>•</span>
                <span>Customer Addresses</span>
              </div>
            )}
            <CustomerAddressesSection />
          </section>
        )}

        {/* Cart Section */}
        {(activeTab === "all" || activeTab === "cart") && (
          <section id="section-cart" className="space-y-3">
            {activeTab === "all" && (
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 pt-4 border-t border-neutral-200">
                <span>Section 3</span>
                <span>•</span>
                <span>Current Cart</span>
              </div>
            )}
            <CustomerCartSection />
          </section>
        )}
      </div>
    </div>
  );
}
