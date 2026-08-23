// ─── Business events (SERVER ONLY) ───────────────────────────────────────────
// Named wrappers for events that have server-side context worth attaching
// (ids already resolved by the calling route) — mirrors
// lib/notifications/events.ts. Client-originated events (page_view,
// talent_profile_view, search, signup, login) carry no extra server-side
// enrichment, so they go straight through logEvent from app/api/events/route.ts
// instead of a pass-through wrapper here.

import { logEvent } from "./service";

// These two fire from authenticated server routes with no browser
// session_id in scope — session_id exists to correlate GUEST events, so a
// signed-in user's own id satisfies the NOT NULL column without inventing a
// fake browser session.
//
// Meta Pixel mapping — deliberately internal-only for V1 (see the
// pre-migration audit, item 6, option B). The Pixel is a client-side
// snippet (window.fbq); there is no server-side fbq to call from these
// routes, and faking one would mean either duplicating this exact insert
// from a client success handler (double-counting risk) or standing up
// Meta's Conversions API (a real server-to-server integration, not a config
// flag). Neither is done here. When conversion tracking for bookings/job
// applications is actually needed, wire the Conversions API as its own
// task — do not bolt a client-side fbq call onto these server routes.

export async function logBookingBriefSent(input: {
  brandId:      string;
  bookingId:    string;
  talentUserId: string;
}): Promise<void> {
  await logEvent({
    eventName:  "booking_brief_sent",
    userId:     input.brandId,
    sessionId:  input.brandId,
    targetType: "booking",
    targetId:   input.bookingId,
    metadata:   { talent_user_id: input.talentUserId },
  });
}

export async function logJobApplication(input: {
  talentId:      string;
  jobId:         string;
  applicationId: string;
}): Promise<void> {
  await logEvent({
    eventName:  "job_application",
    userId:     input.talentId,
    sessionId:  input.talentId,
    targetType: "job",
    targetId:   input.jobId,
    metadata:   { application_id: input.applicationId },
  });
}
