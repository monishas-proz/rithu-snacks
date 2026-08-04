"use client";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReviewsPage() {
  return (
    <div>
      <AdminBreadcrumb items={[{ label: "Reviews" }]} />
      <AdminPageHeader title="Reviews" description="Manage product reviews" />
      <AdminContent>
        <Card>
          <CardHeader><CardTitle>Coming Soon</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">This feature is under development.</p></CardContent>
        </Card>
      </AdminContent>
    </div>
  );
}
