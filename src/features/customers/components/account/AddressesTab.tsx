"use client";

import React, { useState } from "react";
import {
  useCustomerAddresses,
  useCreateCustomerAddress,
  useDeleteCustomerAddress,
} from "../../hooks/use-customer-address";
import {
  createCustomerAddressSchema,
  type CreateCustomerAddressInput,
} from "../../validations/customer-address.schema";
import type { CustomerAddressResponse } from "../../types/customer-address.types";

export function AddressesTab() {
  const { data: addresses = [], isLoading, error, refetch } = useCustomerAddresses();
  const deleteMutation = useDeleteCustomerAddress();
  const createMutation = useCreateCustomerAddress();

  const [isAdding, setIsAdding] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    label: "home",
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "Tamil Nadu",
    pincode: "",
    country: "India",
    addressType: "shipping" as "shipping" | "billing",
    isDefault: false,
  });

  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setServerError(null);

    const payload: CreateCustomerAddressInput = {
      label: formData.label.trim() || undefined,
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      addressLine1: formData.addressLine1.trim(),
      addressLine2: formData.addressLine2.trim() || undefined,
      landmark: formData.landmark.trim() || undefined,
      city: formData.city.trim(),
      state: formData.state.trim() || "Tamil Nadu",
      pincode: formData.pincode.trim(),
      country: formData.country || "India",
      addressType: formData.addressType || "shipping",
      isDefault: formData.isDefault,
    };

    // Client-side exact Zod validation matching backend schema
    const validationResult = createCustomerAddressSchema.safeParse(payload);
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const fieldName = String(issue.path[0] || "general");
        if (!errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    try {
      await createMutation.mutateAsync(payload);

      setIsAdding(false);
      setFormData({
        label: "home",
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        landmark: "",
        city: "",
        state: "Tamil Nadu",
        pincode: "",
        country: "India",
        addressType: "shipping",
        isDefault: false,
      });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to save address. Please verify your details.";
      setServerError(errorMsg);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((n) => (
          <div
            key={n}
            className="bg-theme-surface border border-theme-border rounded-xl p-5 animate-pulse space-y-3"
          >
            <div className="h-5 bg-theme-border rounded w-1/3" />
            <div className="h-10 bg-theme-border-subtle rounded w-full" />
            <div className="h-4 bg-theme-border-subtle rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-theme-surface border border-theme-border rounded-2xl p-8 text-center space-y-4">
        <p className="text-sm text-theme-text-muted">Failed to load saved addresses.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="bg-theme-primary text-theme-primary-fg px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-theme-text-secondary">
          Saved Addresses
        </h2>
        <button
          type="button"
          onClick={() => {
            setIsAdding(!isAdding);
            setFieldErrors({});
            setServerError(null);
          }}
          className="bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-fg text-xs font-semibold uppercase tracking-wider py-2.5 px-5 rounded-lg transition-colors cursor-pointer min-h-[40px]"
        >
          {isAdding ? "Cancel" : "Add New Address"}
        </button>
      </div>

      {/* Add Address Form Modal / Inline */}
      {isAdding && (
        <form
          onSubmit={handleCreateAddress}
          noValidate
          className="bg-theme-surface border border-theme-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-text-secondary">
              New Delivery Address
            </h3>
          </div>

          {/* Server Error Banner */}
          {serverError && (
            <div className="bg-theme-status-can-bg border border-red-200 text-theme-status-can-fg p-3.5 rounded-lg text-xs font-medium">
              <span className="font-semibold">Validation Error:</span> {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1">
              <input
                type="text"
                placeholder="Full Name (e.g. Ashok Kumar) *"
                value={formData.fullName}
                onChange={(e) => handleFieldChange("fullName", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm ${
                  fieldErrors.fullName ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.fullName && (
                <span className="text-[11px] text-red-600">{fieldErrors.fullName}</span>
              )}
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1">
              <input
                type="tel"
                placeholder="Phone (10-digit, e.g. 9876543210) *"
                value={formData.phone}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm ${
                  fieldErrors.phone ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.phone && (
                <span className="text-[11px] text-red-600">{fieldErrors.phone}</span>
              )}
            </div>

            {/* Label (Home / Work / Other) */}
            <div className="flex flex-col gap-1">
              <select
                value={formData.label}
                onChange={(e) => handleFieldChange("label", e.target.value)}
                className="border border-theme-border-input rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm"
              >
                <option value="home">Home</option>
                <option value="work">Work / Office</option>
                <option value="parents">Parents / Family</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* PIN Code */}
            <div className="flex flex-col gap-1">
              <input
                type="text"
                placeholder="PIN Code (6 digits, e.g. 637001) *"
                value={formData.pincode}
                onChange={(e) => handleFieldChange("pincode", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm ${
                  fieldErrors.pincode ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.pincode && (
                <span className="text-[11px] text-red-600">{fieldErrors.pincode}</span>
              )}
            </div>

            {/* Address Line 1 */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <input
                type="text"
                placeholder="Address Line 1 (Door no., Building, Street) *"
                value={formData.addressLine1}
                onChange={(e) => handleFieldChange("addressLine1", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm ${
                  fieldErrors.addressLine1 ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.addressLine1 && (
                <span className="text-[11px] text-red-600">{fieldErrors.addressLine1}</span>
              )}
            </div>

            {/* Address Line 2 */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <input
                type="text"
                placeholder="Address Line 2 (Area, Colony, Sector)"
                value={formData.addressLine2}
                onChange={(e) => handleFieldChange("addressLine2", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm ${
                  fieldErrors.addressLine2 ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.addressLine2 && (
                <span className="text-[11px] text-red-600">{fieldErrors.addressLine2}</span>
              )}
            </div>

            {/* Landmark */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <input
                type="text"
                placeholder="Landmark (Optional, e.g. Near Bus Stand)"
                value={formData.landmark}
                onChange={(e) => handleFieldChange("landmark", e.target.value)}
                className="border border-theme-border-input rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm"
              />
            </div>

            {/* City */}
            <div className="flex flex-col gap-1">
              <input
                type="text"
                placeholder="City *"
                value={formData.city}
                onChange={(e) => handleFieldChange("city", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm ${
                  fieldErrors.city ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.city && (
                <span className="text-[11px] text-red-600">{fieldErrors.city}</span>
              )}
            </div>

            {/* State */}
            <div className="flex flex-col gap-1">
              <input
                type="text"
                placeholder="State *"
                value={formData.state}
                onChange={(e) => handleFieldChange("state", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm ${
                  fieldErrors.state ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.state && (
                <span className="text-[11px] text-red-600">{fieldErrors.state}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-theme-secondary hover:bg-theme-secondary-hover text-theme-secondary-fg text-xs font-semibold uppercase tracking-wider py-2.5 px-6 rounded-lg transition-colors cursor-pointer min-h-[40px] disabled:opacity-50"
            >
              {createMutation.isPending ? "Saving..." : "Save Address"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setFieldErrors({});
                setServerError(null);
              }}
              className="border border-theme-border text-theme-text-subtle text-xs font-semibold uppercase tracking-wider py-2.5 px-5 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Address Cards Grid */}
      {addresses.length === 0 && !isAdding ? (
        <div className="bg-theme-surface border border-theme-border rounded-2xl p-10 text-center shadow-2xs">
          <p className="text-sm text-theme-text-muted">No saved delivery addresses found.</p>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="bg-theme-secondary hover:bg-theme-secondary-hover text-theme-secondary-fg text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-lg transition-colors cursor-pointer mt-4 min-h-[44px]"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((a: CustomerAddressResponse) => {
            const labelUpper = (a.label || "Delivery").toUpperCase();

            return (
              <div
                key={a.id}
                className="bg-theme-surface border border-theme-border rounded-xl p-5 flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-theme-primary">
                      {labelUpper}
                    </span>
                    {a.isDefault && (
                      <span className="bg-theme-status-out-bg text-theme-status-out-fg text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm font-semibold text-theme-text-primary">
                    {a.fullName}
                  </div>
                  <div className="text-xs text-theme-text-subtle font-light leading-relaxed">
                    {a.addressLine1}
                    {a.addressLine2 ? `, ${a.addressLine2}` : ""}
                    {a.landmark ? ` (Near ${a.landmark})` : ""}, {a.city} — {a.pincode}, {a.state}
                  </div>
                  <div className="text-xs text-theme-text-muted font-medium">
                    {a.phone}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-theme-border-subtle text-xs">
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(a.id)}
                    disabled={deleteMutation.isPending}
                    className="font-medium text-[#A9564F] hover:text-red-700 ml-auto cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
