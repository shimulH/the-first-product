import { NextResponse } from "next/server";
import { requireEnv } from "@/lib/facebook/webhook";
import { addOutgoingFacebookMessage } from "@/lib/facebook/webhook-state";

export const runtime = "nodejs";

type SendMessagePayload = {
  recipientId?: string;
  text?: string;
};

export async function POST(request: Request) {
  let body: SendMessagePayload;

  try {
    body = (await request.json()) as SendMessagePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const recipientId = body.recipientId?.trim();
  const text = body.text?.trim();

  if (!recipientId || !text) {
    return NextResponse.json({ error: "Both recipientId and text are required." }, { status: 400 });
  }

  let pageAccessToken: string;
  try {
    pageAccessToken = requireEnv("FACEBOOK_PAGE_ACCESS_TOKEN");
  } catch {
    return NextResponse.json({ error: "FACEBOOK_PAGE_ACCESS_TOKEN is not configured." }, { status: 500 });
  }

  const facebookResponse = await fetch("https://graph.facebook.com/v21.0/me/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pageAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });

  const responseData: unknown = await facebookResponse.json().catch(() => null);

  if (!facebookResponse.ok) {
    return NextResponse.json(
      {
        error: "Facebook Send API request failed.",
        details: responseData,
      },
      { status: facebookResponse.status },
    );
  }

  const sentMessageId =
    typeof responseData === "object" &&
    responseData !== null &&
    "message_id" in responseData &&
    typeof (responseData as { message_id?: unknown }).message_id === "string"
      ? (responseData as { message_id: string }).message_id
      : undefined;

  await addOutgoingFacebookMessage({
    recipientId,
    text,
    messageId: sentMessageId,
  });

  return NextResponse.json({
    status: "sent",
    recipientId,
    details: responseData,
  });
}
