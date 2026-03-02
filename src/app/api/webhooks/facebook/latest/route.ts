import { NextResponse } from "next/server";
import { getConversationThreads, getLatestWebhookDebugState } from "@/lib/facebook/webhook-state";

export const runtime = "nodejs";

export async function GET() {
  const latest = await getLatestWebhookDebugState();
  const conversations = await getConversationThreads();

  return NextResponse.json({
    latest,
    conversations,
  });
}
