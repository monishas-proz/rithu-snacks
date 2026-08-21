"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";

export default function SettingsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Manage your application settings."
        breadcrumbs={
          <AdminBreadcrumb items={[{ label: "Settings" }]} />
        }
      />

      <AdminContent className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Store Name</label>
                <Input disabled defaultValue="RithuSnacks" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Store Email</label>
                <Input disabled defaultValue="info@rithusnacks.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Store Phone</label>
                <Input disabled defaultValue="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <Input disabled defaultValue="INR" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Timezone</label>
                <Input disabled defaultValue="Asia/Kolkata" />
              </div>
            </div>
            <Button disabled>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Meta Title</label>
              <Input disabled defaultValue="RithuSnacks - Premium Snacks Store" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Meta Description</label>
              <textarea
                disabled
                defaultValue="RithuSnacks offers the finest selection of premium snacks, delivered fresh to your doorstep."
                className="flex min-h-[80px] w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all focus:outline-none focus:border-secondary-600 focus:ring-2 focus:ring-secondary-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-600/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-50"
              />
            </div>
            <Button disabled>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Email Notifications", defaultChecked: true },
              { label: "SMS Notifications", defaultChecked: false },
              { label: "Order Updates", defaultChecked: true },
              { label: "Marketing Emails", defaultChecked: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  disabled
                  defaultChecked={item.defaultChecked}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label className="text-sm font-medium">{item.label}</label>
              </div>
            ))}
            <Button disabled>Save Changes</Button>
          </CardContent>
        </Card>
      </AdminContent>
    </div>
  );
}
