---
name: MannMitra auth flow
description: Auth implementation details — token format, storage, and injection pattern
---

Token format: `base64url(JSON payload) + "." + HMAC-SHA256 sig`
Storage: `localStorage` key `mannmitra_token`
Injection: `setAuthTokenGetter(() => localStorage.getItem("mannmitra_token"))` called in `AuthProvider` useEffect
User serialized to `localStorage` key `mannmitra_user`

**Why:** No JWT library dependency; custom token verified server-side in `lib/auth.ts`. All generated API hooks use `customFetch` which calls `_authTokenGetter` before each request.

**How to apply:** Any new protected route: import `requireAuth` from `lib/auth.ts` and call it; it reads the Bearer token and returns the user or sends 401.
