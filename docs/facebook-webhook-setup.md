# Facebook Webhook Setup (Step 4)

This prepares the **app-level webhook** setup for Messenger.

## 1) Configure environment
1. Copy `.env.example` to `.env.local`.
2. Set:
   - `FACEBOOK_APP_SECRET`
   - `FACEBOOK_WEBHOOK_VERIFY_TOKEN`
   - `NEXT_PUBLIC_APP_URL`

## 2) Webhook URL
- Callback URL in Meta should be:
  - `https://your-domain.com/api/webhooks/facebook`
- For local testing, expose localhost via ngrok:
  - `ngrok http 3000`
  - Use `https://<ngrok-id>.ngrok-free.app/api/webhooks/facebook`

## 3) Verify Token
- In Meta webhook setup, use the exact same value as:
  - `FACEBOOK_WEBHOOK_VERIFY_TOKEN`

## 4) Subscribe webhook fields (app-level)
Select at least:
- `messages`
- `messaging_postbacks`
- `message_deliveries`
- `messaging_referrals`

## 5) Connect page (page-level)
After app-level webhook is verified, subscribe your page in Messenger settings so page events are sent.

## 6) Test endpoint quickly
Run:
- `npm run dev`

Verification test (browser):
- Open  
  `http://localhost:3000/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=<your_token>&hub.challenge=12345`
- Expected response body: `12345`

## Endpoint behavior implemented
- `GET /api/webhooks/facebook`
  - Handles Meta verification challenge.
- `POST /api/webhooks/facebook`
  - Validates `x-hub-signature-256` using `FACEBOOK_APP_SECRET`.
  - Accepts `object: "page"` payloads and returns `200` quickly.
