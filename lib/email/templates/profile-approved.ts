// Congratulations email sent the moment an admin approves a talent's
// listing — the same event that fires notifyProfileApproved() in-app.
// Encourages finishing the profile (photos/portfolio/packages) since an
// approved-but-thin profile still won't show up in Explore — see
// lib/profile-completion.ts's COMPLETION_THRESHOLDS.appearInSearch.

import { escapeHtml } from "@/lib/email/escapeHtml";

export function profileApprovedEmail(lang: "ar" | "en", name: string): { subject: string; html: string } {
  // `name` is a talent's own profiles.full_name — user-controlled, no
  // format restriction at signup. Escaped before interpolation so it's
  // always treated as text, never as markup (S-2 fix, 2026-08-31).
  const displayName = escapeHtml(name?.trim() || (lang === "ar" ? "بطلنا" : "there"));

  if (lang === "ar") {
    return {
      subject: "🎉 تمت الموافقة على بروفايلك في Talents",
      html: `
        <div dir="rtl" style="font-family:'Segoe UI',Tahoma,sans-serif; max-width:520px; margin:0 auto; color:#0f172a;">
          <h2 style="color:#0f766e;">مبروك يا ${displayName}! 🎉</h2>
          <p style="font-size:15px; line-height:1.8;">
            بروفايلك اتوافق عليه وبقى ظاهر رسمياً على منصة <b>Talents</b>. من دلوقتي البراندات
            تقدر تشوفك وتبعتلك عروض تعاون مباشرة.
          </p>
          <p style="font-size:15px; line-height:1.8;">
            عشان تظهر في نتائج البحث وتوصلك عروض أكتر، كمّل بروفايلك: ضيف صور/فيديوهات
            بورتفوليو، باقاتك وأسعارك، وبياناتك الشخصية.
          </p>
          <p style="margin:28px 0;">
            <a href="https://talent-s.com/profile/me"
               style="background:#0f766e; color:#fff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:700; display:inline-block;">
              كمّل بروفايلك الآن
            </a>
          </p>
          <p style="font-size:12.5px; color:#64748b;">
            تابعنا عشان توصلك آخر الفرص أول بأول.
          </p>
        </div>
      `,
    };
  }

  return {
    subject: "🎉 Your Talents profile has been approved",
    html: `
      <div style="font-family:'Segoe UI',Tahoma,sans-serif; max-width:520px; margin:0 auto; color:#0f172a;">
        <h2 style="color:#0f766e;">Congrats, ${displayName}! 🎉</h2>
        <p style="font-size:15px; line-height:1.8;">
          Your profile has been approved and is now live on <b>Talents</b>. Brands can
          discover you and send direct collaboration offers starting now.
        </p>
        <p style="font-size:15px; line-height:1.8;">
          To show up in search and get more offers, finish your profile: add
          portfolio photos/videos, your packages and prices, and your details.
        </p>
        <p style="margin:28px 0;">
          <a href="https://talent-s.com/profile/me"
             style="background:#0f766e; color:#fff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:700; display:inline-block;">
            Complete your profile now
          </a>
        </p>
        <p style="font-size:12.5px; color:#64748b;">
          Follow along so you don't miss new opportunities.
        </p>
      </div>
    `,
  };
}
