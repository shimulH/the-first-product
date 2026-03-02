"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getMockSession } from "@/lib/auth/mock-session";

interface DashboardFrameProps {
  children: ReactNode;
}

export function DashboardFrame({ children }: DashboardFrameProps) {
  const pathname = usePathname();
  const session = getMockSession();

  return (
    <AppShell pathname={pathname} user={session}>
      {children}
    </AppShell>
  );
}
