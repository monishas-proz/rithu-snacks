"use client";

import { Modal } from "./modal";
import { Button } from "./button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  isLoading,
}: ConfirmDialogProps) {
  const isDestructive = variant === "destructive";

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            "rounded-full p-3 mb-4",
            isDestructive
              ? "bg-red-50 text-red-600"
              : "bg-[#E8F6EC] text-[#1D7A44]"
          )}
        >
          {isDestructive ? (
            <AlertTriangle className="h-6 w-6" />
          ) : (
            <CheckCircle2 className="h-6 w-6" />
          )}
        </div>
        <h3 className="text-lg font-bold text-[#211C1A] mb-2 tracking-tight">{title}</h3>
        <p className="text-sm text-[#7C7169] mb-6 max-w-sm leading-relaxed">{description}</p>
        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1 rounded-xl border-[#EDE4D9] text-[#4A423D] hover:bg-[#F7F2EC] font-semibold transition-colors cursor-pointer"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            className={cn(
              "flex-1 rounded-xl font-semibold transition-colors cursor-pointer",
              !isDestructive && "bg-[#7A2224] hover:bg-[#5F1A1C] text-[#FFF6EC]"
            )}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export { ConfirmDialog };
