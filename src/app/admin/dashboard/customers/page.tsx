"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useAdminCustomers,
  type AdminCustomerListItemDto,
} from "@/features/customers";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { StatsCard } from "@/components/admin/StatsCard";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import {
  Users,
  UserCheck,
  ShieldCheck,
  MessageSquare,
  Search,
  Eye,
  RotateCcw,
  X,
  CheckCircle2,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset pagination on filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter, genderFilter, verificationFilter]);

  // Build query parameters
  const queryParams = useMemo(() => {
    const params: {
      page: number;
      pageSize: number;
      search?: string;
      status?: "active" | "inactive" | "banned";
      gender?: "male" | "female" | "other";
      emailVerified?: boolean;
      phoneVerified?: boolean;
      sortBy: "createdAt";
      sortOrder: "desc";
    } = {
      page,
      pageSize,
      sortBy: "createdAt",
      sortOrder: "desc",
    };

    if (search.trim()) {
      params.search = search.trim();
    }

    if (statusFilter !== "all") {
      params.status = statusFilter as "active" | "inactive" | "banned";
    }

    if (genderFilter !== "all") {
      params.gender = genderFilter as "male" | "female" | "other";
    }

    if (verificationFilter === "email_verified") {
      params.emailVerified = true;
    } else if (verificationFilter === "phone_verified") {
      params.phoneVerified = true;
    }

    return params;
  }, [page, pageSize, search, statusFilter, genderFilter, verificationFilter]);

  const { data, isLoading, error, refetch } = useAdminCustomers(queryParams);

  const customers = data?.data ?? [];
  const meta = data?.meta;

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setGenderFilter("all");
    setVerificationFilter("all");
    setPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    genderFilter !== "all" ||
    verificationFilter !== "all";

  // Calculate summary stats
  const totalCustomers = meta?.total ?? customers.length;
  const activeCount = useMemo(
    () => customers.filter((c) => c.status === "active" || c.isActive).length,
    [customers]
  );
  const verifiedCount = useMemo(
    () => customers.filter((c) => c.emailVerified || c.phoneVerified).length,
    [customers]
  );
  const whatsappCount = useMemo(
    () => customers.filter((c) => c.isWhatsapp).length,
    [customers]
  );

  const statusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "success";
      case "inactive":
        return "secondary";
      case "banned":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const columns: ColumnDef<AdminCustomerListItemDto, unknown>[] = [
    {
      accessorKey: "name",
      header: "Customer",
      cell: ({ row }) => {
        const item = row.original;
        const initial = item.name?.charAt(0)?.toUpperCase() || "C";
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-neutral-200 bg-primary-100 flex items-center justify-center flex-shrink-0">
              {item.profileImage ? (
                <Image
                  src={item.profileImage}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-primary-700">
                  {initial}
                </span>
              )}
            </div>
            <div>
              <p className="font-semibold text-neutral-900 leading-snug">
                {item.name || "Unnamed Customer"}
              </p>
              <p className="text-xs text-neutral-500 font-mono">
                {item.customerId ? `ID: ${item.customerId}` : item.id ? `ID: ${item.id.slice(0, 8)}...` : "-"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Contact Details",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="space-y-0.5">
            <p className="text-sm text-neutral-800">{item.email || "-"}</p>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span>{item.phone || "-"}</span>
              {item.isWhatsapp && (
                <span className="inline-flex items-center gap-0.5 text-success-600 bg-success-50 px-1.5 py-0.5 rounded text-[10px] font-medium" title="WhatsApp Enabled">
                  <MessageSquare className="h-3 w-3" />
                  WA
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "gender",
      header: "Gender / DOB",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div>
            <p className="text-sm text-neutral-800 capitalize">
              {item.gender || "-"}
            </p>
            <p className="text-xs text-neutral-500">
              {item.dob || "-"}
            </p>
          </div>
        );
      },
    },
    {
      id: "verification",
      header: "Verification",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-wrap gap-1">
            {item.emailVerified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success-700 bg-success-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Email
              </span>
            ) : (
              <span className="inline-flex items-center text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                Email
              </span>
            )}
            {item.phoneVerified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success-700 bg-success-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Phone
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <Badge
            variant={
              statusBadgeVariant(item.status) as
                | "success"
                | "secondary"
                | "destructive"
            }
          >
            {item.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Registered",
      cell: ({ row }) => {
        const date = row.original.createdAt;
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
    {
      accessorKey: "lastLoginAt",
      header: "Last Login",
      cell: ({ row }) => {
        const date = row.original.lastLoginAt;
        if (!date) return <span className="text-xs text-neutral-400">Never</span>;
        return (
          <span className="text-xs text-neutral-600">
            {new Date(date).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/admin/dashboard/customers/${row.original.id}`}
            className="inline-flex items-center h-8 gap-1 px-2.5 rounded-lg text-xs font-semibold text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50 cursor-pointer transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Link>
        </div>
      ),
    },
  ];

  if (isLoading && !data) {
    return <LoadingState text="Loading customers..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load customers"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* <AdminBreadcrumb
        items={[
          { label: "Users", href: "/admin/dashboard/users" },
          { label: "Customers" },
        ]}
      /> */}

      <AdminPageHeader
        title="Customers"
        description="View and manage registered customers who have logged in or registered through the store"
      />

      <AdminContent className="flex-1 min-h-0 overflow-hidden">
        {/* KPI Summary Cards */}
        {/* <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Customers"
            value={totalCustomers}
            icon={Users}
            description="Registered store customers"
          />
          <StatsCard
            title="Active Customers"
            value={activeCount}
            icon={UserCheck}
            description="Active accounts in current list"
          />
          <StatsCard
            title="Verified Customers"
            value={verifiedCount}
            icon={ShieldCheck}
            description="Email or phone verified"
          />
          <StatsCard
            title="WhatsApp Enabled"
            value={whatsappCount}
            icon={MessageSquare}
            description="Opted in for WhatsApp"
          />
        </div> */}

        {/* Search & Filter Toolbar */}
        {/* <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4"> */}
          <div className="flex-shrink-0 mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <SearchInput
              placeholder="Search by name, email, phone, or customer ID..."
              defaultValue={search}
              onSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              className="w-full max-w-md"
            />

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="banned">Banned</option>
              </select>

              {/* Gender Filter */}
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>

              {/* Verification Filter */}
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="all">All Verification</option>
                <option value="email_verified">Email Verified</option>
                <option value="phone_verified">Phone Verified</option>
              </select>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-11 gap-1.5 rounded-xl border-neutral-300 px-3 text-xs text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        {/* </div> */}

        {/* Data Table */}
        <div className="mt-6 flex-1 min-h-0 overflow-hidden flex flex-col">
          <DataTable
            columns={columns}
            data={customers}
            pageSize={pageSize}
            page={meta?.page ?? page}
            totalPages={meta?.totalPages ?? 1}
            totalItems={meta?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            className="bg-white"
            emptyMessage="No customers found matching your criteria."
          />
        </div>
      </AdminContent>
    </div>
  );
}
