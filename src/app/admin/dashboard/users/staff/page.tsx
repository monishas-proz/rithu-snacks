"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Pencil, ChevronRight } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { useStaffList, StaffFormModal } from "@/features/staff";
import type { StaffResponse } from "@/features/staff/types";

export default function AdminStaffPage() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [selectedStaff, setSelectedStaff] = React.useState<StaffResponse | null>(null);

  // Reset page when search changes
  React.useEffect(() => {
    setPage(1);
  }, [search]);

  const queryParams = React.useMemo(() => {
    return {
      page,
      limit: pageSize,
      search: search.trim() || undefined,
      sortBy: "name" as const,
      sortOrder: "asc" as const,
    };
  }, [page, pageSize, search]);

  const { data, isLoading, error, refetch } = useStaffList(queryParams);

  const staffList = data?.data ?? [];
  const meta = data?.meta;

  const totalItems = meta?.total !== undefined ? meta.total : staffList.length;
  const totalPages =
    meta?.totalPages !== undefined && meta.totalPages > 0
      ? meta.totalPages
      : Math.max(1, Math.ceil(totalItems / pageSize));

  const handleOpenCreateModal = () => {
    setSelectedStaff(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffResponse) => {
    setSelectedStaff(staff);
    setIsFormModalOpen(true);
  };

  const columns = React.useMemo<ColumnDef<StaffResponse>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Staff Member",
        cell: ({ row }) => {
          const staff = row.original;
          const initials = staff.name
            ? staff.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
            : "ST";

          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-secondary-700 font-semibold text-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-neutral-900 truncate">
                    {staff.name}
                  </p>
                  <span className="inline-flex items-center rounded-md bg-secondary-50 px-2 py-0.5 text-[11px] font-medium text-secondary-700 border border-secondary-200/60">
                    {staff.role || "STAFF"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 truncate sm:hidden">
                  {staff.email}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email Address",
        cell: ({ row }) => (
          <span className="text-sm text-neutral-700 font-medium">
            {row.original.email || "—"}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone Number",
        cell: ({ row }) => (
          <span className="text-sm text-neutral-600">
            {row.original.phone || "—"}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.original.isActive;
          return isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600 border border-neutral-200">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              Inactive
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created Date",
        cell: ({ row }) => {
          const dateVal = row.original.createdAt;
          if (!dateVal) return <span className="text-neutral-400">—</span>;
          const formatted = new Date(dateVal).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          return <span className="text-sm text-neutral-600">{formatted}</span>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const staff = row.original;
          return (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenEditModal(staff)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-secondary-700 bg-secondary-50 hover:bg-secondary-100 transition-colors border border-secondary-200/60 cursor-pointer"
                title="Edit staff member"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Header with Breadcrumb without Home Icon */}
      <AdminPageHeader
        title="Staff Management"
        description="View, search, create, and manage staff members with system access."
        breadcrumbs={
          <nav aria-label="Breadcrumb" className="flex items-center text-sm">
            <ol className="flex items-center gap-1">
              <li>
                <Link
                  href="/admin/dashboard/users"
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Users
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4 text-gray-300" />
                <span className="font-medium text-gray-900">Staff</span>
              </li>
            </ol>
          </nav>
        }
      />

      <AdminContent className="flex-1 min-h-0 overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden bg-[var(--color-background)] py-1 rounded-2xl">
          {/* Search + Create Staff in the same line */}
          <div className="flex-shrink-0 mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <SearchInput
              placeholder="Search staff by name, email, or phone..."
              defaultValue={search}
              onSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              className="w-full max-w-md"
            />

            <Button
              type="button"
              onClick={handleOpenCreateModal}
              className="h-11 rounded-xl bg-[var(--color-secondary-600)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-secondary-700)] shadow-sm cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Staff
            </Button>
          </div>

          {/* Table Container occupying up to bottom with only table records scrolling */}
          <div className="mt-4 flex-1 min-h-0 overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center rounded-2xl border border-neutral-200 bg-white p-12">
                <LoadingState text="Loading staff members..." />
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center rounded-2xl border border-neutral-200 bg-white p-12">
                <ErrorState
                  title="Failed to load staff list"
                  message={error.message || "An error occurred while fetching staff members."}
                  onRetry={() => refetch()}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <DataTable
                  columns={columns}
                  data={staffList}
                  page={page}
                  pageSize={pageSize}
                  pageSizeOptions={[10, 20, 30, 50]}
                  totalItems={totalItems}
                  totalPages={totalPages}
                  onPageChange={(newPage) => setPage(newPage)}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPage(1);
                  }}
                  className="bg-white"
                  emptyMessage={
                    search.trim()
                      ? "No staff members matched your search criteria."
                      : "No staff members found. Click '+ Create Staff' to add your first staff member."
                  }
                />
              </div>
            )}
          </div>
        </div>
      </AdminContent>

      {/* Create / Edit Staff Modal */}
      <StaffFormModal
        open={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
      />
    </div>
  );
}
