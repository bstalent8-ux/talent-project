export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { notifyAdminNewSupportTicket } from "@/lib/notifications/events";
import { rateLimit, tooManyRequests, clientIp, isHoneypotTripped } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "hello@talents.com";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  subject: z.string().trim().min(1).max(300),
  message: z.string().trim().min(1).max(10000),
  type: z.enum(["brand", "talent", "other"]).catch("other"),
});

// The contact form is public and unauthenticated — its values must never be
// interpolated raw into the notification email's HTML body.
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;")
   .replace(/</g, "&lt;")
   .replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;")
   .replace(/'/g, "&#39;");

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Silent success for obvious bots (hidden field a human never sees).
  if (isHoneypotTripped(body)) return NextResponse.json({ success: true });

  const ip = clientIp(req);
  const { ok } = await rateLimit(`contact:${ip}`, { windowSeconds: 600, max: 5 });
  if (!ok) return tooManyRequests();

  if (!(await verifyTurnstile(body["cf-turnstile-response"] ?? body.turnstileToken, ip))) {
    return NextResponse.json({ error: "captcha_failed" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const badEmail = parsed.error.issues.some((i) => i.path[0] === "email");
    return NextResponse.json({ error: badEmail ? "invalid email" : "missing required fields" }, { status: 400 });
  }
  const { name, email, subject, message, type: safeType } = parsed.data;

  // Save to DB
  const { error: dbErr } = await adminClient.from("contact_messages").insert({
    name:    name.trim(),
    email:   email.trim(),
    type:    safeType,
    subject: subject.trim(),
    message: message.trim(),
  });

  if (dbErr) {
    console.error("[contact] db error:", dbErr.message);
    return NextResponse.json({ error: "failed to save message" }, { status: 500 });
  }

  // Same in-app admin notification the quick ticket modal fires — this was
  // previously silent (Resend-only, and only when RESEND_API_KEY was set),
  // so a submission here could sit unseen for days.
  notifyAdminNewSupportTicket({ email, page: null }).catch((e) => {
    console.error("[contact] admin notify failed:", e);
  });

  // Send email via Resend (optional — only if RESEND_API_KEY is configured)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization":  `Bearer ${resendKey}`,
          "Content-Type":   "application/json",
        },
        body: JSON.stringify({
          from:    `Talents Platform <noreply@talent-s.com>`,
          to:      [CONTACT_EMAIL],
          subject: `[Contact] ${subject.trim()}`,
          html:    `
            <h2>New Contact Message</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Type:</strong> ${escapeHtml(safeType)}</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <hr/>
            <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
          `,
        }),
      });
    } catch (e) {
      // Non-fatal — message already saved to DB
      console.error("[contact] resend error:", e);
    }
  }

  return NextResponse.json({ success: true });
}
