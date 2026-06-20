---
name: MannMitra demo user seeding
description: How to seed the demo user — scripts package cannot import @workspace/db directly
---

The `scripts` package cannot import `@workspace/db` via tsx without proper tsconfig paths resolution (causes ERR_MODULE_NOT_FOUND).

**Why:** tsx runs ESM but workspace path aliases aren't resolved without a build step.

**How to apply:** Seed demo user by calling the running API instead:
```bash
curl -X POST localhost:80/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@mannmitra.com","password":"Demo@123","name":"Demo User","examType":"JEE"}'
```
If already registered, use login endpoint to verify. The password hash is computed with SESSION_SECRET env var, so seeding must go through the API (not direct DB insert with a hardcoded hash).
