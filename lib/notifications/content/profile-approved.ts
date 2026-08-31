// Pure content builder — no server-only imports, so this is safe to import
// from both the actual send path (lib/notifications/events.ts's
// notifyProfileApproved, kind: "talent" | "brand") and the admin approve
// popup's live preview (app/(admin)/admin/talents/_components/
// TalentsTable.tsx). Single source of truth: what the admin previews is
// byte-identical to what gets sent, since both call this same function.
export function profileApprovedNotificationContent(lang: "ar" | "en"): { title: string; message: string } {
  return lang === "ar"
    ? {
        title: "تمت الموافقة 🎉",
        message: "ملفك اتوافق عليه وبقى ظاهر للبراندات. كمّل بياناتك وصور البورتفوليو عشان تظهر في البحث وتوصلك عروض أكتر.",
      }
    : {
        title: "Approved 🎉",
        message: "Your profile is approved and visible to brands. Finish your details and portfolio photos to show up in search and get more offers.",
      };
}
