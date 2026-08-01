"use client";

import { useSite } from "@/contexts/SiteContext";

const TX = {
  ar: { hint: "اختر محادثة لبدء الدردشة" },
  en: { hint: "Select a conversation to start chatting" },
};

export default function EmptyThread() {
  const { lang } = useSite();
  const tx = TX[lang] ?? TX.ar;

  return (
    <div style={{
      flex: 1, height: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 12,
    }}>
      <span style={{ fontSize: 48 }}>💬</span>
      <p style={{ margin: 0, fontSize: 16, color: "#64748b" }}>
        {tx.hint}
      </p>
    </div>
  );
}
