// Generic transactional email sender — thin fetch-based wrapper around
// Resend's REST API, same pattern lib/email-otp.ts already uses (edge-safe,
// no Node APIs, no "resend" npm package). Server-only.
//
// Never throws — mirrors lib/notifications/service.ts's posture: a failed
// email must never break the flow that triggered it (an admin approving a
// talent shouldn't 500 because Resend is down). Callers get an honest
// success/failure signal back instead.

const SENDER = "Talents Platform <noreply@talent-s.com>";

export function emailSendingConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  if (!emailSendingConfigured()) {
    console.error("[email] RESEND_API_KEY not set — skipped:", input.subject);
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
      return { ok: false, error: `email send failed (${res.status})` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] send threw", e);
    return { ok: false, error: "email send failed" };
  }
}
