"use client";

import { useMemo } from "react";
import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { RoleGate } from "@/components/layout/role-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getMockSession } from "@/lib/auth/mock-session";

const members = ["Rafi", "Nipa", "Sadia", "Arman"];

export default function AssignmentsPage() {
  const session = useMemo(() => getMockSession(), []);

  return (
    <DashboardFrame>
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Task Assignment</h2>
          <p className="text-sm text-slate-500">Distribute Messenger and comment workload across support members.</p>
        </div>

        <RoleGate
          role={session.role}
          allow={["merchant_admin"]}
          fallbackMessage="Only merchant admins can manage assignment distribution."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Distribution</CardTitle>
                <CardDescription>Example: 10 comments per support member.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Items per member (e.g. 10)" />
                <Button>Distribute Now</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Members</CardTitle>
                <CardDescription>Active support team allocation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {members.map((member) => (
                  <div key={member} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
                    <span>{member}</span>
                    <span className="text-xs text-slate-500">Queue: 0</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </RoleGate>
      </div>
    </DashboardFrame>
  );
}
