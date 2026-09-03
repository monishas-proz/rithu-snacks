"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AccountShell } from "@/features/customers/components/account";
import { LoadingState } from "@/components/ui/loading-state";

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const currentTab = searchParams.get("tab") || "dashboard";

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center p-8">
        <LoadingState text="Loading your account..." />
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    router.push("/login?callbackUrl=/profile");
    return null;
  }

  const handleTabChange = (newTab: string) => {
    router.push(`/profile?tab=${newTab}`, { scroll: false });
  };

  return (
    <AccountShell
      activeTab={currentTab}
      onTabChange={handleTabChange}
    />
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-theme-bg flex items-center justify-center p-8">
          <LoadingState text="Loading your account..." />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
