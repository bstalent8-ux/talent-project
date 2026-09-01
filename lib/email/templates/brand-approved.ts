// Congratulations email sent when an admin approves a brand account
// (profiles.brand_status). Distinct from profile-approved.ts, whose copy
// ("brands can discover you...") only makes sense for a talent recipient.
//
// Pure function, no imports — safe to import from an admin approve popup
// for live preview, same reasoning as the other approval templates.

import { escapeHtml } from "@/lib/email/escapeHtml";

export function brandApprovedEmail(lang: "ar" | "en", name: string): { subject: string; html: string } {
  // See S-2 note in profile-approved.ts — `name` is user-controlled.
  const displayName = escapeHtml(name?.trim() || (lang === "ar" ? "صديقنا" : "there"));

  if (lang === "ar") {
    return {
      subject: "🎉 تم قبول حساب شركتك على Talents",
      html: `
        <div dir="rtl" style="font-family:'Segoe UI',Tahoma,sans-serif; max-width:520px; margin:0 auto; color:#0f172a;">
          <h2 style="color:#0f766e;">أهلاً بيك يا ${displayName}! 🎉</h2>
          <p style="font-size:15px; line-height:1.8;">
            حساب شركتك اتوافق عليه وبقى فعّال على منصة <b>Talents</b>. تقدر دلوقتي تستكشف المواهب
            وتبعت عروض تعاون مباشرة للـ UGC Creators والموديلز اللي يناسبوا حملتك.
          </p>
          <p style="margin:28px 0;">
            <a href="https://talent-s.com/explore"
               style="background:#0f766e; color:#fff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:700; display:inline-block;">
              استكشف المواهب الآن
            </a>
          </p>
          <p style="font-size:12.5px; color:#64748b;">
            تابعنا عشان توصلك آخر المواهب والفرص أول بأول.
          </p>
        </div>
      `,
    };
  }

  return {
    subject: "🎉 Your brand account on Talents is approved",
    html: `
      <div style="font-family:'Segoe UI',Tahoma,sans-serif; max-width:520px; margin:0 auto; color:#0f172a;">
        <h2 style="color:#0f766e;">Welcome, ${displayName}! 🎉</h2>
        <p style="font-size:15px; line-height:1.8;">
          Your brand account has been approved and is now active on <b>Talents</b>. You can browse
          talents and send direct collaboration offers to the UGC creators and models that fit your
          campaign.
        </p>
        <p style="margin:28px 0;">
          <a href="https://talent-s.com/explore"
             style="background:#0f766e; color:#fff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:700; display:inline-block;">
            Explore talents now
          </a>
        </p>
        <p style="font-size:12.5px; color:#64748b;">
          Follow along so you don't miss new talents and opportunities.
        </p>
      </div>
    `,
  };
}
