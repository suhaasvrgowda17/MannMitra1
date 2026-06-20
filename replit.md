# MannMitra

AI-powered mental wellness companion for Indian competitive exam aspirants (JEE, NEET, UPSC, GATE, CAT, CUET).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mannmitra run dev` — run the frontend (port 23324)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`, `OPENAI_API_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Recharts, React Query, Wouter

## Where things live

- `artifacts/api-server/` — Express API server
- `artifacts/mannmitra/` — React + Vite frontend
- `lib/db/` — Drizzle ORM schema + DB client
- `lib/api-spec/` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/` — Generated React Query hooks + Zod schemas
- `lib/api-zod/` — Generated Zod request/response schemas for server-side use
- `scripts/` — Utility scripts (seed-demo, etc.)

## Architecture decisions

- Contract-first: OpenAPI spec → codegen → typed client hooks + Zod server validators
- Auth: HMAC-SHA256 token stored in localStorage (`mannmitra_token`). `setAuthTokenGetter` wires token injection into all generated API calls.
- AI: OpenAI `gpt-4o-mini` for journal analysis, burnout prediction, and chat responses. Falls back gracefully on error.
- Routes mounted at `/api` prefix on the Express app; frontend served at `/`.
- Demo user: demo@mannmitra.com / Demo@123 (pre-seeded via `pnpm --filter @workspace/scripts run seed-demo`)

## Product

- **Journal**: Multi-language emotional journaling (EN/HI/TA/TE/KN/BN) with AI mood analysis, stress detection, and personalized insights
- **Dashboard**: 7-day mood trend chart, burnout risk prediction (ring gauge), subject stress heatmap, mood calendar
- **Chat**: Context-aware AI companion with typing indicator; knows the user's exam type and adapts its tone
- **SOS**: Emergency contact setup + one-tap silent alert triggering
- **Home**: Welcome screen with streak, avg mood, recent AI insights, and burnout risk summary

## User preferences

- Tagline "Feel Better. Perform Better." on auth/landing pages
- "A Friend for Every Thought" on chat page header
- Demo credentials (demo@mannmitra.com / Demo@123) prominently visible on login page
- Warm teal/off-white color palette

## Gotchas

- API server must be restarted after adding new route files (esbuild bundles at startup)
- Seed demo user via: `curl -X POST localhost:80/api/auth/register -H "Content-Type: application/json" -d '{"email":"demo@mannmitra.com","password":"Demo@123","name":"Demo User","examType":"JEE"}'`
- Don't use `python3` in bash — it's not available; use `node` for scripting
- `pnpm run build` from bash fails for frontend (needs `PORT` env var from workflow); use `typecheck` instead

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
