"use client";

import * as React from "react";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>
        {children}
      </QueryProvider>
    </AuthProvider>
  );
}
