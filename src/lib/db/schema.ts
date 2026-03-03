import { bigint, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const facebookConversations = pgTable(
  "facebook_conversations",
  {
    id: text("id").primaryKey(),
    psid: text("psid").notNull(),
    pageId: text("page_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    psidIdx: index("facebook_conversations_psid_idx").on(table.psid),
  }),
);

export const facebookMessages = pgTable(
  "facebook_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => facebookConversations.id, { onDelete: "cascade" }),
    senderId: text("sender_id").notNull(),
    recipientId: text("recipient_id").notNull(),
    text: text("text").notNull(),
    timestampMs: bigint("timestamp_ms", { mode: "number" }).notNull(),
    direction: text("direction", { enum: ["inbound", "outbound"] }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    conversationIdIdx: index("facebook_messages_conversation_id_idx").on(table.conversationId),
  }),
);

export const facebookWebhookDebugState = pgTable("facebook_webhook_debug_state", {
  id: integer("id").primaryKey(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  senderIds: jsonb("sender_ids").$type<string[]>().notNull(),
  recipientIds: jsonb("recipient_ids").$type<string[]>().notNull(),
  entries: integer("entries").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
