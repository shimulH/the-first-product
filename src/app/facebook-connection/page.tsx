"use client";

import { useForm } from "react-hook-form";
import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ConnectionFormValues {
  appId: string;
  callbackUrl: string;
}

export default function FacebookConnectionPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const webhookCallbackUrl = `${appUrl}/api/webhooks/facebook`;

  const form = useForm<ConnectionFormValues>({
    defaultValues: {
      appId: "",
      callbackUrl: webhookCallbackUrl,
    },
  });

  const onSubmit = form.handleSubmit(() => {
    // Placeholder: actual implementation will start OAuth flow.
  });

  return (
    <DashboardFrame>
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Facebook Connection</h2>
          <p className="text-sm text-slate-500">OAuth-based page connection. No raw credentials are stored.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>Current merchant page binding</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Badge variant="neutral">Needs Setup</Badge>
            <p className="text-sm text-slate-500">Last sync: not available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Setup (Meta Step 4)</CardTitle>
            <CardDescription>Use these values in Messenger webhook configuration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Callback URL:</span> {webhookCallbackUrl}
            </p>
            <p>
              <span className="font-medium">Verify Token:</span> value from `FACEBOOK_WEBHOOK_VERIFY_TOKEN` in
              `.env.local`
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>OAuth Config</CardTitle>
            <CardDescription>Temporary setup values for integration scaffolding</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:max-w-xl" onSubmit={onSubmit}>
              <Input placeholder="Facebook App ID" {...form.register("appId", { required: true })} />
              <Input placeholder="Callback URL" {...form.register("callbackUrl", { required: true })} />
              <div className="flex gap-2">
                <Button type="submit">Start OAuth</Button>
                <Button type="button" variant="outline">
                  Disconnect
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardFrame>
  );
}
