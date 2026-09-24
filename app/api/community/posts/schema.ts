// Split out of route.ts — same reason as app/api/jobs/schema.ts (next build's
// route-type check rejects any export beyond GET/POST/.../runtime from a
// route.ts file).
import { z } from "zod";

export const createOfferSchema = z.object({
  post_type:  z.literal("offer"),
  title:      z.string().trim().min(3).max(120),
  content:    z.string().trim().max(5000).nullable().optional(),
  category:   z.string().trim().max(60).nullable().optional(),
  price:      z.number().nonnegative().max(10_000_000).nullable().optional(),
  media_url:  z.string().trim().url().max(2000).nullable().optional(),
  // The talent's own "apply by" date — nullable/omitted means open-ended.
  expires_at: z.string().datetime().nullable().optional(),
});

export const createStorySchema = z.object({
  post_type: z.literal("story"),
  content:   z.string().trim().max(500).nullable().optional(),
  media_url: z.string().trim().url().max(2000).nullable().optional(),
}).refine((d) => Boolean(d.content?.trim()) || Boolean(d.media_url), {
  message: "a story needs either text or an image",
  path: ["content"],
});

export const createPostSchema = z.discriminatedUnion("post_type", [createOfferSchema, createStorySchema]);

export const applyToOfferSchema = z.object({
  message:        z.string().trim().min(1).max(2000),
  proposed_price: z.number().positive().max(10_000_000).nullable().optional(),
});
