# Phase 1 Scope and Compliance Freeze

## Goal
Build an MVP that allows merchants to manage Facebook Messenger conversations and Facebook Page comments from one inbox while managing support team workflows.

## In Scope (Phase 1)
- Facebook Messenger inbox (read, reply, assign).
- Facebook Page comment management (read, reply, assign).
- Customer history panel (new vs returning, order and note history, product history).
- Team member management (add, edit, delete support members).
- Assignment and workload distribution for comments/conversations.
- Member-level and team-level support performance reports.
- Order creation from the panel.
- Canned/prompt replies for common responses.

## Out of Scope (Phase 1)
- Instagram, WhatsApp, TikTok, or other social channels.
- Landing page builder.
- Advanced marketing automation and AI auto-replies.
- Complex inventory sync with external ERP systems.

## Security and Platform Compliance
- Do not collect or store raw Facebook username/password credentials.
- Use Meta OAuth flow and store only tokens and required metadata.
- Encrypt access/refresh tokens at rest.
- Request minimum required permissions (least privilege) and keep an auditable permission registry.
- Implement token refresh and revocation handling.
- Maintain audit logs for sensitive actions (connect/disconnect page, assignment changes, message send attempts).

## Roles
- `merchant_admin`: manages members, assignments, reports, connections, and order workflows.
- `support_member`: handles assigned conversations/comments and updates customer/order context based on granted permissions.

## Confirmed Page List (Phase 1)
1. Team Member Management
2. Reports and Member History
3. Facebook Connection
4. Comment Inbox
5. Messenger Inbox
6. Task Assignment

## Success Criteria
- Merchant can connect a Facebook Page via OAuth.
- Incoming messages/comments are visible in a unified operational dashboard.
- Team can reply without granting direct Facebook Page admin access.
- Admin can measure response and assignment performance.
- Merchant can create an order from an active customer conversation.
