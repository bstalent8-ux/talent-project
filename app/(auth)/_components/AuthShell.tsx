"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AuthFrame, { type AuthVariant } from "./AuthFrame";

// How long the outgoing form takes to slide away before the route changes.
// Keep in sync with `formOut` in auth.module.css.
const EXIT_MS = 260;

const AuthNavContext = createContext<(href: string) => void>(() => {});

function variantFor(pathname: string | null): AuthVariant | null {
  if (!pathname) return null;
  if (pathname.startsWith("/register")) return "register";
  if (pathname.startsWith("/login") || pathname.startsWith("/forgot-password")) return "login";
  if (pathname.startsWith("/waitlist")) return "plain";
  return null;
}

/**
 * Persistent frame for every auth route. Because it lives in the route-group
 * layout, the top bar and the showcase card stay mounted while you move
 * between Sign in and Register — only the form inside slides out (left) and
 * the next one slides in.
 */
export default function AuthShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [nextVariant, setNextVariant] = useState<AuthVariant | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLeaving(false);
    setNextVariant(null);
  }, [pathname]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const navigate = useCallback(
    (href: string) => {
      if (timer.current) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        router.push(href);
        return;
      }
      setLeaving(true);
      setNextVariant(variantFor(href));
      timer.current = setTimeout(() => {
        timer.current = null;
        router.push(href);
      }, EXIT_MS);
    },
    [router],
  );

  const variant = variantFor(pathname);
  if (!variant) return <>{children}</>;

  return (
    <AuthNavContext.Provider value={navigate}>
      <AuthFrame
        variant={variant}
        leaving={leaving}
        // Only re-stage the left card when the destination is a different variant
        // (Sign in → Forgot password keeps the same showcase).
        showcaseLeaving={leaving && nextVariant !== null && nextVariant !== variant}
        pageKey={pathname ?? ""}
      >
        {children}
      </AuthFrame>
    </AuthNavContext.Provider>
  );
}

/** A link between auth pages: plays the slide-out, then navigates. */
export function AuthLink({
  href,
  className,
  style,
  children,
}: {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const navigate = useContext(AuthNavContext);
  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={(e) => {
        // Let modified clicks (new tab, etc.) behave like a normal link.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </Link>
  );
}
