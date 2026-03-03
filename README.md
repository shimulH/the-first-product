# Social Inbox Phase 1

Unified inbox MVP for Facebook Messenger and Facebook Page comments.

## Stack
- Next.js (App Router)
- Tailwind CSS
- Zustand
- React Hook Form
- shadcn-style UI primitives
- date-fns

## Pages
- `/team-members`
- `/reports`
- `/facebook-connection`
- `/comments`
- `/messenger`
- `/assignments`

## Run locally
1. Install dependencies:
   - `pnpm install`
2. Start development:
   - `pnpm dev`

## Database (Drizzle + Postgres)
- Set `DATABASE_URL` in your environment.
- Generate migrations: `pnpm db:generate`
- Run migrations: `pnpm db:migrate`
- Open Drizzle Studio: `pnpm db:studio`

## Facebook webhook (step 4)
- Endpoint implemented at: `/api/webhooks/facebook`
- Setup instructions: `docs/facebook-webhook-setup.md`
