"use client";
import { useState } from "react";
import { Phone, X } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { toDisplayPhone, toTelLink, toWhatsAppLink } from "@/lib/leads/phone-links";

const TX = {
  ar: { whatsapp: "واتساب", call: "اتصال", callTitle: "اتصل بالرقم", callNow: "اتصل دلوقتي", close: "إغلاق" },
  en: { whatsapp: "WhatsApp", call: "Call", callTitle: "Call this number", callNow: "Call now", close: "Close" },
};

// Opens wa.me in a new tab — same as any other outbound link, no special
// handling needed either on mobile or desktop. `name` (when given) fills a
// default greeting into WhatsApp's own message box — the admin can still
// edit or clear it before sending, wa.me only pre-fills, never auto-sends.
export function LeadWhatsAppButton({ phone, size = 18, name }: { phone: string; size?: number; name?: string | null }) {
  const { lang } = useSite();
  const t = TX[lang];
  const greeting = name
    ? (lang === "ar" ? `مرحباً ${name}،` : `Hi ${name},`)
    : undefined;
  return (
    <a
      href={toWhatsAppLink(phone, greeting)}
      target="_blank"
      rel="noopener noreferrer"
      title={t.whatsapp}
      onClick={(e) => e.stopPropagation()}
      style={{ display: "flex", flexShrink: 0 }}
    >
      {/* Explicit CSS width/height (not just the HTML attributes) so the
          rendered size is pinned regardless of the image's decode timing or
          any ancestor flex/grid stretching it — was inconsistent row-to-row
          in the talents table without this. */}
      <img
        src="/assets/whatsapp-icon.png"
        alt={t.whatsapp}
        width={size}
        height={size}
        style={{ display: "block", width: size, height: size, flexShrink: 0 }}
      />
    </a>
  );
}

// On mobile (viewport-based, same convention as useIsMobile() everywhere
// else in the codebase) a `tel:` href reliably opens the native dialer, so
// we jump straight there. Desktop browsers usually have no call handler and
// silently do nothing on `tel:`, so there we show the number big instead —
// the fallback the user asked for, not an attempt to detect dialer failure
// (the browser gives no signal for that).
export function LeadCallButton({ phone, size = 15 }: { phone: string; size?: number }) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const TEXT = dark ? "#F5EEDB" : "#2B211D";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (isMobile) {
      window.location.href = toTelLink(phone);
    } else {
      setOpen(true);
    }
  }

  return (
    <>
      <button
        type="button"
        title={t.call}
        onClick={handleClick}
        style={{ display: "flex", background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--color-primary-text)" }}
      >
        <Phone size={size} />
      </button>

      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, width: "100%", maxWidth: 360, padding: 24, textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: MUTED }}>{t.callTitle}</p>
            <p style={{ margin: "0 0 20px", fontSize: 32, fontWeight: 800, color: TEXT, direction: "ltr" }}>{toDisplayPhone(phone)}</p>
            <a
              href={toTelLink(phone)}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 10, backgroundColor: "#087F83", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
            >
              <Phone size={16} />{t.callNow}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
