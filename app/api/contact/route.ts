export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "hello@talents.com";

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { name, email, type, subject, message } = body;

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  const validTypes = ["brand", "talent", "other"];
  const safeType = validTypes.includes(type) ? type : "other";

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
          from:    `Talents Platform <noreply@talents.com>`,
          to:      [CONTACT_EMAIL],
          subject: `[Contact] ${subject.trim()}`,
          html:    `
            <h2>New Contact Message</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Type:</strong> ${safeType}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr/>
            <p>${message.replace(/\n/g, "<br/>")}</p>
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
