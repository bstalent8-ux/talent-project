// Split out of route.ts — Next.js App Router only allows a route.ts file to
// export route handlers (GET/POST/...) plus a small fixed allowlist
// (runtime/dynamic/config/...); any other export fails `next build`'s
// generated route-type check (caught live: "Property 'bookingSchema' is
// incompatible with index signature" — tsc --noEmit does NOT run this
// check, only next build does, which is why this passed locally for a
// while before failing in CI/Cloudflare's build).
import { z } from "zod";

export const SERVICE_TYPES = ["hourly", "daily", "fixed_project"] as const;
export type ServiceType = typeof SERVICE_TYPES[number];

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// DirectBriefModal.tsx already validates all of this client-side (see its
// own `validate()`) — this is the server-side backstop for a direct caller,
// so it re-enforces the same rules rather than trusting the client's copy.
// Genuinely new here: brief/attachments length caps and a budget ceiling —
// neither existed at any layer before.
export const bookingSchema = z.object({
  talent_user_id: z.string().uuid(),
  service_type:   z.enum(SERVICE_TYPES),
  start_date:     z.string().regex(DATE_ONLY, "start_date must be YYYY-MM-DD"),
  duration:       z.coerce.number().int().positive().nullable().optional(),
  deadline:       z.string().regex(DATE_ONLY, "deadline must be YYYY-MM-DD").nullable().optional(),
  budget_amount:  z.coerce.number().positive().max(10_000_000),
  brief:          z.string().trim().min(1).max(5000),
  attachments:    z.array(z.string().url()).max(10).nullable().optional(),
});
