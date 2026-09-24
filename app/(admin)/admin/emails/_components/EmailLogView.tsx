"use client";
import { useHeldValue, useModalPresence } from "@/hooks/useModalClose";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import EmptyState from "@/components/admin/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AdminEmailLogRow } from "@/features/admin/services/admin.service";
import { escapeHtml } from "@/lib/email/escapeHtml";
import { Mail, RefreshCw, Send, X } from "lucide-react";

const TEMPLATE_LABEL: Record<string, { ar: string; en: string }> = {
  profile_approved:      { ar: "موافقة على البروفايل", en: "Profile approved" },
  verification_approved: { ar: "موافقة على التوثيق",   en: "Verification approved" },
  custom:                { ar: "مخصص", en: "Custom" },
};

const TX = {
  ar: {
    compose: "إرسال إيميل", to: "المستلم", recipient: "المستلمين (اختياري)",
    recipientHint: "دور بالاسم وضيف أكتر من شخص لو عايز، أو سيبه فاضي وحط إيميل يدوي تحت",
    recipientSearchPlaceholder: "دور بالاسم أو اليوزرنيم...",
    recipientNoResults: "مفيش نتايج",
    recipientClear: "شيل",
    email: "الإيميل", subject: "الموضوع", body: "المحتوى (HTML)",
    send: "إرسال", sendingProgress: "بيتبعت (@sent/@total)...", cancel: "إلغاء",
    partialFail: "اتبعت لـ @sent من @total. اللي فشل لسه في القايمة، جرب تاني:",
    recipientCol: "المستلم", subjectCol: "الموضوع", templateCol: "النوع",
    statusCol: "الحالة", dateCol: "التاريخ",
    sent: "اتبعت", failed: "فشل",
    resend: "إعادة إرسال", resending: "بيتبعت تاني...",
    noEmails: "لسه مفيش إيميلات اتبعتت", emails: "إيميل",
    close: "إغلاق", error: "الخطأ",
  },
  en: {
    compose: "Send Email", to: "Recipient", recipient: "Recipients (optional)",
    recipientHint: "Search by name and add as many as you like, or leave blank and type an email manually below",
    recipientSearchPlaceholder: "Search by name or handle...",
    recipientNoResults: "No results",
    recipientClear: "Remove",
    email: "Email", subject: "Subject", body: "Body (HTML)",
    send: "Send", sendingProgress: "Sending (@sent/@total)...", cancel: "Cancel",
    partialFail: "Sent to @sent of @total. The failed ones are still listed — try again:",
    recipientCol: "Recipient", subjectCol: "Subject", templateCol: "Type",
    statusCol: "Status", dateCol: "Date",
    sent: "Sent", failed: "Failed",
    resend: "Resend", resending: "Resending...",
    noEmails: "No emails sent yet", emails: "emails",
    close: "Close", error: "Error",
  },
};

interface Props {
  emails:   AdminEmailLogRow[];
  total:    number;
  page:     number;
  pageSize: number;
}

function hrefFor(page: number) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  return `/admin/emails?${params.toString()}`;
}

export default function EmailLogView({ emails, total, page, pageSize }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [selected, setSelected] = useState<AdminEmailLogRow | null>(null);
  const { value: selectedHeld, closing: selectedClosing } = useHeldValue(selected);
  const [composing, setComposing] = useState(false);
  const { mounted: composingMounted, closing: composingClosing } = useModalPresence(composing);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [form, setForm] = useState({ to: "", subject: "", html: "" });
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0 });
  const [sendError, setSendError] = useState<string | null>(null);

  // Recipient picker — search-by-name instead of the raw profiles.id text box
  // this used to be. Typing a name/handle in there always 404'd server-side
  // (getUserById on a non-UUID), and that 404 happens before sendEmail() ever
  // logs anything, so failed sends here used to silently vanish with no row
  // in the history at all — this replaces the guesswork with the same
  // search endpoint the notification composer already uses.
  //
  // Multi-recipient: an admin composing a real announcement isn't going to
  // remember everyone's exact registered email — they pick people by name,
  // one at a time, same email/subject fanned out to all of them, each
  // getting its own /api/admin/emails call and its own email_log row (same
  // as sending them individually N times, just batched from one form).
  type RecipientOption = { id: string; full_name: string | null; handle: string | null };
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientResults, setRecipientResults] = useState<RecipientOption[]>([]);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<RecipientOption[]>([]);
  const recipientSearchSeq = useRef(0);
  // A blur schedules closing the dropdown 150ms later (so a click on a
  // result registers before the input's blur would otherwise hide it
  // first). Without cancelling that timer on the next focus, a quick
  // blur-then-refocus (e.g. clicking the field again right after typing)
  // leaves the stale timer armed — it fires after the refocus and closes
  // a dropdown that just legitimately reopened, even though recipientOpen
  // was correctly set back to true.
  const recipientBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!recipientOpen) return;
    const query = recipientQuery.trim();
    if (!query) { setRecipientResults([]); return; }

    const seq = ++recipientSearchSeq.current;
    const timer = setTimeout(async () => {
      setRecipientLoading(true);
      try {
        const res = await fetch(`/api/admin/notifications/recipients?q=${encodeURIComponent(query)}`);
        const json = await res.json().catch(() => ({}));
        if (seq === recipientSearchSeq.current) setRecipientResults(json.users ?? []);
      } catch {
        if (seq === recipientSearchSeq.current) setRecipientResults([]);
      } finally {
        if (seq === recipientSearchSeq.current) setRecipientLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [recipientQuery, recipientOpen]);

  function pickRecipient(user: RecipientOption) {
    setSelectedRecipients((prev) => (prev.some((p) => p.id === user.id) ? prev : [...prev, user]));
    setRecipientQuery("");
    setRecipientOpen(false);
    setRecipientResults([]);
  }

  function removeRecipient(id: string) {
    setSelectedRecipients((prev) => prev.filter((p) => p.id !== id));
  }

  function closeCompose() {
    if (recipientBlurTimer.current) clearTimeout(recipientBlurTimer.current);
    setComposing(false);
    setForm({ to: "", subject: "", html: "" });
    setSelectedRecipients([]);
    setRecipientQuery("");
    setSendError(null);
    setSendProgress({ sent: 0, total: 0 });
  }

  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const TEXT = dark ? "#F5EEDB" : "#2B211D";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";
  const TH = dark ? "#261C18" : "#F1E8D2";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const cellStyle: React.CSSProperties = { padding: "12px 14px", color: TEXT, fontSize: 13, borderBottom: `1px solid ${BORDER}` };
  const thStyle: React.CSSProperties = { padding: "10px 14px", color: MUTED, fontSize: 12, fontWeight: 600, textAlign: ar ? "right" : "left", backgroundColor: TH, borderBottom: `1px solid ${BORDER}` };

  async function resend(id: string) {
    setResendingId(id);
    await fetch(`/api/admin/emails/${id}/resend`, { method: "POST" }).catch(() => {});
    setResendingId(null);
    router.refresh();
  }

  async function submitCompose() {
    // One target per selected account, plus the manual email field if it's
    // filled in too (they're additive, not either/or, now that there can be
    // several account recipients already).
    const targets: { kind: "recipient" | "manual"; recipient?: RecipientOption; email?: string }[] = [
      ...selectedRecipients.map((r) => ({ kind: "recipient" as const, recipient: r })),
      ...(form.to.trim() ? [{ kind: "manual" as const, email: form.to.trim() }] : []),
    ];
    if (!targets.length) return;

    setSending(true);
    setSendError(null);
    setSendProgress({ sent: 0, total: targets.length });

    const outcomes = await Promise.all(
      targets.map(async (target) => {
        const res = await fetch("/api/admin/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientId: target.recipient?.id,
            to: target.email,
            subject: form.subject,
            html: form.html,
          }),
        });
        setSendProgress((p) => ({ ...p, sent: p.sent + 1 }));
        if (res.ok) return { target, ok: true as const };
        const json = await res.json().catch(() => ({}));
        return { target, ok: false as const, error: json.error ?? "send failed" };
      })
    );

    setSending(false);
    const failed = outcomes.filter((o) => !o.ok);

    if (!failed.length) {
      closeCompose();
      router.refresh();
      return;
    }

    // Leave only the failed targets in the form so retrying doesn't re-send
    // to people it already reached.
    const failedIds = new Set(failed.filter((f) => f.target.kind === "recipient").map((f) => f.target.recipient!.id));
    setSelectedRecipients((prev) => prev.filter((r) => failedIds.has(r.id)));
    if (!failed.some((f) => f.target.kind === "manual")) setForm((f) => ({ ...f, to: "" }));

    const names = failed.map((f) => f.target.recipient?.full_name ?? f.target.recipient?.handle ?? f.target.email).join(", ");
    setSendError(
      t.partialFail.replace("@sent", String(outcomes.length - failed.length)).replace("@total", String(outcomes.length)) +
        " " + names
    );
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: 8, border: `1px solid ${BORDER}`,
    backgroundColor: dark ? "#261C18" : "#F1E8D2",
    color: TEXT, padding: 10, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = { color: MUTED, fontSize: 12, display: "block", marginBottom: 6 };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: MUTED, fontSize: 12 }}>{total} {t.emails}</span>
        <button
          onClick={() => setComposing(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
        >
          <Send size={13} />{t.compose}
        </button>
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        {emails.length === 0 ? <EmptyState message={t.noEmails} /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t.recipientCol}</th>
                  <th style={thStyle}>{t.subjectCol}</th>
                  <th style={thStyle}>{t.templateCol}</th>
                  <th style={thStyle}>{t.statusCol}</th>
                  <th style={thStyle}>{t.dateCol}</th>
                  <th style={thStyle} />
                </tr>
              </thead>
              <tbody>
                {emails.map((e) => {
                  const tpl = TEMPLATE_LABEL[e.template] ?? { ar: e.template, en: e.template };
                  return (
                    <tr key={e.id} onClick={() => setSelected(e)} style={{ cursor: "pointer" }}>
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 600 }}>{e.recipientName ?? e.recipientEmail}</div>
                        {e.recipientName && <div style={{ color: MUTED, fontSize: 11 }}>{e.recipientEmail}</div>}
                      </td>
                      <td style={cellStyle}>{e.subject}</td>
                      <td style={cellStyle}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: "rgba(8,127,131,0.14)", color: "var(--color-primary-text)" }}>
                          {tpl[lang]}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          backgroundColor: e.status === "sent" ? "rgba(8,127,131,0.15)" : "rgba(239,68,68,0.15)",
                          color: e.status === "sent" ? "#087F83" : "#EF4444",
                        }}>
                          {e.status === "sent" ? t.sent : t.failed}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, color: MUTED, whiteSpace: "nowrap" }}>
                        {new Date(e.createdAt).toLocaleString(ar ? "ar-EG" : "en-US")}
                      </td>
                      <td style={{ ...cellStyle, width: 1 }}>
                        <button
                          disabled={resendingId === e.id}
                          onClick={(ev) => { ev.stopPropagation(); resend(e.id); }}
                          title={t.resend}
                          aria-label={t.resend}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", display: "flex", padding: 4 }}
                        >
                          <RefreshCw size={15} className={resendingId === e.id ? "spin" : undefined} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination page={page} totalPages={totalPages} buildHref={hrefFor} />

      {selectedHeld && (
        <div className="modal-backdrop" data-state={selectedClosing ? "closing" : "open"}
          onClick={() => setSelected(null)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(27,19,16,0.62)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, width: "min(560px, 100%)", maxHeight: "85vh", overflowY: "auto", padding: 20 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <h2 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: 0 }}>{selectedHeld.subject}</h2>
                <div style={{ color: MUTED, fontSize: 12.5, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <Mail size={12} />{selectedHeld.recipientEmail}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}>
                <X size={18} />
              </button>
            </div>

            {selectedHeld.status === "failed" && selectedHeld.error && (
              <div style={{ marginBottom: 14, padding: 10, borderRadius: 8, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <p style={{ color: "#EF4444", fontSize: 11, fontWeight: 700, margin: "0 0 4px" }}>{t.error}</p>
                <p style={{ color: TEXT, fontSize: 12, margin: 0 }}>{selectedHeld.error}</p>
              </div>
            )}

            {/* S-6 fix (2026-08-31), refined (2026-09-02): the original fix
                escaped every row's body_html to plain text, which closed the
                XSS hole but made every "sent" preview unreadable — the admin
                just sees literal &lt;div&gt; markup instead of the actual
                email (reported live: opening a profile_approved row showed
                raw escaped source, not the message).

                The real risk was always narrower than "all rows": a
                template-generated row (profile_approved, verification_
                approved, complete_profile_reminder, ...) is safe to render
                as real HTML, because S-2 already escapes the one
                interpolated value (the recipient's name) before the
                template function ever returns it — the stored body_html
                cannot contain a live <script>/<img onerror> no matter what
                the name was. Only `template === "custom"` rows are actually
                dangerous: that's the admin's own free-text HTML from the
                compose form below, and POST /api/admin/emails stores it
                completely unsanitized (intentionally — the real send is
                supposed to render as real HTML in the recipient's inbox).
                Replaying THAT back into another admin's browser via
                dangerouslySetInnerHTML is what S-6 needed to stop.

                So: template rows render as real HTML (readable, matches
                what was actually sent); custom rows keep the escaped-text
                fallback from the original fix. */}
            {selectedHeld.template === "custom" ? (
              <div
                style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, backgroundColor: dark ? "#261C18" : "#F1E8D2", whiteSpace: "pre-wrap", wordBreak: "break-word", color: TEXT, fontSize: 13 }}
              >
                {escapeHtml(selectedHeld.bodyHtml)}
              </div>
            ) : (
              <div
                style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, backgroundColor: dark ? "#261C18" : "#F1E8D2", color: TEXT, fontSize: 13 }}
                dangerouslySetInnerHTML={{ __html: selectedHeld.bodyHtml }}
              />
            )}

            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button
                disabled={resendingId === selectedHeld.id}
                onClick={() => resend(selectedHeld.id)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
              >
                <RefreshCw size={13} />{resendingId === selectedHeld.id ? t.resending : t.resend}
              </button>
            </div>
          </div>
        </div>
      )}

      {composingMounted && (
        <div className="modal-backdrop" data-state={composingClosing ? "closing" : "open"}
          onClick={() => !sending && closeCompose()}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(27,19,16,0.62)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, width: "min(560px, 100%)", maxHeight: "85vh", overflowY: "auto", padding: 20 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: 0 }}>{t.compose}</h2>
              <button onClick={closeCompose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <label style={labelStyle}>{t.recipient}</label>
                {selectedRecipients.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {selectedRecipients.map((r) => (
                      <span
                        key={r.id}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: dark ? "#261C18" : "#F1E8D2", border: `1px solid ${BORDER}`, borderRadius: 999, padding: "4px 6px 4px 10px", fontSize: 12.5, color: TEXT }}
                      >
                        {r.full_name ?? r.handle ?? r.id}
                        {r.handle && <span style={{ color: MUTED }}>· @{r.handle}</span>}
                        <button type="button" onClick={() => removeRecipient(r.id)} aria-label={t.recipientClear} disabled={sending} style={{ background: "none", border: "none", cursor: sending ? "default" : "pointer", color: MUTED, display: "flex", padding: 0 }}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  value={recipientQuery}
                  onChange={(e) => { setRecipientQuery(e.target.value); setRecipientOpen(true); }}
                  onFocus={() => {
                    if (recipientBlurTimer.current) clearTimeout(recipientBlurTimer.current);
                    setRecipientOpen(true);
                  }}
                  onBlur={() => {
                    recipientBlurTimer.current = setTimeout(() => setRecipientOpen(false), 150);
                  }}
                  placeholder={t.recipientSearchPlaceholder}
                  disabled={sending}
                  style={inputStyle}
                />
                {recipientOpen && recipientQuery.trim() && (
                  <div style={{ position: "absolute", top: "100%", insetInlineStart: 0, insetInlineEnd: 0, marginTop: 4, backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, maxHeight: 220, overflowY: "auto", zIndex: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}>
                    {recipientLoading ? (
                      <div style={{ padding: 10, color: MUTED, fontSize: 12.5 }}>…</div>
                    ) : recipientResults.length ? (
                      recipientResults.map((u) => (
                        <button
                          type="button"
                          key={u.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickRecipient(u)}
                          style={{ display: "block", width: "100%", textAlign: ar ? "right" : "left", padding: "8px 10px", background: "none", border: "none", cursor: "pointer", color: TEXT, fontSize: 13 }}
                        >
                          {u.full_name ?? u.handle ?? u.id}
                          {u.handle && <span style={{ color: MUTED }}> · @{u.handle}</span>}
                        </button>
                      ))
                    ) : (
                      <div style={{ padding: 10, color: MUTED, fontSize: 12.5 }}>{t.recipientNoResults}</div>
                    )}
                  </div>
                )}
                <p style={{ color: MUTED, fontSize: 11, margin: "4px 0 0" }}>{t.recipientHint}</p>
              </div>
              <div>
                <label style={labelStyle}>{t.email}</label>
                <input value={form.to} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))} placeholder="name@example.com" disabled={sending} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t.subject}</label>
                <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} disabled={sending} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t.body}</label>
                <textarea value={form.html} onChange={(e) => setForm((f) => ({ ...f, html: e.target.value }))} rows={8} disabled={sending} style={{ ...inputStyle, resize: "vertical", direction: "ltr" }} />
              </div>

              {sendError && <p style={{ color: "#EF4444", fontSize: 12, margin: 0 }}>{sendError}</p>}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={closeCompose} disabled={sending} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 12.5, cursor: "pointer" }}>
                  {t.cancel}
                </button>
                <button
                  disabled={sending || !form.subject.trim() || !form.html.trim() || (!selectedRecipients.length && !form.to.trim())}
                  onClick={submitCompose}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", opacity: sending ? 0.7 : 1 }}
                >
                  {sending ? t.sendingProgress.replace("@sent", String(sendProgress.sent)).replace("@total", String(sendProgress.total)) : t.send}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
