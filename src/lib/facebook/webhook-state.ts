import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { facebookConversations, facebookMessages, facebookWebhookDebugState } from "@/lib/db/schema";

type WebhookDebugState = {
  receivedAt: string;
  senderIds: string[];
  recipientIds: string[];
  entries: number;
};

export type ConversationMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: number;
  direction: "inbound" | "outbound";
};

export type ConversationThread = {
  psid: string;
  pageId: string | null;
  updatedAt: number;
  messages: ConversationMessage[];
};

const MAX_MESSAGES_PER_THREAD = 50;
const MAX_THREADS = 100;
const DEBUG_STATE_ID = 1;

async function trimStateForThread(threadId: string) {
  const newestMessageIds = await db
    .select({ id: facebookMessages.id })
    .from(facebookMessages)
    .where(eq(facebookMessages.conversationId, threadId))
    .orderBy(desc(facebookMessages.timestampMs))
    .limit(MAX_MESSAGES_PER_THREAD);

  const newestIdsSet = new Set(newestMessageIds.map((row) => row.id));
  const allMessageIds = await db
    .select({ id: facebookMessages.id })
    .from(facebookMessages)
    .where(eq(facebookMessages.conversationId, threadId));
  const staleIds = allMessageIds.filter((row) => !newestIdsSet.has(row.id)).map((row) => row.id);

  if (staleIds.length) {
    await db.delete(facebookMessages).where(inArray(facebookMessages.id, staleIds));
  }
}

async function trimThreads() {
  const keepThreadIds = await db
    .select({ id: facebookConversations.id })
    .from(facebookConversations)
    .orderBy(desc(facebookConversations.updatedAt))
    .limit(MAX_THREADS);

  const keepSet = new Set(keepThreadIds.map((row) => row.id));
  const allThreadIds = await db.select({ id: facebookConversations.id }).from(facebookConversations);
  const staleThreadIds = allThreadIds.filter((row) => !keepSet.has(row.id)).map((row) => row.id);

  if (staleThreadIds.length) {
    await db.delete(facebookConversations).where(inArray(facebookConversations.id, staleThreadIds));
  }
}

async function upsertConversation(input: {
  psid: string;
  pageId: string | null;
  updatedAtMs: number;
}) {
  await db
    .insert(facebookConversations)
    .values({
      id: input.psid,
      psid: input.psid,
      pageId: input.pageId,
      updatedAt: new Date(input.updatedAtMs),
    })
    .onConflictDoNothing();

  await db
    .update(facebookConversations)
    .set({
      updatedAt: new Date(input.updatedAtMs),
      ...(input.pageId ? { pageId: input.pageId } : {}),
    })
    .where(eq(facebookConversations.id, input.psid));
}

export async function setLatestWebhookDebugState(state: WebhookDebugState) {
  await db
    .insert(facebookWebhookDebugState)
    .values({
      id: DEBUG_STATE_ID,
      receivedAt: new Date(state.receivedAt),
      senderIds: state.senderIds,
      recipientIds: state.recipientIds,
      entries: state.entries,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: facebookWebhookDebugState.id,
      set: {
        receivedAt: new Date(state.receivedAt),
        senderIds: state.senderIds,
        recipientIds: state.recipientIds,
        entries: state.entries,
        updatedAt: new Date(),
      },
    });
}

export async function getLatestWebhookDebugState(): Promise<WebhookDebugState | null> {
  const row = await db.query.facebookWebhookDebugState.findFirst({
    where: eq(facebookWebhookDebugState.id, DEBUG_STATE_ID),
  });

  if (!row) {
    return null;
  }

  return {
    receivedAt: row.receivedAt.toISOString(),
    senderIds: Array.isArray(row.senderIds) ? row.senderIds : [],
    recipientIds: Array.isArray(row.recipientIds) ? row.recipientIds : [],
    entries: row.entries,
  };
}

export async function addIncomingFacebookMessages(
  events: Array<{
    senderId: string;
    recipientId: string;
    text: string;
    timestamp?: number;
    mid?: string;
  }>,
) {
  if (!events.length) {
    return;
  }

  const touchedThreadIds = new Set<string>();

  for (const event of events) {
    const timestamp = event.timestamp ?? Date.now();
    const messageId = event.mid ?? `in_${event.senderId}_${timestamp}`;

    await upsertConversation({
      psid: event.senderId,
      pageId: event.recipientId,
      updatedAtMs: timestamp,
    });
    touchedThreadIds.add(event.senderId);

    await db
      .insert(facebookMessages)
      .values({
        id: messageId,
        conversationId: event.senderId,
        senderId: event.senderId,
        recipientId: event.recipientId,
        text: event.text,
        timestampMs: timestamp,
        direction: "inbound",
      })
      .onConflictDoNothing();
  }

  for (const threadId of touchedThreadIds) {
    await trimStateForThread(threadId);
  }
  await trimThreads();
}

export async function addOutgoingFacebookMessage(input: {
  recipientId: string;
  pageId?: string | null;
  text: string;
  messageId?: string;
}) {
  const now = Date.now();
  const messageId = input.messageId ?? `out_${input.recipientId}_${now}`;

  await upsertConversation({
    psid: input.recipientId,
    pageId: input.pageId ?? null,
    updatedAtMs: now,
  });

  await db
    .insert(facebookMessages)
    .values({
      id: messageId,
      conversationId: input.recipientId,
      senderId: input.pageId ?? "page",
      recipientId: input.recipientId,
      text: input.text,
      timestampMs: now,
      direction: "outbound",
    })
    .onConflictDoNothing();

  await trimStateForThread(input.recipientId);
  await trimThreads();
}

export async function getConversationThreads(): Promise<ConversationThread[]> {
  const conversations = await db
    .select()
    .from(facebookConversations)
    .orderBy(desc(facebookConversations.updatedAt))
    .limit(MAX_THREADS);

  if (!conversations.length) {
    return [];
  }

  const conversationIds = conversations.map((conversation) => conversation.id);
  const messages = await db
    .select()
    .from(facebookMessages)
    .where(inArray(facebookMessages.conversationId, conversationIds))
    .orderBy(asc(facebookMessages.timestampMs));

  const messagesByConversationId = new Map<string, ConversationMessage[]>();
  for (const message of messages) {
    const current = messagesByConversationId.get(message.conversationId) ?? [];
    current.push({
      id: message.id,
      senderId: message.senderId,
      recipientId: message.recipientId,
      text: message.text,
      timestamp: message.timestampMs,
      direction: message.direction,
    });
    messagesByConversationId.set(message.conversationId, current);
  }

  return conversations.map((conversation) => {
    const rawMessages = messagesByConversationId.get(conversation.id) ?? [];
    const trimmedMessages = rawMessages.slice(-MAX_MESSAGES_PER_THREAD);

    return {
      psid: conversation.psid,
      pageId: conversation.pageId,
      updatedAt: conversation.updatedAt.getTime(),
      messages: trimmedMessages,
    };
  });
}
