"use client";

import { format, subDays } from "date-fns";
import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const dateRangeLabel = `${format(subDays(new Date(), 6), "MMM d")} - ${format(new Date(), "MMM d, yyyy")}`;

export default function ReportsPage() {
  return (
    <DashboardFrame>
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Reports and Performance</h2>
          <p className="text-sm text-slate-500">Date range: {dateRangeLabel}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="First Response Time" value="8m 22s" hint="Team median" />
          <MetricCard title="Assignment Completion" value="87%" hint="Daily average" />
          <MetricCard title="Orders from Inbox" value="43" hint="Messenger + comments" />
          <MetricCard title="Returning Buyer Ratio" value="41%" hint="Customer buying ratio" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Member Performance Snapshot</CardTitle>
            <CardDescription>Individual and team-level report placeholder for Phase 1.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-200 p-3 text-sm text-slate-600">
              Member-level charts and exported report tables will be connected to aggregated metrics.
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardFrame>
  );
}

function MetricCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-slate-500">{hint}</p>
      </CardContent>
    </Card>
  );
}
