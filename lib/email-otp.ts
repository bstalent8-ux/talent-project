// Email OTP — fetch-based Resend call (mirrors app/api/contact's pattern),
// edge-safe (Web Crypto, no Node APIs). Server-only: never import from a
// "use client" file.
import { adminClient } from "@/lib/supabase/admin";

const CODE_TTL_MINUTES = 10;
export const RESEND_COOLDOWN_SECONDS = 45;
const MAX_ATTEMPTS = 5;
const SENDER = "Talents Platform <noreply@talent-s.com>";

export type OtpPurpose = "register" | "login" | "reset_password";

export function emailOtpConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function randomCode(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + (bytes[0] % 900000));
}

async function hashCode(email: string, code: string): Promise<string> {
  const enc = new TextEncoder().encode(`${email.toLowerCase()}:${code}`);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function template(code: string, lang: "ar" | "en", purpose: OtpPurpose) {
  const isReset = purpose === "reset_password";
  if (lang === "ar") {
    return {
      subject: isReset ? "كود إعادة تعيين كلمة المرور" : "كود تفعيل حسابك في Talents",
      html: `<div dir="rtl" style="font-family:sans-serif"><h2>${isReset ? "إعادة تعيين كلمة المرور" : "تفعيل الحساب"}</h2><p>كود التحقق الخاص بك:</p><p style="font-size:28px;font-weight:800;letter-spacing:4px">${code}</p><p>صالح لمدة ${CODE_TTL_MINUTES} دقائق. لو مطلبتش الكود دا، تجاهل الرسالة.</p></div>`,
    };
  }
  return {
    subject: isReset ? "Your password reset code" : "Your Talents account verification code",
    html: `<div style="font-family:sans-serif"><h2>${isReset ? "Reset your password" : "Verify your account"}</h2><p>Your verification code:</p><p style="font-size:28px;font-weight:800;letter-spacing:4px">${code}</p><p>Valid for ${CODE_TTL_MINUTES} minutes. If you didn't request this, ignore this email.</p></div>`,
  };
}

export interface EmailOtpResult {
  ok: boolean;
  error?: string;
  retryAfterSeconds?: number;
}

export async function sendEmailOtp(email: string, lang: "ar" | "en", purpose: OtpPurpose = "register"): Promise<EmailOtpResult> {
  if (!emailOtpConfigured()) return { ok: false, error: "otp not configured" };

  const normalizedEmail = email.trim().toLowerCase();

  const { data: last } = await adminClient
    .from("email_otps")
    .select("created_at")
    .eq("email", normalizedEmail)
    .eq("purpose", purpose)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (last) {
    const elapsed = (Date.now() - new Date(last.created_at).getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      return { ok: false, error: "cooldown", retryAfterSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed) };
    }
  }

  const code = randomCode();
  const codeHash = await hashCode(normalizedEmail, code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString();

  const { error: insertErr } = await adminClient.from("email_otps").insert({
    email: normalizedEmail,
    purpose,
    code_hash: codeHash,
    expires_at: expiresAt,
  });
  if (insertErr) return { ok: false, error: "failed to create code" };

  const { subject, html } = template(code, lang, purpose);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: SENDER, to: [normalizedEmail], subject, html }),
    });
    if (!res.ok) return { ok: false, error: `email send failed (${res.status})` };
  } catch {
    return { ok: false, error: "email send failed" };
  }

  return { ok: true };
}

export async function verifyEmailOtp(email: string, code: string, purpose: OtpPurpose = "register"): Promise<EmailOtpResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: row } = await adminClient
    .from("email_otps")
    .select("id, code_hash, attempts, expires_at, consumed_at")
    .eq("email", normalizedEmail)
    .eq("purpose", purpose)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row || row.consumed_at || new Date(row.expires_at) < new Date()) {
    return { ok: false, error: "expired_or_missing" };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "too_many_attempts" };
  }

  const candidateHash = await hashCode(normalizedEmail, code.trim());
  if (candidateHash !== row.code_hash) {
    await adminClient.from("email_otps").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    return { ok: false, error: "invalid_code" };
  }

  await adminClient.from("email_otps").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);
  return { ok: true };
}

// Used by /api/profile as a server-side defense-in-depth check that a
// register-purpose code was actually verified for this email recently —
// the real gate is the client only calling signUp() after verifyEmailOtp()
// succeeds; this stops a direct /api/profile call from skipping that.
export async function hasRecentVerifiedRegisterOtp(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data } = await adminClient
    .from("email_otps")
    .select("consumed_at")
    .eq("email", normalizedEmail)
    .eq("purpose", "register")
    .not("consumed_at", "is", null)
    .order("consumed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.consumed_at) return false;
  return Date.now() - new Date(data.consumed_at).getTime() < 15 * 60_000;
}

// Supabase's admin API has no "get user by email" lookup, only by id — the
// talent pool is small (dozens, not thousands, same posture as every other
// full-table admin scan in this codebase) so one listUsers() page covers it.
// Used by /api/auth/reset-password/* to turn a verified email back into the
// auth.users id it needs to actually change the password.
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return null;
  const users = data.users as { id: string; email?: string | null }[];
  return users.find((u) => u.email?.toLowerCase() === normalizedEmail)?.id ?? null;
}
