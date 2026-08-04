"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const sizeStyles: Record<string, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[90vw]",
};

function FormModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: FormModalProps) {
  const overlayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        aria-describedby={description ? "form-modal-desc" : undefined}
        className={cn(
          "relative z-50 w-full rounded-xl bg-white shadow-xl",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          sizeStyles[size],
          className
        )}
      >
        <div className="flex items-start justify-between border-b border-gray-200 p-6">
          <div>
            <h2 id="form-modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            {description && (
              <p id="form-modal-desc" className="mt-1 text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={cn(
              "rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            )}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export { FormModal };
export type { FormModalProps };
