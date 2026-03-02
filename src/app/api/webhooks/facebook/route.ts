import { NextResponse } from "next/server";
import {
  isFacebookVerificationRequest,
  verifyFacebookChallenge,
  verifyFacebookRequestSignature,
} from "@/lib/facebook/webhook";
import { addIncomingFacebookMessages, setLatestWebhookDebugState } from "@/lib/facebook/webhook-state";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (!isFacebookVerificationRequest(url.searchParams)) {
    return NextResponse.json({ error: "Invalid verification mode." }, { status: 400 });
  }

  try {
    const challenge = verifyFacebookChallenge(url.searchParams);
    if (!challenge) {
      return NextResponse.json({ error: "Verification token mismatch." }, { status: 403 });
    }
    return new NextResponse(challenge, { status: 200 });
  } catch (error) {
    console.error("Webhook verification configuration error:", error);
    return NextResponse.json({ error: "Webhook verification is not configured." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-hub-signature-256");
  const rawBody = await request.text();

  try {
    const isSignatureValid = verifyFacebookRequestSignature(rawBody, signature);
    if (!isSignatureValid) {
      return NextResponse.json({ error: "Invalid request signature." }, { status: 401 });
    }
  } catch (error) {
    console.error("Webhook signature check failed:", error);
    return NextResponse.json({ error: "Webhook signature validation failed." }, { status: 500 });
  }

  try {
    const payload = JSON.parse(rawBody);

    if (payload.object !== "page") {
      return NextResponse.json({ error: "Unsupported webhook object." }, { status: 400 });
    }

    type MessagingEvent = {
      timestamp?: number;
      sender?: { id?: string };
      recipient?: { id?: string };
      message?: { mid?: string; text?: string };
    };

    const senderIds = Array.isArray(payload.entry)
      ? [
          ...new Set(
            payload.entry.flatMap((entry: { messaging?: MessagingEvent[] }) =>
              Array.isArray(entry.messaging)
                ? entry.messaging
                    .map((event) => event.sender?.id)
                    .filter((id): id is string => typeof id === "string" && id.length > 0)
                : [],
            ),
          ),
        ]
      : [];
    const recipientIds = Array.isArray(payload.entry)
      ? [
          ...new Set(
            payload.entry.flatMap((entry: { messaging?: MessagingEvent[] }) =>
              Array.isArray(entry.messaging)
                ? entry.messaging
                    .map((event) => event.recipient?.id)
                    .filter((id): id is string => typeof id === "string" && id.length > 0)
                : [],
            ),
          ),
        ]
      : [];
    const incomingMessages = Array.isArray(payload.entry)
      ? payload.entry.flatMap((entry: { messaging?: MessagingEvent[] }) =>
          Array.isArray(entry.messaging)
            ? entry.messaging
                .map((event) => ({
                  senderId: event.sender?.id,
                  recipientId: event.recipient?.id,
                  text: event.message?.text,
                  timestamp: event.timestamp,
                  mid: event.message?.mid,
                }))
                .filter(
                  (
                    event,
                  ): event is {
                    senderId: string;
                    recipientId: string;
                    text: string;
                    timestamp?: number;
                    mid?: string;
                  } =>
                    typeof event.senderId === "string" &&
                    event.senderId.length > 0 &&
                    typeof event.recipientId === "string" &&
                    event.recipientId.length > 0 &&
                    typeof event.text === "string" &&
                    event.text.length > 0,
                )
            : [],
        )
      : [];

    await addIncomingFacebookMessages(incomingMessages);

    await setLatestWebhookDebugState({
      receivedAt: new Date().toISOString(),
      senderIds,
      recipientIds,
      entries: Array.isArray(payload.entry) ? payload.entry.length : 0,
    });

    // TODO: Persist incoming events and dispatch processing jobs.
    console.log("Facebook webhook event received:", {
      entries: Array.isArray(payload.entry) ? payload.entry.length : 0,
      senderIds,
      recipientIds,
      incomingMessages: incomingMessages.length,
    });

    // Facebook requires a 200 response quickly for delivery success.
    return NextResponse.json({ status: "received" }, { status: 200 });
  } catch (error) {
    console.error("Invalid webhook payload:", error);
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
}
