// Split out of route.ts — see app/api/bookings/direct/schema.ts's header
// comment for why a route.ts file can't export this itself (next build's
// route-type check rejects any export beyond GET/POST/.../runtime/etc).
//
// Scoped to the PROFILE_FIELDS route.ts writes directly through `pick()` —
// talentProfileData/brandProfileData/categoryIds go through the provider
// layer's own schemas (features/profiles/validation/config-schemas.ts) and
// aren't touched here. Before this, `pick()` copied whatever type showed up
// (a number, an object, an unbounded string) straight into the `profiles`
// upsert with zero shape/length check.
import { z } from "zod";

export const profileDataSchema = z.object({
  handle:       z.string().trim().min(2).max(40).optional(),
  full_name:    z.string().trim().min(1).max(100).optional(),
  avatar_url:   z.string().trim().max(2000).nullable().optional(),
  city:         z.string().trim().max(60).nullable().optional(),
  bio:          z.string().trim().max(1000).nullable().optional(),
  phone_number: z.string().trim().max(20).nullable().optional(),
  phone:        z.string().trim().max(20).nullable().optional(),
});
