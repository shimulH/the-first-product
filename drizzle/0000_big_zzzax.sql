CREATE TABLE "facebook_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"psid" text NOT NULL,
	"page_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facebook_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"text" text NOT NULL,
	"timestamp_ms" integer NOT NULL,
	"direction" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "facebook_messages" ADD CONSTRAINT "facebook_messages_conversation_id_facebook_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."facebook_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "facebook_conversations_psid_idx" ON "facebook_conversations" USING btree ("psid");--> statement-breakpoint
CREATE INDEX "facebook_messages_conversation_id_idx" ON "facebook_messages" USING btree ("conversation_id");