"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Calendar, ExternalLink } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  AdminPageHeader,
  AdminContent,
} from "@/components/admin/AdminPageHeader";
import { FormModal } from "@/components/common/FormModal";
import { SearchInput } from "@/components/ui/search-input";
import {
  useBanners,
  useBannerPositions,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
} from "@/features/banners/hooks";
import { BannerForm } from "@/features/banners/components";
import type { BannerDto } from "@/features/banners/types";

export default function AdminBannersPage() {
  const [search, setSearch] = useState("");
  const [selectedPositionFilter, setSelectedPositionFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<BannerDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    uuid: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, selectedPositionFilter]);

  // Main banners query
  const { data, isLoading, error, refetch } = useBanners({
    page,
    limit: pageSize,
    search: search || undefined,
    bannerPositionId: selectedPositionFilter || undefined,
  });

  // Reference queries for banner positions dropdown
  const { data: positionsData } = useBannerPositions({ limit: 100 });

  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();
  const deleteMutation = useDeleteBanner();

  const banners = data?.data ?? [];
  const positions = positionsData?.data ?? [];

  const positionOptions = useMemo(() => {
    return positions.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.slug})`,
    }));
  }, [positions]);

  const positionFilterOptions = useMemo(() => {
    return [
      { value: "", label: "All Positions" },
      ...positionOptions,
    ];
  }, [positionOptions]);

  const formatDateDisplay = (dateVal: unknown): string => {
    if (!dateVal) return "";
    try {
      const d = new Date(dateVal as string | Date);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const columns: ColumnDef<BannerDto>[] = [
    {
      accessorKey: "imageUrl",
      header: "Banner (3:1)",
      cell: ({ row }) => {
        const imageUrl = row.original.imageUrl;
        return (
          <div className="relative aspect-[3/1] w-28 flex-shrink-0 overflow-hidden rounded-lg border border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] flex items-center justify-center">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={row.original.title || "Banner"}
                fill
                className="object-cover"
                sizes="112px"
              />
            ) : (
              <span className="text-[10px] text-[var(--color-neutral-400)]">
                No image
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Title & Link",
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <p className="font-semibold text-[var(--color-neutral-900)]">
            {row.original.title || "Untitled Banner"}
          </p>
          {row.original.linkUrl ? (
            <a
              href={row.original.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--color-primary-600)] hover:underline mt-0.5"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="truncate max-w-[200px]">
                {row.original.linkUrl}
              </span>
            </a>
          ) : (
            <p className="text-xs text-[var(--color-neutral-400)] mt-0.5">
              No link attached
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "bannerPosition",
      header: "Position",
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-md bg-[var(--color-primary-50)] px-2 py-1 text-xs font-medium text-[var(--color-primary-700)] ring-1 ring-inset ring-[var(--color-primary-700)]/10">
          {row.original.bannerPosition?.name || row.original.bannerPosition?.slug || "—"}
        </span>
      ),
    },
    {
      accessorKey: "sortOrder",
      header: "Order",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-[var(--color-neutral-700)]">
          {row.original.sortOrder}
        </span>
      ),
    },
    {
      accessorKey: "schedule",
      header: "Schedule",
      cell: ({ row }) => {
        const starts = formatDateDisplay(row.original.startsAt);
        const ends = formatDateDisplay(row.original.endsAt);

        if (!starts && !ends) {
          return (
            <span className="text-xs text-[var(--color-neutral-500)]">
              Always Active
            </span>
          );
        }

        return (
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-neutral-600)]">
            <Calendar className="h-3.5 w-3.5 text-[var(--color-neutral-400)]" />
            <span>
              {starts || "Now"} — {ends || "Forever"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.isActive ? "success" : "secondary"}
          className="text-xs"
        >
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const banner = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedBanner(banner);
                setIsEditOpen(true);
              }}
              className="h-8 w-8 text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-100)]"
              title="Edit Banner"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setDeleteTarget({
                  uuid: banner.id,
                  title: banner.title || "Untitled Banner",
                })
              }
              className="h-8 w-8 text-[var(--color-error-500)] hover:bg-[var(--color-error-50)] hover:text-[var(--color-error-700)]"
              title="Delete Banner"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoading && !data) {
    return <AdminTableSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load banners"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <AdminPageHeader
        title="Banners"
        description="Manage promotional, seasonal, and marketing hero banners with 3:1 aspect ratio."
      />

      <AdminContent className="flex-1 min-h-0 overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden bg-[var(--color-background)] py-1 rounded-2xl">
          {/* Top Bar: Search, Position Filter, Add Button */}
          <div className="flex-shrink-0 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <SearchInput
                placeholder="Search banners by title..."
                defaultValue={search}
                onSearch={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                className="w-full max-w-md"
              />

              <div className="w-full sm:w-64">
                <Select
                  value={selectedPositionFilter}
                  onChange={(e) => {
                    setSelectedPositionFilter(e.target.value);
                    setPage(1);
                  }}
                  options={positionFilterOptions}
                  placeholder="All Positions"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <Button
              onClick={() => setIsCreateOpen(true)}
              className="h-11 rounded-xl bg-[var(--color-secondary-600)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-secondary-700)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Banner
            </Button>
          </div>

          {/* Data Table */}
          <div className="mt-6 flex-1 min-h-0 overflow-hidden flex flex-col">
            <DataTable
              columns={columns}
              data={banners}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 30, 50]}
              page={data?.meta?.page ?? page}
              totalPages={data?.meta?.totalPages ?? Math.max(1, Math.ceil((data?.meta?.total ?? banners.length) / pageSize))}
              totalItems={data?.meta?.total ?? banners.length}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              className="bg-white"
            />
          </div>
        </div>
      </AdminContent>

      {/* CREATE MODAL */}
      <FormModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Banner"
        description="Upload a 3:1 banner image and configure its position and schedule."
        size="lg"
      >
        <BannerForm
          bannerPositions={positionOptions}
          isLoading={createMutation.isPending}
          submitLabel="Add Banner"
          onSubmit={async (formData) => {
            await createMutation.mutateAsync(formData);
            setIsCreateOpen(false);
          }}
        />
      </FormModal>

      {/* EDIT MODAL */}
      <FormModal
        open={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedBanner(null);
        }}
        title="Edit Banner"
        description="Update banner image, link, position, or schedule."
        size="lg"
      >
        {selectedBanner && (
          <BannerForm
            initialData={selectedBanner}
            bannerPositions={positionOptions}
            isLoading={updateMutation.isPending}
            submitLabel="Update Banner"
            onSubmit={async (formData) => {
              await updateMutation.mutateAsync({
                uuid: selectedBanner.id,
                data: formData,
              });
              setIsEditOpen(false);
              setSelectedBanner(null);
            }}
          />
        )}
      </FormModal>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.uuid);
            setDeleteTarget(null);
          }
        }}
        title="Delete Banner"
        description={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete Banner"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
