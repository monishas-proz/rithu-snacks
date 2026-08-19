import type { ReactNode } from "react";
import AuthBanner from "@/components/auth/AuthBanner";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid h-screen overflow-hidden lg:grid-cols-[43%_57%]">
      {/* Left Banner */}
      <div className="hidden min-h-0 lg:block">
        <AuthBanner />
      </div>

      {/* Right Side */}
      <main
        className="min-h-0 overflow-y-auto"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="flex min-h-full w-full items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
          <div className="w-full max-w-[560px]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}