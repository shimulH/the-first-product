# Phase 1 Data Model and Metrics

## Core Entities

### Merchant
- `id`
- `name`
- `email`
- `createdAt`, `updatedAt`

### User
- `id`
- `merchantId`
- `fullName`
- `email`
- `role` (`merchant_admin` | `support_member`)
- `isActive`
- `createdAt`, `updatedAt`

### FacebookConnection
- `id`
- `merchantId`
- `facebookPageId`
- `facebookPageName`
- `encryptedAccessToken`
- `tokenExpiresAt`
- `connectionStatus` (`connected` | `needs_reauth` | `disconnected`)
- `lastSyncedAt`
- `createdBy`, `updatedBy`
- `createdAt`, `updatedAt`

### Customer
- `id`
- `merchantId`
- `facebookPsid` (unique per page context)
- `displayName`
- `profilePhotoUrl` (optional)
- `isReturningBuyer`
- `lifetimeOrders`
- `lifetimeOrderValue`
- `notes`
- `createdAt`, `updatedAt`

### Conversation
- `id`
- `merchantId`
- `customerId`
- `channel` (`messenger` | `comment`)
- `status` (`open` | `pending` | `closed`)
- `assignedToUserId` (nullable)
- `lastMessageAt`
- `createdAt`, `updatedAt`

### Message
- `id`
- `conversationId`
- `direction` (`inbound` | `outbound`)
- `senderType` (`customer` | `support_member` | `merchant_admin` | `system`)
- `senderUserId` (nullable)
- `externalMessageId`
- `content`
- `deliveryStatus` (`pending` | `sent` | `failed`)
- `sentAt`, `createdAt`

### CommentThread
- `id`
- `merchantId`
- `customerId`
- `facebookPostId`
- `externalCommentId`
- `assignedToUserId` (nullable)
- `status` (`open` | `in_progress` | `resolved`)
- `lastActivityAt`
- `createdAt`, `updatedAt`

### Assignment
- `id`
- `merchantId`
- `entityType` (`conversation` | `comment_thread`)
- `entityId`
- `assignedToUserId`
- `assignedByUserId`
- `reason` (optional)
- `createdAt`

### Product
- `id`
- `merchantId`
- `name`
- `sku` (optional)
- `unitPrice`
- `isActive`
- `createdAt`, `updatedAt`

### Order
- `id`
- `merchantId`
- `customerId`
- `createdByUserId`
- `sourceChannel` (`messenger` | `comment`)
- `status` (`draft` | `confirmed` | `cancelled`)
- `totalAmount`
- `notes`
- `createdAt`, `updatedAt`

### OrderItem
- `id`
- `orderId`
- `productId`
- `quantity`
- `unitPrice`
- `lineTotal`

### CannedReply
- `id`
- `merchantId`
- `title`
- `content`
- `tags` (optional)
- `isActive`
- `createdBy`
- `createdAt`, `updatedAt`

### PerformanceMetricSnapshot (optional pre-aggregation)
- `id`
- `merchantId`
- `userId` (nullable for team-level rows)
- `metricDate`
- `messagesHandled`
- `commentsHandled`
- `avgFirstResponseSeconds`
- `assignmentCompletionRate`
- `ordersCreated`
- `createdAt`

## Required Audit Fields
- Use `createdAt`, `updatedAt` on mutable entities.
- Track privileged actions with `createdBy`/`updatedBy` or dedicated event logs.
- Keep assignment history immutable through `Assignment` events.

## Metric Definitions

### Customer Buying Ratio
`customer_buying_ratio = orders_confirmed_by_customer / total_distinct_conversations_with_customer`

Notes:
- Time window default: all-time, with optional date filter in reports.
- If denominator is zero, display `0`.

### Order Ratio (Channel)
`channel_order_ratio = confirmed_orders_from_channel / total_confirmed_orders`

Notes:
- Computed per selected date range.
- Channels for Phase 1: `messenger`, `comment`.

### Assignment Completion Rate
`assignment_completion_rate = completed_assignments / total_assignments`

Where:
- A conversation assignment is completed when status transitions to `closed`.
- A comment assignment is completed when status transitions to `resolved`.

### First Response Time
`first_response_time_seconds = first_outbound_reply_timestamp - first_inbound_timestamp`

Notes:
- Exclude conversations without an outbound reply from average calculations.
