export const runtime = 'edge';

import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { SiteProvider } from "@/contexts/SiteContext";
import { GuestGuard } from "@/contexts/GuestGuard";
import MetaPixel from "@/components/analytics/MetaPixel";
import type { Lang, Mode } from "@/contexts/SiteContext";

export const metadata: Metadata = {
  title: "Talents - منصة المواهب العربية",
  description: "ربط البراندات بأفضل المواهب والمؤثرين في العالم العربي",
  // The app/icon.png metadata-route convention doesn't survive
  // @cloudflare/next-on-pages — the <link rel="icon"> tag it's supposed to
  // auto-inject was simply missing from the production HTML (confirmed live
  // against talent-s.com). Moving the file into public/ wasn't enough either
  // — public/favicon.png specifically 404'd in production with
  // `x-matched-path: /_not-found`, meaning Next's own router (not Cloudflare's
  // static-asset layer) was swallowing that exact filename, unlike every
  // other file under public/ (all served fine). "favicon" appears to be a
  // reserved name regardless of directory. site-icon.png has no special
  // meaning to Next at all, sidestepping that entirely.
  icons: { icon: "/site-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070b10",
};

// Blocking script runs before React hydrates to prevent flash of wrong theme/lang.
// Reads site_language / site_theme from localStorage; falls back to English +
// light mode until a visitor explicitly picks something else (toggleLang/
// toggleMode in contexts/SiteContext.tsx persist that choice to both
// localStorage and a cookie, so it sticks across the whole session and
// future visits — this default only applies before that first choice).
// Also mirrors both into cookies (not just localStorage) — the root layout
// below reads those cookies on the SERVER so the very first HTML byte
// already carries the right lang/theme, instead of always "en"/"light" and
// flipping client-side after mount (see contexts/SiteContext.tsx).
const INIT_SCRIPT = `(function(){try{

  var l=localStorage.getItem('site_language')||'en';
  var m=localStorage.getItem('site_theme')||'light';
  document.documentElement.setAttribute('data-theme',m);
  document.documentElement.setAttribute('lang',l);
  document.documentElement.setAttribute('dir',l==='ar'?'rtl':'ltr');
  document.cookie='site_language='+l+'; path=/; max-age=31536000; SameSite=Lax';
  document.cookie='site_theme='+m+'; path=/; max-age=31536000; SameSite=Lax';
  var raw=localStorage.getItem('talents_system_design');
  if(raw){
    var d=JSON.parse(raw);
    var theme=d.theme||{};
    var vars={
      '--color-primary':theme.primary,
      '--color-secondary':theme.secondary,
      '--color-accent':theme.accent,
      '--font-sans':theme.fontSans?('"'+theme.fontSans+'", system-ui, sans-serif'):null,
      '--font-display':theme.fontDisplay?('"'+theme.fontDisplay+'", system-ui, sans-serif'):null
    };
    Object.keys(vars).forEach(function(k){ if(vars[k]) document.documentElement.style.setProperty(k,vars[k]); });
  }
}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Mirrors INIT_SCRIPT's own fallback logic so a first-ever visit (no
  // cookie yet) resolves the same way server and client — the cookie only
  // exists after the blocking script's first run, so this branch matters
  // for exactly one request per new visitor. Default is English + light;
  // an explicit "ar"/"dark" cookie (set once the visitor changes it in
  // settings) always wins over this default.
  const cookieStore = await cookies();
  const lang: Lang = cookieStore.get("site_language")?.value === "ar" ? "ar" : "en";
  const mode: Mode = cookieStore.get("site_theme")?.value === "dark" ? "dark" : "light";

  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} data-theme={mode} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <MetaPixel />
        <SiteProvider initialLang={lang} initialMode={mode}>
          <GuestGuard>{children}</GuestGuard>
        </SiteProvider>
      </body>
    </html>
  );
}
