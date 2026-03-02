"use client";

import { useForm } from "react-hook-form";
import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface TeamMemberFormValues {
  fullName: string;
  email: string;
}

const members = [
  { id: "1", fullName: "Rafi Hasan", email: "rafi@example.com", role: "support_member" },
  { id: "2", fullName: "Nipa Akter", email: "nipa@example.com", role: "support_member" },
];

export default function TeamMembersPage() {
  const form = useForm<TeamMemberFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
    },
  });

  const onSubmit = form.handleSubmit(() => {
    form.reset();
  });

  return (
    <DashboardFrame>
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Team Members</h2>
          <p className="text-sm text-slate-500">Add, edit, and manage support team members.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-[400px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Add Support Member</CardTitle>
              <CardDescription>Form uses React Hook Form for validation-ready handling.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={onSubmit}>
                <Input placeholder="Full name" {...form.register("fullName", { required: true })} />
                <Input type="email" placeholder="Email address" {...form.register("email", { required: true })} />
                <Button type="submit">Save Member</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Members</CardTitle>
              <CardDescription>Current support roster</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{member.fullName}</p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardFrame>
  );
}
