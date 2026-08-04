"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  side?: "left" | "right";
  className?: string;
}

function Drawer({
  open,
  onClose,
  children,
  title,
  side = "right",
  className,
}: DrawerProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div
        className={cn(
          "fixed inset-y-0 flex flex-col bg-background shadow-lg transition-transform",
          side === "right" ? "right-0 w-full max-w-sm" : "left-0 w-full max-w-sm"
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 hover:opacity-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export { Drawer };
