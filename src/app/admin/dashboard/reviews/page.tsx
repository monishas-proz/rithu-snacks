"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { AdminReviewListTable } from "@/features/reviews/components/AdminReviewListTable";

export default function ReviewsPage() {
  return (
    <div className="space-y-4">
      <AdminBreadcrumb
        items={[
          { label: "Catalog", href: "/admin/dashboard/products" },
          { label: "Reviews" },
        ]}
      />

      <AdminPageHeader
        title="Product Reviews"
        description="Monitor, approve, reject, and manage customer feedback and ratings"
      />

      <AdminContent>
        <AdminReviewListTable />
      </AdminContent>
    </div>
  );
}
