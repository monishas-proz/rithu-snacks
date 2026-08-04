"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { FormModal } from "@/components/common/FormModal";
import { useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from "@/features/banners/hooks";
import type { BannerListItem } from "@/features/banners/types";

const bannerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  image: z.string().min(1, "Image is required"),
  link: z.string().optional(),
  position: z.string().optional(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

type BannerFormData = z.infer<typeof bannerSchema>;

export default function AdminBannersPage() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerListItem | null>(null);

  const { data, isLoading, error, refetch } = useBanners();
  const deleteMutation = useDeleteBanner();
  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();

  const banners = data?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: { title: "", subtitle: "", image: "", link: "", position: "", sortOrder: 0, isActive: true },
  });

  const openCreateModal = () => {
    setEditingBanner(null);
    reset({ title: "", subtitle: "", image: "", link: "", position: "", sortOrder: 0, isActive: true });
    setModalOpen(true);
  };

  const openEditModal = (banner: BannerListItem) => {
    setEditingBanner(banner);
    reset({
      title: banner.title, subtitle: banner.subtitle || "", image: banner.image,
      link: banner.link || "", position: banner.position || "",
      sortOrder: banner.sortOrder, isActive: banner.isActive,
      startsAt: banner.startsAt ? new Date(banner.startsAt).toISOString().split("T")[0] : "",
      expiresAt: banner.expiresAt ? new Date(banner.expiresAt).toISOString().split("T")[0] : "",
    });
    setModalOpen(true);
  };

  const onSubmit = (formData: BannerFormData) => {
    const data = {
      ...formData,
      startsAt: formData.startsAt ? new Date(formData.startsAt) : undefined,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
    };
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data }, { onSuccess: () => { setModalOpen(false); reset(); } });
    } else {
      createMutation.mutate(data, { onSuccess: () => { setModalOpen(false); reset(); } });
    }
  };

  const columns: ColumnDef<BannerListItem, unknown>[] = [
    { accessorKey: "title", header: "Title", cell: ({ row }) => (<div><p className="font-medium">{row.original.title}</p>{row.original.subtitle && <p className="text-xs text-muted-foreground">{row.original.subtitle}</p>}</div>) },
    { accessorKey: "image", header: "Image", cell: ({ row }) => (<div className="h-10 w-16 overflow-hidden rounded bg-muted"><img src={row.original.image} alt={row.original.title} className="h-full w-full object-cover" /></div>) },
    { accessorKey: "position", header: "Position", cell: ({ row }) => row.original.position || "-" },
    { accessorKey: "sortOrder", header: "Sort" },
    { accessorKey: "isActive", header: "Status", cell: ({ row }) => (<Badge variant={row.original.isActive ? "success" : "secondary"}>{row.original.isActive ? "Active" : "Inactive"}</Badge>) },
    { id: "actions", header: "Actions", cell: ({ row }) => (<div className="flex items-center gap-1"><Button variant="ghost" size="icon" onClick={() => openEditModal(row.original)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>) },
  ];

  if (isLoading) return <LoadingState text="Loading banners..." />;
  if (error) return <ErrorState message="Failed to load banners" onRetry={() => refetch()} />;

  return (
    <div>
      <AdminBreadcrumb items={[{ label: "Banners" }]} />
      <AdminPageHeader title="Banners" description="Manage homepage banners" actions={<Button onClick={openCreateModal}><Plus className="mr-2 h-4 w-4" />Add Banner</Button>} />
      <AdminContent>
        <DataTable columns={columns} data={banners} searchKey="title" searchPlaceholder="Search banners..." />
      </AdminContent>
      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingBanner ? "Edit Banner" : "Create Banner"} footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button></>}>
        <form className="space-y-4">
          <div><label className="text-sm font-medium">Title *</label><input {...register("title")} className="mt-1 flex h-10 w-full rounded-md border px-3 text-sm" />{errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}</div>
          <div><label className="text-sm font-medium">Subtitle</label><input {...register("subtitle")} className="mt-1 flex h-10 w-full rounded-md border px-3 text-sm" /></div>
          <div><label className="text-sm font-medium">Image URL *</label><input {...register("image")} className="mt-1 flex h-10 w-full rounded-md border px-3 text-sm" placeholder="https://..." />{errors.image && <p className="text-xs text-destructive mt-1">{errors.image.message}</p>}</div>
          <div><label className="text-sm font-medium">Link</label><input {...register("link")} className="mt-1 flex h-10 w-full rounded-md border px-3 text-sm" placeholder="/products" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium">Position</label><input {...register("position")} className="mt-1 flex h-10 w-full rounded-md border px-3 text-sm" placeholder="hero, footer" /></div>
            <div><label className="text-sm font-medium">Sort Order</label><input type="number" {...register("sortOrder", { valueAsNumber: true })} className="mt-1 flex h-10 w-full rounded-md border px-3 text-sm" /></div>
          </div>
          <div className="flex items-center gap-2"><input type="checkbox" {...register("isActive")} className="rounded" /><label className="text-sm">Active</label></div>
        </form>
      </FormModal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }} title="Delete Banner" description="Are you sure?" confirmText="Delete" variant="destructive" isLoading={deleteMutation.isPending} />
    </div>
  );
}
