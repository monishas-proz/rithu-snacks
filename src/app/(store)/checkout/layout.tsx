"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CheckoutProvider } from "@/features/checkout/checkout-context";

const STEPS = [
  { key: "cart", label: "Cart", href: "/cart" },
  { key: "address", label: "Address", href: "/checkout/address" },
  { key: "payment", label: "Payment", href: "/checkout/payment" },
  { key: "done", label: "Done", href: "/checkout/success" },
];

function getActiveStep(pathname: string): { index: number; key: string } {
  if (pathname.startsWith("/checkout/success")) {
    return { index: 3, key: "done" };
  }
  if (pathname === "/checkout/payment") {
    return { index: 2, key: "payment" };
  }
  if (pathname === "/checkout/address") {
    return { index: 1, key: "address" };
  }
  return { index: 0, key: "cart" };
}

function CheckoutStepper() {
  const pathname = usePathname();
  const { index, key } = getActiveStep(pathname);

  return (
    <div className="mx-auto flex max-w-2xl items-center justify-between px-2">
      {STEPS.map((step, stepIndex) => {
        const isDone = stepIndex < index;
        const isActive = stepIndex === index;
        const canNavigate = stepIndex < index && step.key !== "done";

        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <Link
                href={canNavigate ? step.href : "#"}
                aria-disabled={!canNavigate}
                className={cn(
                  "flex items-center gap-2",
                  !canNavigate && "pointer-events-none"
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <Circle
                    className={cn(
                      "h-6 w-6",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground/40"
                    )}
                  />
                )}
              </Link>
              <span
                className={cn(
                  "mt-1 text-xs font-medium",
                  isActive
                    ? "text-foreground"
                    : isDone
                      ? "text-green-600"
                      : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {stepIndex < STEPS.length - 1 && (
              <div className="mx-2 mb-5 h-0.5 flex-1 rounded bg-gray-200">
                <div
                  className={cn(
                    "h-full rounded bg-green-500 transition-all",
                    stepIndex < index ? "w-full" : "w-0"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CheckoutProvider>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <CheckoutStepper />
        </div>
        {children}
      </div>
    </CheckoutProvider>
  );
}
