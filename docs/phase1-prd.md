# Phase 1 PRD - Facebook Unified Inbox MVP

## Product Objective
Enable merchants to manage Facebook customer conversations and support operations from a single web app without exposing direct Facebook Page access to every support member.

## Primary Users
- Merchant Admin
- Support Member

## Key User Journeys

### 1) Connect Facebook Page
- Admin starts connection from Facebook Connection page.
- Admin completes Meta OAuth flow and grants required permissions.
- System stores encrypted tokens and page metadata.
- Admin sees connection status and last sync timestamp.

**Acceptance Criteria**
- Connection can be created, refreshed, and disconnected.
- Failed token refresh is detected and surfaced with actionable status.

### 2) Handle Messenger Conversation
- Incoming customer message appears in Messenger Inbox.
- Admin or support member opens conversation and sees customer context panel.
- User sends reply and conversation status updates.

**Acceptance Criteria**
- New messages are persisted and displayed in timeline order.
- Reply action logs sender, timestamp, and delivery attempt result.
- Customer panel shows new/returning tag and prior order summary.

### 3) Handle Page Comment
- New Facebook page comments appear in Comment Inbox.
- Admin assigns comments in bulk or individually.
- Support member replies from within app.

**Acceptance Criteria**
- Assigned owner is visible for each comment thread.
- Reply status (pending/sent/failed) is tracked and queryable.

### 4) Assign Work to Support Team
- Admin uses Assignment page to distribute workload.
- Supports fixed distribution (example: 10 comments per member).
- Team member queue reflects new assignments immediately.

**Acceptance Criteria**
- Assignment events are auditable with `assignedBy` and timestamps.
- Reassignment history remains visible.

### 5) Create Order from Conversation
- Admin opens customer conversation and creates an order.
- Order links to customer and (optionally) conversation/message context.
- Customer history updates with product, quantity, and notes.

**Acceptance Criteria**
- Order creation validates required fields.
- Customer profile reflects updated purchase history immediately.

### 6) Review Performance Reports
- Admin opens reports page for individual and team performance.
- Admin filters by date range and member.

**Acceptance Criteria**
- Member report includes response volume and response time trends.
- Team report includes assignment throughput and completion rate.

## Non-Goals (Phase 1)
- Multi-channel inbox beyond Facebook.
- Landing page builder.
- Automated campaign attribution beyond simple source tagging.

## Functional Requirements
- Role-based access (`merchant_admin`, `support_member`).
- Unified views for Messenger and comments.
- Assignment management and reporting.
- Customer profile with order and note timeline.
- Canned reply management and insertion.

## Non-Functional Requirements
- Accessible UI (keyboard-first navigation and semantic labels).
- Secure token handling and audit logging for sensitive operations.
- Predictable page load performance for medium-sized inboxes.

## MVP Success Metrics
- Median first-response time per team member.
- Assignment completion rate.
- Orders created from inbox conversations.
- Returning customer conversion ratio in conversation workflows.
