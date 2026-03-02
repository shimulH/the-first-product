import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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
type PersistedWebhookState = {
  latest: WebhookDebugState | null;
  conversations: ConversationThread[];
};

const DEFAULT_STATE: PersistedWebhookState = {
  latest: null,
  conversations: [],
};

const STATE_DIR = path.join(process.cwd(), ".data");
const STATE_PATH = path.join(STATE_DIR, "facebook-webhook-state.json");

let writeQueue: Promise<void> = Promise.resolve();

async function readState(): Promise<PersistedWebhookState> {
  try {
    const content = await readFile(STATE_PATH, "utf8");
    const parsed = JSON.parse(content) as Partial<PersistedWebhookState>;

    const latest =
      parsed.latest &&
      typeof parsed.latest === "object" &&
      typeof parsed.latest.receivedAt === "string" &&
      Array.isArray(parsed.latest.senderIds) &&
      Array.isArray(parsed.latest.recipientIds) &&
      typeof parsed.latest.entries === "number"
        ? parsed.latest
        : null;

    const conversations = Array.isArray(parsed.conversations)
      ? parsed.conversations
          .filter(
            (thread): thread is ConversationThread =>
              typeof thread?.psid === "string" && Array.isArray(thread?.messages) && typeof thread?.updatedAt === "number",
          )
          .map((thread) => ({
            ...thread,
            pageId: typeof thread.pageId === "string" ? thread.pageId : null,
            messages: thread.messages.filter(
              (message): message is ConversationMessage =>
                typeof message?.id === "string" &&
                typeof message?.senderId === "string" &&
                typeof message?.recipientId === "string" &&
                typeof message?.text === "string" &&
                typeof message?.timestamp === "number" &&
                (message?.direction === "inbound" || message?.direction === "outbound"),
            ),
          }))
      : [];

    return { latest, conversations };
  } catch {
    return DEFAULT_STATE;
  }
}

async function writeState(state: PersistedWebhookState) {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_PATH, JSON.stringify(state), "utf8");
}

function enqueueWrite(updater: (state: PersistedWebhookState) => PersistedWebhookState | Promise<PersistedWebhookState>) {
  writeQueue = writeQueue.then(async () => {
    const current = await readState();
    const next = await updater(current);
    await writeState(next);
  });
  return writeQueue;
}

function getOrCreateThread(conversations: ConversationThread[], psid: string, pageId: string | null): ConversationThread {
  const existing = conversations.find((thread) => thread.psid === psid);
  if (existing) {
    if (pageId && !existing.pageId) {
      existing.pageId = pageId;
    }
    return existing;
  }

  const created: ConversationThread = { psid, pageId, updatedAt: Date.now(), messages: [] };
  conversations.push(created);
  return created;
}

function normalizeState(state: PersistedWebhookState): PersistedWebhookState {
  const conversations = [...state.conversations]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_THREADS)
    .map((thread) => ({
      ...thread,
      messages: [...thread.messages].sort((a, b) => a.timestamp - b.timestamp).slice(-MAX_MESSAGES_PER_THREAD),
    }));

  return {
    latest: state.latest,
    conversations,
  };
}

export async function setLatestWebhookDebugState(state: WebhookDebugState) {
  await enqueueWrite((current) => normalizeState({ ...current, latest: state }));
}

export async function getLatestWebhookDebugState(): Promise<WebhookDebugState | null> {
  const state = await readState();
  return state.latest;
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

  await enqueueWrite((current) => {
    const next: PersistedWebhookState = {
      latest: current.latest,
      conversations: [...current.conversations],
    };

    for (const event of events) {
      const thread = getOrCreateThread(next.conversations, event.senderId, event.recipientId);
      const message: ConversationMessage = {
        id: event.mid ?? `in_${event.senderId}_${event.timestamp ?? Date.now()}`,
        senderId: event.senderId,
        recipientId: event.recipientId,
        text: event.text,
        timestamp: event.timestamp ?? Date.now(),
        direction: "inbound",
      };

      thread.messages.push(message);
      thread.updatedAt = message.timestamp;
    }

    return normalizeState(next);
  });
}

export async function addOutgoingFacebookMessage(input: {
  recipientId: string;
  pageId?: string | null;
  text: string;
  messageId?: string;
}) {
  await enqueueWrite((current) => {
    const now = Date.now();
    const next: PersistedWebhookState = {
      latest: current.latest,
      conversations: [...current.conversations],
    };
    const thread = getOrCreateThread(next.conversations, input.recipientId, input.pageId ?? null);
    const message: ConversationMessage = {
      id: input.messageId ?? `out_${input.recipientId}_${now}`,
      senderId: input.pageId ?? "page",
      recipientId: input.recipientId,
      text: input.text,
      timestamp: now,
      direction: "outbound",
    };

    thread.messages.push(message);
    thread.updatedAt = now;
    return normalizeState(next);
  });
}

export async function getConversationThreads(): Promise<ConversationThread[]> {
  const state = await readState();
  return normalizeState(state).conversations;
}
