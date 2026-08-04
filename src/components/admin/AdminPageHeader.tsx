"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

function AdminPageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  children,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {breadcrumbs}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

interface AdminContentProps {
  children: React.ReactNode;
  className?: string;
}

function AdminContent({ children, className }: AdminContentProps) {
  return (
    <div className={cn("mt-6", className)}>
      {children}
    </div>
  );
}

export { AdminPageHeader, AdminContent };
export type { AdminPageHeaderProps, AdminContentProps };
