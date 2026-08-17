"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserRoundPlus, X } from "lucide-react";
import { createClient, getBrowserUser } from "@/lib/supabase/client";
import {
  canPerformAction,
  getAuthModalMessage,
  type PermissionAction,
  type PermissionResult,
  type PermissionUser,
} from "@/lib/permissions";
import { setNotificationAuthUser } from "@/hooks/notifications";
import { useSite } from "./SiteContext";

interface GuestGuardValue {
  loading: boolean;
  user: PermissionUser | null;
  isGuest: boolean;
  can: (action: PermissionAction) => boolean;
  requestAuth: (action: PermissionAction, message?: string) => void;
  closeAuthModal: () => void;
}

const GuestGuardContext = createContext<GuestGuardValue | null>(null);

const TX = {
  ar: {
    title: "أنشئ حساباً للمتابعة",
    talent: "متابعة كموهبة",
    brand: "متابعة كبراند",
    login: "تسجيل الدخول",
    close: "إغلاق",
    blockedTitle: "غير متاح لحسابك",
  },
  en: {
    title: "Create an account to continue",
    talent: "Continue as Talent",
    brand: "Continue as Brand",
    login: "Login",
    close: "Close",
    blockedTitle: "Not available for your account",
  },
} as const;

/**
 * Copy for an ALREADY-authenticated user whose account just can't do this —
 * distinct from the guest CTA modal below. Reusing getAuthModalMessage()
 * here would tell a logged-in Talent to "sign up as a brand", which is
 * both wrong (they have an account) and impossible to act on.
 */
const BLOCKED_TX: Record<"ar" | "en", Record<Exclude<PermissionResult["reason"], "guest" | undefined>, string>> = {
  ar: {
    role:     "هذا الإجراء متاح فقط لحسابات البراند.",
    approval: "حسابك قيد المراجعة حالياً.",
    inactive: "حسابك غير نشط حالياً.",
  },
  en: {
    role:     "This action is only available to brand accounts.",
    approval: "Your account is still pending approval.",
    inactive: "Your account is currently inactive.",
  },
};

export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { dark, lang } = useSite();
  const t = TX[lang];

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<PermissionUser | null>(null);
  const [modal, setModal] = useState<{ action: PermissionAction; message?: string } | null>(null);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
        setNotificationAuthUser(null);
        return;
      }

      const { data: { user: authUser } } = await getBrowserUser();
      if (!authUser) {
        setUser(null);
        setNotificationAuthUser(null);
        return;
      }

      const res = await fetch("/api/me/role", { credentials: "include" });
      if (!res.ok) {
        setUser({ id: authUser.id });
        setNotificationAuthUser(authUser.id);
        return;
      }

      const profile = await res.json();
      setUser({
        id:             authUser.id,
        role:           profile.role ?? null,
        account_status: profile.account_status ?? null,
        brand_status:   profile.brand_status ?? null,
        talent_status:  profile.talent_status ?? null,
        is_suspended:   profile.is_suspended ?? null,
      });
      setNotificationAuthUser(authUser.id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // No separate initial call: supabase-js fires onAuthStateChange once
    // immediately on subscribe (INITIAL_SESSION), with or without a session —
    // an explicit loadUser() call here used to double every auth request this
    // component makes on every page load.
    const { data: { subscription } } = createClient().auth.onAuthStateChange(() => {
      loadUser();
    });
    return () => subscription.unsubscribe();
  }, [loadUser]);

  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [modal]);

  const value = useMemo<GuestGuardValue>(() => ({
    loading,
    user,
    isGuest: !user?.id,
    can: (action) => canPerformAction(action, user).allowed,
    requestAuth: (action, message) => setModal({ action, message }),
    closeAuthModal: () => setModal(null),
  }), [loading, user]);

  const isGuestNow = !user?.id;
  // Already-authenticated-but-blocked (role/approval/inactive) gets its own
  // copy — telling a logged-in Talent to "sign up as a brand" is both wrong
  // (they have an account) and not actionable.
  const blockedReason = modal && !isGuestNow ? canPerformAction(modal.action, user).reason : undefined;
  const message = modal
    ? modal.message
      ?? (blockedReason && blockedReason !== "guest" ? BLOCKED_TX[lang][blockedReason] : getAuthModalMessage(modal.action, lang))
    : "";
  const surface = dark ? "#0D1623" : "#FFFFFF";
  const border = dark ? "rgba(0,255,163,0.18)" : "#E2E8F0";
  const text = dark ? "#F8FAFC" : "#0F172A";
  const muted = dark ? "#A8B3C2" : "#64748B";
  const green = "#00D26A";

  /**
   * Guests navigating to login/register lose all page context otherwise —
   * middleware.ts already sets `?next=` when it redirects a guest away from
   * a protected route, but nothing downstream ever reads it. This is the
   * same convention, extended with `resume=<action>` so the ORIGIN page can
   * re-fire the exact action (open the brief modal, open chat, favorite)
   * once the user is authenticated instead of just dropping them back on a
   * page where they have to find the button again.
   */
  function go(path: string) {
    const pendingAction = modal?.action;
    setModal(null);
    if (typeof window === "undefined") { router.push(path); return; }

    let target = window.location.pathname + window.location.search;
    if (pendingAction) {
      target += `${target.includes("?") ? "&" : "?"}resume=${encodeURIComponent(pendingAction)}`;
    }
    const sep = path.includes("?") ? "&" : "?";
    router.push(`${path}${sep}next=${encodeURIComponent(target)}`);
  }

  return (
    <GuestGuardContext.Provider value={value}>
      {children}
      {modal && (
        <div
          role="presentation"
          onClick={() => setModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            backgroundColor: "rgba(2,6,23,0.68)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            fontFamily: "'Cairo',sans-serif",
            direction: lang === "ar" ? "rtl" : "ltr",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-auth-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(100%, 420px)",
              backgroundColor: surface,
              border: `1px solid ${border}`,
              borderRadius: 14,
              boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
              padding: 22,
            }}
          >
            <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 14 }}>
              <div>
                <h2 id="guest-auth-title" style={{ color: text, fontSize: 20, fontWeight: 900, margin: "0 0 8px" }}>
                  {isGuestNow ? t.title : t.blockedTitle}
                </h2>
                <p style={{ color: muted, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                  {message}
                </p>
              </div>
              <button
                type="button"
                aria-label={t.close}
                onClick={() => setModal(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: `1px solid ${border}`,
                  backgroundColor: dark ? "#0A121C" : "#F8FAFC",
                  color: muted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={17} />
              </button>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 22 }}>
              {!isGuestNow && (
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  style={{
                    height: 44,
                    borderRadius: 10,
                    border: "none",
                    backgroundColor: green,
                    color: "#050B12",
                    fontWeight: 900,
                    fontFamily: "'Cairo',sans-serif",
                    cursor: "pointer",
                  }}
                >
                  {t.close}
                </button>
              )}
              {isGuestNow && (
              <>
              <button
                type="button"
                onClick={() => go("/register?role=talent")}
                style={{
                  height: 44,
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: green,
                  color: "#050B12",
                  fontWeight: 900,
                  fontFamily: "'Cairo',sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <UserRoundPlus size={17} />
                {t.talent}
              </button>
              <button
                type="button"
                onClick={() => go("/register?role=brand")}
                style={{
                  height: 44,
                  borderRadius: 10,
                  border: `1px solid ${green}`,
                  backgroundColor: dark ? "rgba(0,210,106,0.08)" : "#ECFDF5",
                  color: green,
                  fontWeight: 900,
                  fontFamily: "'Cairo',sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <UserRoundPlus size={17} />
                {t.brand}
              </button>
              <button
                type="button"
                onClick={() => go("/login")}
                style={{
                  height: 42,
                  borderRadius: 10,
                  border: `1px solid ${border}`,
                  backgroundColor: "transparent",
                  color: text,
                  fontWeight: 800,
                  fontFamily: "'Cairo',sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <LogIn size={16} />
                {t.login}
              </button>
              </>
              )}
            </div>
          </section>
        </div>
      )}
    </GuestGuardContext.Provider>
  );
}

export function useGuestGuard(): GuestGuardValue {
  const ctx = useContext(GuestGuardContext);
  if (!ctx) throw new Error("useGuestGuard must be used inside GuestGuard");
  return ctx;
}
