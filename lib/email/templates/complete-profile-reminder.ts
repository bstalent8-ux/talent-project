// Nudge email for a talent whose profile has zero portfolio photos/videos —
// portfolio is 15/100 of lib/profile-completion.ts's score and one of the
// biggest single levers on crossing COMPLETION_THRESHOLDS.appearInSearch
// (60), so a profile stuck at 0 items is very likely invisible in
// Explore/Home no matter how complete everything else is.
//
// Pure function, no imports — safe to import client-side for an admin
// preview, same reasoning as the other approval templates.

export function completeProfileReminderEmail(lang: "ar" | "en", name: string): { subject: string; html: string } {
  const displayName = name?.trim() || (lang === "ar" ? "بطلنا" : "there");

  if (lang === "ar") {
    return {
      subject: "📸 كمّل بروفايلك عشان تظهر للبراندات",
      html: `
        <div dir="rtl" style="font-family:'Segoe UI',Tahoma,sans-serif; max-width:520px; margin:0 auto; color:#0f172a;">
          <h2 style="color:#0f766e;">فاضلك خطوة يا ${displayName} 📸</h2>
          <p style="font-size:15px; line-height:1.8;">
            بروفايلك على <b>Talents</b> لسه مفهوش أي صور أو فيديوهات بورتفوليو — وده بيقلل فرصتك جداً
            إنك تظهر في نتائج البحث قدام البراندات، حتى لو باقي بياناتك كاملة.
          </p>
          <p style="font-size:15px; line-height:1.8;">
            ادخل بروفايلك دلوقتي وضيف كام صورة/فيديو من شغلك — الخطوة دي وحدها بتفرق كتير في
            ظهورك وفرصك في عروض تعاون جديدة.
          </p>
          <p style="margin:28px 0;">
            <a href="https://talent-s.com/profile/me"
               style="background:#0f766e; color:#fff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:700; display:inline-block;">
              ضيف صور بروفايلك الآن
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
    subject: "📸 Finish your profile so brands can find you",
    html: `
      <div style="font-family:'Segoe UI',Tahoma,sans-serif; max-width:520px; margin:0 auto; color:#0f172a;">
        <h2 style="color:#0f766e;">One step left, ${displayName} 📸</h2>
        <p style="font-size:15px; line-height:1.8;">
          Your Talents profile still has no portfolio photos or videos — that alone makes it much
          less likely to show up in search results for brands, even if everything else is filled in.
        </p>
        <p style="font-size:15px; line-height:1.8;">
          Open your profile now and add a few photos/videos of your work — this one step makes a big
          difference to your visibility and your chances of new collaboration offers.
        </p>
        <p style="margin:28px 0;">
          <a href="https://talent-s.com/profile/me"
             style="background:#0f766e; color:#fff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:700; display:inline-block;">
            Add your photos now
          </a>
        </p>
        <p style="font-size:12.5px; color:#64748b;">
          Follow along so you don't miss new opportunities.
        </p>
      </div>
    `,
  };
}
