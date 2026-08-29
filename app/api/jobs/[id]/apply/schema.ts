// Split out of route.ts — see app/api/bookings/direct/schema.ts's header
// comment for why a route.ts file can't export this itself (next build's
// route-type check rejects any export beyond GET/POST/.../runtime/etc).
import { z } from "zod";

// Real client (ApplyModal.tsx) always sends proposed_price/message and
// either omits delivery_days/portfolio_links or sends null — nothing here
// existed before this pass, so a direct/malicious caller could post an
// unbounded message, a NaN price (Number("garbage") swallowed silently),
// or arbitrary non-URL junk into portfolio_links.
export const applySchema = z.object({
  message:         z.string().trim().min(1).max(2000),
  proposed_price:  z.number().positive().max(10_000_000),
  delivery_days:   z.number().int().positive().max(365).nullable().optional(),
  portfolio_links: z.array(z.string().url()).max(10).nullable().optional(),
});
