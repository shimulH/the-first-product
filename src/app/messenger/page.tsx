"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUiStore } from "@/lib/store/ui-store";

const fallbackQueueItems = [
  { id: "conv_1", customer: "Rahim Ahmed", status: "open", preview: "Do you have this in medium size?" },
  { id: "conv_2", customer: "Nusrat Jahan", status: "pending", preview: "Can you confirm delivery tomorrow?" },
  { id: "conv_3", customer: "Sabbir Islam", status: "open", preview: "I want to place an order for 2 pcs." },
];

const cannedReplies = [
  "Yes, this item is available. Please share your preferred size.",
  "Delivery is available within 24-48 hours in your area.",
  "Please share your name, phone number, and address to confirm order.",
];

type ConversationMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: number;
  direction: "inbound" | "outbound";
};

type ConversationThread = {
  psid: string;
  pageId: string | null;
  updatedAt: number;
  messages: ConversationMessage[];
};

type LatestWebhookPayload = {
  latest: {
    receivedAt: string;
    senderIds: string[];
    recipientIds: string[];
    entries: number;
  } | null;
  conversations: ConversationThread[];
};

type QueueItem = {
  id: string;
  customer: string;
  status: "open" | "pending";
  preview: string;
};

type FacebookUserProfile = {
  id: string;
  first_name?: string;
  last_name?: string;
  profile_pic?: string;
};

export default function MessengerPage() {
  const { selectedEntityId, setSelectedEntityId, queueView, setQueueView } = useUiStore();
  const [latestWebhook, setLatestWebhook] = useState<LatestWebhookPayload["latest"]>(null);
  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [profilesByPsid, setProfilesByPsid] = useState<Record<string, FacebookUserProfile>>({});

  const refreshWebhookState = useCallback(async () => {
    const response = await fetch("/api/webhooks/facebook/latest", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load latest webhook state.");
    }

    const data = (await response.json()) as LatestWebhookPayload;
    setLatestWebhook(data.latest);
    setConversations(Array.isArray(data.conversations) ? data.conversations : []);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadLatestWebhook = async () => {
      try {
        const response = await fetch("/api/webhooks/facebook/latest", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as LatestWebhookPayload;
        if (isMounted) {
          setLatestWebhook(data.latest);
          setConversations(Array.isArray(data.conversations) ? data.conversations : []);
        }
      } catch {
        // Keep UI usable even if debug endpoint is unavailable.
      }
    };

    void loadLatestWebhook();
    const intervalId = window.setInterval(loadLatestWebhook, 3000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const candidateIds = conversations.map((conversation) => conversation.psid);
    const missingIds = candidateIds.filter((psid) => !profilesByPsid[psid]);

    if (!missingIds.length) {
      return;
    }

    let cancelled = false;

    const loadMissingProfiles = async () => {
      for (const psid of missingIds) {
        try {
          const response = await fetch(`/api/facebook/user?psid=${encodeURIComponent(psid)}`, { cache: "no-store" });
          const data = (await response.json()) as { profile?: FacebookUserProfile; error?: string };

          if (!response.ok) {
            if (!cancelled) {
              setProfileStatus(data.error ?? "Could not fetch user profile.");
            }
            continue;
          }

          if (!cancelled && data.profile) {
            setProfilesByPsid((current) => ({ ...current, [psid]: data.profile as FacebookUserProfile }));
            setProfileStatus(null);
          }
        } catch {
          if (!cancelled) {
            setProfileStatus("Network error while fetching user profile.");
          }
        }
      }
    };

    void loadMissingProfiles();

    return () => {
      cancelled = true;
    };
  }, [conversations, profilesByPsid]);

  useEffect(() => {
    if (conversations.length && !conversations.some((conversation) => conversation.psid === selectedEntityId)) {
      setSelectedEntityId(conversations[0].psid);
    }
  }, [conversations, selectedEntityId, setSelectedEntityId]);

  const selectedConversation = conversations.find((conversation) => conversation.psid === selectedEntityId) ?? null;

  useEffect(() => {
    if (selectedConversation?.psid) {
      setRecipientId(selectedConversation.psid);
    } else if (!recipientId && latestWebhook?.senderIds?.[0]) {
      setRecipientId(latestWebhook.senderIds[0]);
    }
  }, [selectedConversation?.psid, recipientId, latestWebhook]);

  const queueItems: QueueItem[] = conversations.length
    ? conversations.map((conversation) => {
        const profile = profilesByPsid[conversation.psid];
        const customerName =
          profile && (profile.first_name || profile.last_name)
            ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
            : `User ${conversation.psid.slice(-6)}`;
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        return {
          id: conversation.psid,
          customer: customerName,
          status: "open",
          preview: lastMessage?.text ?? "No text message yet.",
        };
      })
    : fallbackQueueItems.map((item) => ({
        ...item,
        status: item.status === "pending" ? "pending" : "open",
      }));
  const selected = queueItems.find((item) => item.id === selectedEntityId) ?? queueItems[0];
  const selectedProfile = selectedConversation ? profilesByPsid[selectedConversation.psid] : null;
  const selectedProfileName =
    selectedProfile && (selectedProfile.first_name || selectedProfile.last_name)
      ? `${selectedProfile.first_name ?? ""} ${selectedProfile.last_name ?? ""}`.trim()
      : selectedConversation
        ? `User ${selectedConversation.psid.slice(-6)}`
        : "No live user yet";

  const handleSendReply = async () => {
    const targetRecipientId = recipientId.trim();
    const message = replyText.trim();

    if (!targetRecipientId) {
      setSendStatus("Recipient PSID is required.");
      return;
    }
    if (!message) {
      setSendStatus("Reply text cannot be empty.");
      return;
    }

    setIsSending(true);
    setSendStatus(null);

    try {
      const response = await fetch("/api/facebook/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: targetRecipientId,
          text: message,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setSendStatus(data.error ?? "Failed to send message.");
        return;
      }

      setReplyText("");
      setSendStatus("Message sent successfully.");
      await refreshWebhookState();
    } catch {
      setSendStatus("Network error while sending message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <DashboardFrame>
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Messenger Inbox</h2>
          <p className="text-sm text-slate-500">Balanced split workspace with list, detail, and customer context.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Debug</CardTitle>
            <CardDescription>Latest IDs and conversation threads from incoming webhook events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Last event:</span>{" "}
              {latestWebhook?.receivedAt ? new Date(latestWebhook.receivedAt).toLocaleString() : "No events yet"}
            </p>
            <p>
              <span className="font-medium">Sender PSID(s):</span>{" "}
              {latestWebhook?.senderIds?.length ? latestWebhook.senderIds.join(", ") : "No sender IDs yet"}
            </p>
            <p>
              <span className="font-medium">Recipient/Page ID(s):</span>{" "}
              {latestWebhook?.recipientIds?.length ? latestWebhook.recipientIds.join(", ") : "No recipient IDs yet"}
            </p>
            <p>
              <span className="font-medium">Entry count:</span> {latestWebhook?.entries ?? 0}
            </p>
            <p>
              <span className="font-medium">Conversations:</span> {conversations.length}
            </p>
            {profileStatus ? (
              <p>
                <span className="font-medium">Profile lookup:</span> {profileStatus}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button variant={queueView === "all" ? "default" : "outline"} onClick={() => setQueueView("all")}>
            All
          </Button>
          <Button
            variant={queueView === "assigned_to_me" ? "default" : "outline"}
            onClick={() => setQueueView("assigned_to_me")}
          >
            Assigned to me
          </Button>
          <Button variant={queueView === "unassigned" ? "default" : "outline"} onClick={() => setQueueView("unassigned")}>
            Unassigned
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[320px_1fr_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Queue</CardTitle>
              <CardDescription>{queueItems.length} conversations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {queueItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedEntityId(item.id);
                    setRecipientId(item.id);
                  }}
                  className="w-full rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{item.customer}</p>
                    <Badge variant={item.status === "open" ? "success" : "neutral"}>{item.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.preview}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>{selected.customer}{selectedConversation ? ` (${selectedConversation.psid})` : ""}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
                {selectedConversation?.messages?.length ? (
                  selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[85%] rounded-lg p-2 text-sm ${
                        message.direction === "outbound"
                          ? "ml-auto bg-blue-600 text-white"
                          : "bg-white text-slate-800"
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className="mt-1 text-[10px] opacity-70">{new Date(message.timestamp).toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-white p-3 text-sm text-slate-600">
                    {selected.preview}
                  </div>
                )}
              </div>
              <Input
                placeholder="Recipient PSID (auto-filled from latest webhook)"
                value={recipientId}
                onChange={(event) => setRecipientId(event.target.value)}
              />
              <Textarea placeholder="Write a reply..." value={replyText} onChange={(event) => setReplyText(event.target.value)} />
              {sendStatus ? <p className="text-xs text-slate-600">{sendStatus}</p> : null}
              <div className="flex justify-end">
                <Button onClick={handleSendReply} disabled={isSending}>
                  {isSending ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Context</CardTitle>
              <CardDescription>Live Facebook user details and quick prompts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium">{selectedProfileName}</p>
                <p className="text-xs text-slate-500">
                  {selectedConversation
                    ? `PSID: ${selectedConversation.psid}`
                    : "Send a message to your page to load real user details."}
                </p>
                {selectedProfile?.profile_pic ? (
                  <img
                    src={selectedProfile.profile_pic}
                    alt={`${selectedProfileName} profile`}
                    className="mt-2 h-12 w-12 rounded-full border border-slate-200 object-cover"
                  />
                ) : null}
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Prompt replies</p>
                <div className="space-y-2">
                  {cannedReplies.map((reply) => (
                    <button
                      key={reply}
                      className="w-full rounded-md border border-slate-200 p-2 text-left text-xs hover:bg-slate-50"
                      onClick={() => setReplyText(reply)}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardFrame>
  );
}
