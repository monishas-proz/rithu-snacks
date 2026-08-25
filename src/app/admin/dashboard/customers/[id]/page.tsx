"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  CustomerProfileHeader,
  CustomerInfoCard,
  CustomerAddressesSection,
  CustomerOrdersSection,
  CustomerCartSection,
  CustomerWishlistSection,
} from "@/features/customers/components";
import {
  useAdminCustomerDetail,
  useAdminCustomerAddresses,
  useAdminCustomerOrders,
} from "@/features/customers/hooks";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { User, MapPin, Package, ShoppingCart, Heart, Layers } from "lucide-react";

type ProfileTab = "all" | "overview" | "addresses" | "orders" | "cart" | "wishlist";

export default function AdminCustomerProfilePage() {
  const params = useParams<{ id: string }>();
  const customerId = params?.id ? decodeURIComponent(params.id) : "";

  // 1. Customer Profile Query
  const {
    data: customer,
    isLoading: isLoadingProfile,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useAdminCustomerDetail(customerId);

  // Use the canonical customer UUID for related entities
  const targetUuid = customer?.id || customerId;

  // 2. Customer Addresses Query
  const {
    data: addresses,
    isLoading: isLoadingAddresses,
    error: addressesError,
    refetch: refetchAddresses,
  } = useAdminCustomerAddresses(targetUuid);

  // 3. Customer Orders Query (with pagination)
  const [orderPage, setOrderPage] = React.useState(1);
  const {
    data: ordersResponse,
    isLoading: isLoadingOrders,
    error: ordersError,
    refetch: refetchOrders,
  } = useAdminCustomerOrders(targetUuid, {
    page: orderPage,
    pageSize: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [activeTab, setActiveTab] = React.useState<ProfileTab>("all");

  const addressCount = addresses?.length ?? 0;
  const orderCount = ordersResponse?.meta?.total ?? ordersResponse?.data?.length ?? 0;

  const tabs: Array<{
    id: ProfileTab;
    label: string;
    count?: number;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "all", label: "All Sections", icon: Layers },
    { id: "overview", label: "Profile Info", icon: User },
    { id: "addresses", label: "Addresses", count: addressCount, icon: MapPin },
    { id: "orders", label: "Order History", count: orderCount, icon: Package },
    { id: "cart", label: "Active Cart", icon: ShoppingCart },
    { id: "wishlist", label: "Wishlist", icon: Heart },
  ];

  if (isLoadingProfile && !customer) {
    return <LoadingState text="Loading customer profile..." />;
  }

  if (isProfileError || !customer) {
    return (
      <ErrorState
        message={
          profileError instanceof Error
            ? profileError.message
            : "Customer profile not found or failed to load."
        }
        onRetry={() => refetchProfile()}
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
                  className={`inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200/80"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      isActive ? "text-white" : "text-neutral-500"
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content Sections */}
      <div className="space-y-8">
        {/* Section 1: Overview / Personal Info */}
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

        {/* Section 2: Addresses */}
        {(activeTab === "all" || activeTab === "addresses") && (
          <section id="section-addresses" className="space-y-3">
            {activeTab === "all" && (
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 pt-4 border-t border-neutral-200">
                <span>Section 2</span>
                <span>•</span>
                <span>Customer Addresses</span>
              </div>
            )}
            <CustomerAddressesSection
              addresses={addresses}
              isLoading={isLoadingAddresses}
              error={addressesError as Error | null}
              onRetry={refetchAddresses}
            />
          </section>
        )}

        {/* Section 3: Order History */}
        {(activeTab === "all" || activeTab === "orders") && (
          <section id="section-orders" className="space-y-3">
            {activeTab === "all" && (
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 pt-4 border-t border-neutral-200">
                <span>Section 3</span>
                <span>•</span>
                <span>Customer Order History</span>
              </div>
            )}
            <CustomerOrdersSection
              orders={ordersResponse?.data}
              meta={ordersResponse?.meta}
              isLoading={isLoadingOrders}
              error={ordersError as Error | null}
              onRetry={refetchOrders}
              onPageChange={(page) => setOrderPage(page)}
            />
          </section>
        )}

        {/* Section 4: Current Cart */}
        {(activeTab === "all" || activeTab === "cart") && (
          <section id="section-cart" className="space-y-3">
            {activeTab === "all" && (
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 pt-4 border-t border-neutral-200">
                <span>Section 4</span>
                <span>•</span>
                <span>Current Cart</span>
              </div>
            )}
            <CustomerCartSection />
          </section>
        )}

        {/* Section 5: Wishlist */}
        {(activeTab === "all" || activeTab === "wishlist") && (
          <section id="section-wishlist" className="space-y-3">
            {activeTab === "all" && (
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 pt-4 border-t border-neutral-200">
                <span>Section 5</span>
                <span>•</span>
                <span>Customer Wishlist</span>
              </div>
            )}
            <CustomerWishlistSection />
          </section>
        )}
      </div>
    </div>
  );
}
