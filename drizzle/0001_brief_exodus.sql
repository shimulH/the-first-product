CREATE TABLE "facebook_webhook_debug_state" (
	"id" integer PRIMARY KEY NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"sender_ids" jsonb NOT NULL,
	"recipient_ids" jsonb NOT NULL,
	"entries" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
