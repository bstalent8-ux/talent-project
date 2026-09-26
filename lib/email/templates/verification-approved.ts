// Congratulations email sent when an admin approves a talent_verifications
// request (ID doc + selfie + social proof) — distinct from
// profile-approved.ts, which is about the *listing* going live. A verified
// badge can land on an already-live (or still-pending) profile, so this
// copy never claims "your profile is now live."
//
// Pure function, no imports — safe to import from the admin approve popup
// (a client component) for live preview, same reasoning as
// profile-approved.ts.

import { escapeHtml } from "@/lib/email/escapeHtml";
import { emailLayout } from "@/lib/email/layout";

export function verificationApprovedEmail(lang: "ar" | "en", name: string): { subject: string; html: string } {
  // See S-2 note in profile-approved.ts — `name` is user-controlled.
  const displayName = escapeHtml(name?.trim() || (lang === "ar" ? "بطلنا" : "there"));

  if (lang === "ar") {
    return {
      subject: "✅ تم توثيق حسابك على Talents",
      html: emailLayout(lang, `
        <div dir="rtl" style="font-family:'Segoe UI',Tahoma,sans-serif; color:#2B211D;">
          <h2 style="color:#087F83;">مبروك يا ${displayName}! ✅</h2>
          <p style="font-size:15px; line-height:1.8;">
            طلب التوثيق بتاعك اتقبل، وشارة التوثيق الزرقاء بقت ظاهرة على بروفايلك دلوقتي.
            ده بيدي البراندات ثقة أكتر إنك حساب حقيقي وموثوق.
          </p>
          <p style="margin:28px 0;">
            <a href="https://talent-s.com/profile/me"
               style="background:#087F83; color:#fff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:700; display:inline-block;">
              شوف بروفايلك
            </a>
          </p>
          <p style="font-size:12.5px; color:#6E5F55;">
            تابعنا عشان توصلك آخر الفرص أول بأول.
          </p>
        </div>
      `),
    };
  }

  return {
    subject: "✅ Your Talents account is verified",
    html: emailLayout(lang, `
      <div style="font-family:'Segoe UI',Tahoma,sans-serif; color:#2B211D;">
        <h2 style="color:#087F83;">Congrats, ${displayName}! ✅</h2>
        <p style="font-size:15px; line-height:1.8;">
          Your verification request has been approved — the blue verified badge
          is now live on your profile. It signals to brands that you're a real,
          trusted account.
        </p>
        <p style="margin:28px 0;">
          <a href="https://talent-s.com/profile/me"
             style="background:#087F83; color:#fff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:700; display:inline-block;">
            View your profile
          </a>
        </p>
        <p style="font-size:12.5px; color:#6E5F55;">
          Follow along so you don't miss new opportunities.
        </p>
      </div>
    `),
  };
}
