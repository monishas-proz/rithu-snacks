import type { ReactNode } from "react";
import AuthBanner from "@/components/auth/AuthBanner";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[43%_57%]">
      {/* Left Banner */}
      <AuthBanner />

      {/* Right Side */}
      <main
        className="flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="w-full max-w-[560px]">
          {children}
        </div>
      </main>
    </div>
  );
}