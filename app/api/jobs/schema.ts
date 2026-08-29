// Split out of route.ts — see app/api/bookings/direct/schema.ts's header
// comment for why a route.ts file can't export this itself (next build's
// route-type check rejects any export beyond GET/POST/.../runtime/etc).
import { z } from "zod";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Real client (app/(main)/jobs/create) always sends numbers-or-null for the
// budget/slots fields and "YYYY-MM-DD"-or-null for the dates — this was
// entirely unvalidated server-side before (only `title` was checked), so a
// direct caller could post a negative budget, thousands of slots, or a
// multi-megabyte description straight into a public listing.
export const createJobSchema = z.object({
  title:       z.string().trim().min(3).max(120),
  description: z.string().trim().max(5000).nullable().optional(),
  category:    z.string().trim().max(60).nullable().optional(),
  budget_min:  z.number().nonnegative().max(10_000_000).nullable().optional(),
  budget_max:  z.number().nonnegative().max(10_000_000).nullable().optional(),
  currency:    z.string().trim().max(10).default("EGP"),
  start_date:  z.string().regex(DATE_ONLY).nullable().optional(),
  end_date:    z.string().regex(DATE_ONLY).nullable().optional(),
  slots:       z.number().int().positive().max(50).default(1),
}).refine(
  (d) => d.budget_min == null || d.budget_max == null || d.budget_min <= d.budget_max,
  { message: "budget_min must be less than or equal to budget_max", path: ["budget_min"] },
);
