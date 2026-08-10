"use client";
import { useSite } from "@/contexts/SiteContext";

interface Props {
  message?: string;
}

export default function EmptyState({ message }: Props) {
  const { lang } = useSite();
  const defaultMsg = lang === "ar" ? "لا توجد بيانات" : "No data found";

  return (
    <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-muted)", fontSize: 15 }}>
      {message ?? defaultMsg}
    </div>
  );
}
