"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BlockedPage() {
  const params = useSearchParams();
  const reason = params.get("reason");
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("site_theme");
    setDark(stored !== "light");
  }, []);

  const BG     = dark ? "#050B12" : "#F1F5F9";
  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const RED    = "#EF4444";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: BG, fontFamily: "'Cairo', sans-serif", padding: 24,
    }}>
      <div style={{
        backgroundColor: CARD, border: `1px solid ${BORDER}`,
        borderRadius: 20, padding: "48px 40px", maxWidth: 480, width: "100%",
        textAlign: "center",
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          backgroundColor: "rgba(239,68,68,0.1)",
          border: "2px solid rgba(239,68,68,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: 32,
        }}>
          🚫
        </div>

        <h1 style={{ color: RED, fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
          تم تعليق حسابك
        </h1>
        <p style={{ color: TEXT, fontSize: 15, marginBottom: 8 }}>
          Your account has been suspended
        </p>

        {reason && (
          <div style={{
            backgroundColor: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10, padding: "12px 16px",
            marginTop: 20, marginBottom: 20,
          }}>
            <p style={{ color: MUTED, fontSize: 12, marginBottom: 4 }}>السبب / Reason:</p>
            <p style={{ color: TEXT, fontSize: 13 }}>{reason}</p>
          </div>
        )}

        <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.8, marginTop: 20 }}>
          إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الدعم.<br />
          If you believe this is a mistake, please contact support.
        </p>

        <a
          href="mailto:support@talents-platform.com"
          style={{
            display: "inline-block", marginTop: 20,
            color: "#60A5FA", fontSize: 13, textDecoration: "underline",
          }}
        >
          support@talents-platform.com
        </a>

        <div style={{ marginTop: 32, borderTop: `1px solid ${BORDER}`, paddingTop: 24 }}>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "transparent",
              border: `1px solid ${BORDER}`,
              borderRadius: 10, padding: "10px 24px",
              color: MUTED, fontSize: 14, cursor: "pointer",
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            تسجيل الخروج / Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
