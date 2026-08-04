"use client";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OffersPage() {
  return (
    <div>
      <AdminBreadcrumb items={[{ label: "Marketing" }, { label: "Offers" }]} />
      <AdminPageHeader title="Offers" description="Manage promotional offers" />
      <AdminContent>
        <Card>
          <CardHeader><CardTitle>Coming Soon</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">This feature is under development.</p></CardContent>
        </Card>
      </AdminContent>
    </div>
  );
}
