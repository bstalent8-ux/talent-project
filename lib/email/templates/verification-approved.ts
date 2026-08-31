// Congratulations email sent when an admin approves a talent_verifications
// request (ID doc + selfie + social proof) — distinct from
// profile-approved.ts, which is about the *listing* going live. A verified
// badge can land on an already-live (or still-pending) profile, so this
// copy never claims "your profile is now live."
//
// Pure function, no imports — safe to import from the admin approve popup
// (a client component) for live preview, same reasoning as
// profile-approved.ts.

export function verificationApprovedEmail(lang: "ar" | "en", name: string): { subject: string; html: string } {
  const displayName = name?.trim() || (lang === "ar" ? "بطلنا" : "there");

  if (lang === "ar") {
    return {
      subject: "✅ تم توثيق حسابك على Talents",
      html: `
        <div dir="rtl" style="font-family:'Segoe UI',Tahoma,sans-serif; max-width:520px; margin:0 auto; color:#0f172a;">
          <h2 style="color:#0f766e;">مبروك يا ${displayName}! ✅</h2>
          <p style="font-size:15px; line-height:1.8;">
            طلب التوثيق بتاعك اتقبل، وشارة التوثيق الزرقاء بقت ظاهرة على بروفايلك دلوقتي.
            ده بيدي البراندات ثقة أكتر إنك حساب حقيقي وموثوق.
          </p>
          <p style="margin:28px 0;">
            <a href="https://talent-s.com/profile/me"
               style="background:#0f766e; color:#fff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:700; display:inline-block;">
              شوف بروفايلك
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
    subject: "✅ Your Talents account is verified",
    html: `
      <div style="font-family:'Segoe UI',Tahoma,sans-serif; max-width:520px; margin:0 auto; color:#0f172a;">
        <h2 style="color:#0f766e;">Congrats, ${displayName}! ✅</h2>
        <p style="font-size:15px; line-height:1.8;">
          Your verification request has been approved — the blue verified badge
          is now live on your profile. It signals to brands that you're a real,
          trusted account.
        </p>
        <p style="margin:28px 0;">
          <a href="https://talent-s.com/profile/me"
             style="background:#0f766e; color:#fff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:700; display:inline-block;">
            View your profile
          </a>
        </p>
        <p style="font-size:12.5px; color:#64748b;">
          Follow along so you don't miss new opportunities.
        </p>
      </div>
    `,
  };
}
