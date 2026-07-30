# Guest User Privilege System

Guests are visitors with no Supabase session, no `auth.uid()`, and no row-backed application profile. They may browse public marketplace content only.

## Permission Matrix

| Surface / Action | Guest | Talent | Brand | Admin |
|---|---:|---:|---:|---:|
| View `/`, `/explore`, `/talents`, `/talent/[handle]` | Yes | Yes | Yes | Yes |
| View `/brands`, `/brand/[id]` | Yes, approved brands only | Yes | Yes | Yes |
| View `/jobs`, `/jobs/[id]` | Yes, open jobs only | Yes | Yes | Yes |
| View `/campaigns`, `/community`, `/community/question/[id]` | Yes | Yes | Yes | Yes |
| View `/packages` and `/pricing` | Yes, active packages only | Yes | Yes | Yes |
| Apply to jobs | No | Yes | No | Yes |
| Create jobs / manage applications | No | No | Yes | Yes |
| Create bookings / access payments | No | No | Yes | Yes |
| Start chat / send messages | No | Yes | Yes | Yes |
| Favorite talents | No | Yes | Yes | Yes |
| Upload portfolio / profile completion | No | Yes | No | Yes |
| Submit reviews | No | No | Yes | Yes |
| Create community questions / answers | No | Yes | Yes | Yes |
| Access dashboard, bookings, chat, profile, notifications, settings | No | Yes | Yes | Yes |

Inactive accounts with `account_status in ('blocked','suspended','rejected')` or `is_suspended = true` are denied protected actions. Brand-only actions require `brand_status` to be `approved` when the column is populated; talent-only marketplace actions require `talent_profiles.status = 'approved'` when populated.

## Implementation

- `lib/permissions.ts` is the shared source of truth for frontend and API route decisions.
- `contexts/GuestGuard.tsx` reads `supabase.auth.getSession()`, validates the user through `/api/me/role`, and owns the authentication modal.
- `components/auth/ProtectedAction.tsx` wraps buttons/links and opens the modal instead of allowing guest mutation clicks.
- `middleware.ts` redirects direct guest visits to protected app routes to `/login?next=...`.
- Public pages that use `adminClient` reapply public filters in server code because service-role reads bypass RLS.

## Protected Routes

Guests are redirected from `/dashboard`, `/profile`, `/messages`, `/chat`, `/bookings`, `/notifications`, `/settings`, `/payments`, `/jobs/create`, and `/jobs/[id]/applications`.

## E2E Smoke Test

Run the app first, then:

```bash
npm run test:e2e:guest
```

Set `E2E_BASE_URL` to test another environment. Role scenarios require seeded talent/brand/admin credentials and should be run against a disposable Supabase project.
