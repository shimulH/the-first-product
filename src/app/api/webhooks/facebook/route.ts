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
      message?: { mid?: string; text?: string; attachments?: unknown[] };
    };
    type MessagingDebugEvent = {
      entryIndex: number;
      messageIndex: number;
      mid: string | null;
      senderId: string | null;
      recipientId: string | null;
      textPreview: string | null;
      hasAttachments: boolean;
      timestamp: number | null;
      status: "stored" | "skipped";
      skipReason: string | null;
    };

    const senderIds: string[] = Array.isArray(payload.entry)
      ? [
          ...new Set<string>(
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
    const recipientIds: string[] = Array.isArray(payload.entry)
      ? [
          ...new Set<string>(
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
    const messagingDebug: MessagingDebugEvent[] = Array.isArray(payload.entry)
      ? payload.entry.flatMap((entry: { messaging?: MessagingEvent[] }, entryIndex: number) =>
          Array.isArray(entry.messaging)
            ? entry.messaging.map((event, messageIndex) => {
                const senderId = event.sender?.id;
                const recipientId = event.recipient?.id;
                const text = event.message?.text;
                const hasAttachments = Array.isArray(event.message?.attachments) && event.message.attachments.length > 0;

                let skipReason: string | null = null;
                if (typeof senderId !== "string" || senderId.length === 0) {
                  skipReason = "missing_sender_id";
                } else if (typeof recipientId !== "string" || recipientId.length === 0) {
                  skipReason = "missing_recipient_id";
                } else if (typeof text !== "string" || text.length === 0) {
                  skipReason = hasAttachments ? "attachment_only_message" : "missing_or_empty_text";
                }

                return {
                  entryIndex,
                  messageIndex,
                  mid: event.message?.mid ?? null,
                  senderId: typeof senderId === "string" ? senderId : null,
                  recipientId: typeof recipientId === "string" ? recipientId : null,
                  textPreview: typeof text === "string" ? text.slice(0, 80) : null,
                  hasAttachments,
                  timestamp: event.timestamp ?? null,
                  status: skipReason ? "skipped" : "stored",
                  skipReason,
                };
              })
            : [],
        )
      : [];

    const incomingMessages = messagingDebug
      .filter((event) => event.status === "stored" && event.senderId && event.recipientId && event.textPreview)
      .map((event) => ({
        senderId: event.senderId as string,
        recipientId: event.recipientId as string,
        text: event.textPreview as string,
        timestamp: event.timestamp ?? undefined,
        mid: event.mid ?? undefined,
      }));

    try {
      await addIncomingFacebookMessages(incomingMessages);
      await setLatestWebhookDebugState({
        receivedAt: new Date().toISOString(),
        senderIds,
        recipientIds,
        entries: Array.isArray(payload.entry) ? payload.entry.length : 0,
      });
    } catch (error) {
      // Do not fail webhook delivery when debug state persistence is unavailable.
      console.error("Failed to persist webhook debug state:", error);
    }

    // TODO: Persist incoming events and dispatch processing jobs.
    console.log("Facebook webhook event received:", {
      entries: Array.isArray(payload.entry) ? payload.entry.length : 0,
      senderIds,
      recipientIds,
      incomingMessages: incomingMessages.length,
    });
    console.log("Facebook webhook event debug:", {
      totalMessagingEvents: messagingDebug.length,
      storedEvents: messagingDebug.filter((event) => event.status === "stored").length,
      skippedEvents: messagingDebug.filter((event) => event.status === "skipped").length,
      events: messagingDebug,
    });

    // Facebook requires a 200 response quickly for delivery success.
    return NextResponse.json({ status: "received" }, { status: 200 });
  } catch (error) {
    console.error("Invalid webhook payload:", error);
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
}
