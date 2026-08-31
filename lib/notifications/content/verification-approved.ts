// Pure content builder — no server-only imports, so this is safe to import
// from both the actual send path (lib/notifications/events.ts's
// notifyProfileApproved, kind: "verification") and the admin approve
// popup's live preview (app/(admin)/admin/verifications/_components/
// VerificationsTable.tsx). Single source of truth: what the admin previews
// is byte-identical to what gets sent, since both call this same function.
export function verificationApprovedNotificationContent(lang: "ar" | "en"): { title: string; message: string } {
  return lang === "ar"
    ? { title: "تمت الموافقة 🎉", message: "طلب التوثيق أصبح معتمدًا وظاهرًا على المنصة." }
    : { title: "Approved 🎉", message: "Your verification is approved and now live on the platform." };
}
