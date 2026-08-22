// Twilio Verify — fetch-based, edge-safe (no SDK, mirrors app/api/contact's
// Resend call). Server-only: never import from a "use client" file.
const BASE = "https://verify.twilio.com/v2";

function authHeader(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  return "Basic " + btoa(`${sid}:${token}`);
}

function serviceUrl(path: string): string {
  return `${BASE}/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}${path}`;
}

export function twilioConfigured(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID);
}

export interface TwilioResult {
  ok: boolean;
  error: string;
}

export async function sendOtp(phone: string): Promise<TwilioResult> {
  const res = await fetch(serviceUrl("/Verifications"), {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: phone, Channel: "sms" }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.message ?? `twilio send failed (${res.status})` };
  }
  return { ok: true, error: "" };
}

export async function checkOtp(phone: string, code: string): Promise<TwilioResult> {
  const res = await fetch(serviceUrl("/VerificationCheck"), {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: phone, Code: code }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.status !== "approved") {
    return { ok: false, error: !res.ok ? (body.message ?? "verify failed") : "invalid_or_expired" };
  }
  return { ok: true, error: "" };
}
