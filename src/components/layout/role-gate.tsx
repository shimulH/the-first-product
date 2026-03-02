import type { ReactNode } from "react";
import type { AppRole } from "@/lib/auth/types";
import { Badge } from "@/components/ui/badge";

interface RoleGateProps {
  role: AppRole;
  allow: AppRole[];
  children: ReactNode;
  fallbackMessage?: string;
}

export function RoleGate({ role, allow, children, fallbackMessage }: RoleGateProps) {
  if (allow.includes(role)) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <Badge variant="warning">Restricted</Badge>
      <p className="mt-2 text-sm text-amber-800">
        {fallbackMessage ?? "You do not have permission to view this section."}
      </p>
    </div>
  );
}
