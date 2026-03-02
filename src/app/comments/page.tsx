"use client";

import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const commentThreads = [
  { id: "com_1", post: "Eid Offer Campaign", customer: "Mahi", comment: "Price please", assigned: "Rafi", status: "open" },
  { id: "com_2", post: "New Arrival", customer: "Sakib", comment: "Is this available now?", assigned: "Unassigned", status: "open" },
  { id: "com_3", post: "Live Sale", customer: "Shamim", comment: "Inbox done", assigned: "Nipa", status: "in_progress" },
];

export default function CommentsPage() {
  return (
    <DashboardFrame>
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Comment Inbox</h2>
          <p className="text-sm text-slate-500">Track and reply to Facebook Page comments from one queue.</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Comment Threads</CardTitle>
              <CardDescription>Bulk-assign and resolve campaign comments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {commentThreads.map((thread) => (
                <div key={thread.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {thread.customer} on {thread.post}
                    </p>
                    <Badge variant={thread.status === "open" ? "warning" : "neutral"}>{thread.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{thread.comment}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Assigned: {thread.assigned}</span>
                    <Button size="sm" variant="outline">
                      Open Thread
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reply Composer</CardTitle>
              <CardDescription>Respond without page admin access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder="Write your comment reply..." />
              <div className="flex justify-end">
                <Button>Send Reply</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardFrame>
  );
}
