"use client";

import * as React from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return context;
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration ?? 5000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

const toastVariantStyles: Record<ToastVariant, { container: string; icon: string; iconColor: string }> = {
  success: {
    container: "bg-white border-green-200",
    icon: "text-green-500",
    iconColor: "text-green-500",
  },
  error: {
    container: "bg-white border-red-200",
    icon: "text-red-500",
    iconColor: "text-red-500",
  },
  warning: {
    container: "bg-white border-yellow-200",
    icon: "text-yellow-500",
    iconColor: "text-yellow-500",
  },
  info: {
    container: "bg-white border-blue-200",
    icon: "text-blue-500",
    iconColor: "text-blue-500",
  },
};

const toastIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5" />,
  error: <XCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
};

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const styles = toastVariantStyles[toast.variant];
        return (
          <div
            key={toast.id}
            role="alert"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg",
              "animate-in slide-in-from-bottom-5 fade-in duration-300",
              styles.container
            )}
          >
            <div className={cn("mt-0.5 shrink-0", styles.iconColor)}>
              {toastIcons[toast.variant]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
              {toast.description && (
                <p className="mt-1 text-sm text-gray-600">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export { ToastProvider, useToast };
export type { Toast, ToastVariant };
