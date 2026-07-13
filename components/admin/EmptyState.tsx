"use client";
import { useSite } from "@/contexts/SiteContext";

interface Props {
  message?: string;
}

export default function EmptyState({ message }: Props) {
  const { dark, lang } = useSite();
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const defaultMsg = lang === "ar" ? "لا توجد بيانات" : "No data found";

  return (
    <div style={{ textAlign: "center", padding: "60px 24px", color: MUTED, fontSize: 15 }}>
      {message ?? defaultMsg}
    </div>
  );
}
