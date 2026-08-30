// Generic transactional email sender — thin fetch-based wrapper around
// Resend's REST API, same pattern lib/email-otp.ts already uses (edge-safe,
// no Node APIs, no "resend" npm package). Server-only.
//
// Never throws — mirrors lib/notifications/service.ts's posture: a failed
// email must never break the flow that triggered it (an admin approving a
// talent shouldn't 500 because Resend is down). Callers get an honest
// success/failure signal back instead.
//
// Every send (success or failure) is also logged to email_log — best-effort,
// swallowed on its own if the table isn't there yet (see
// supabase/migrations/20260830_email_log.sql; per CLAUDE.md §6 this must be
// pasted into the Supabase SQL editor by a human before it exists live).
// Backs /admin/emails' history + its "Resend" button.

import { adminClient } from "@/lib/supabase/admin";

const SENDER = "Talents Platform <noreply@talent-s.com>";

export function emailSendingConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /** Groups log rows by which template/flow sent them — "profile_approved",
   * "custom" (admin compose), etc. Purely informational. */
  template?: string;
  /** profiles.id of the recipient, when known — lets the log join back to a
   * name/handle. Optional: an admin can email an address with no account. */
  recipientId?: string | null;
  /** profiles.id of the admin who triggered a manual send, if any. */
  sentBy?: string | null;
}

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string; resendId?: string }> {
  if (!emailSendingConfigured()) {
    console.error("[email] RESEND_API_KEY not set — skipped:", input.subject);
    await logEmail(input, { status: "failed", error: "email not configured" });
    return { ok: false, error: "email not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: SENDER, to: [input.to], subject: input.subject, html: input.html }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[email] send failed", res.status, body.slice(0, 300));
      await logEmail(input, { status: "failed", error: `email send failed (${res.status})` });
      return { ok: false, error: `email send failed (${res.status})` };
    }

    const json = await res.json().catch(() => null) as { id?: string } | null;
    await logEmail(input, { status: "sent", resendId: json?.id ?? null });
    return { ok: true, resendId: json?.id ?? undefined };
  } catch (e) {
    console.error("[email] send threw", e);
    await logEmail(input, { status: "failed", error: "email send failed" });
    return { ok: false, error: "email send failed" };
  }
}

async function logEmail(
  input: SendEmailInput,
  outcome: { status: "sent" | "failed"; error?: string | null; resendId?: string | null }
): Promise<void> {
  try {
    await adminClient.from("email_log").insert({
      recipient_email: input.to,
      recipient_id:    input.recipientId ?? null,
      subject:         input.subject,
      body_html:       input.html,
      template:        input.template ?? "custom",
      status:          outcome.status,
      error:           outcome.error ?? null,
      resend_id:       outcome.resendId ?? null,
      sent_by:         input.sentBy ?? null,
    });
  } catch (e) {
    // email_log migration not run live yet, or some other write failure —
    // never let logging break the actual email send/response.
    console.error("[email] failed to write email_log", e);
  }
}
