export const runtime = 'edge';

import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { SiteProvider } from "@/contexts/SiteContext";
import { GuestGuard } from "@/contexts/GuestGuard";
import type { Lang, Mode } from "@/contexts/SiteContext";

export const metadata: Metadata = {
  title: "Talents - منصة المواهب العربية",
  description: "ربط البراندات بأفضل المواهب والمؤثرين في العالم العربي",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070b10",
};

// Blocking script runs before React hydrates to prevent flash of wrong theme/lang.
// Reads site_language / site_theme from localStorage; falls back to "ar" and time-based mode.
// Also mirrors both into cookies (not just localStorage) — the root layout
// below reads those cookies on the SERVER so the very first HTML byte
// already carries the right lang/theme, instead of always "ar"/"dark" and
// flipping client-side after mount (see contexts/SiteContext.tsx).
const INIT_SCRIPT = `(function(){try{

  var l=localStorage.getItem('site_language')||'ar';
  var m=localStorage.getItem('site_theme');
  if(!m){var h=new Date().getHours();m=(h>=6&&h<18)?'light':'dark';}
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

function timeBasedMode(): Mode {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? "light" : "dark";
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Mirrors INIT_SCRIPT's own fallback logic so a first-ever visit (no
  // cookie yet) resolves the same way server and client — the cookie only
  // exists after the blocking script's first run, so this branch matters
  // for exactly one request per new visitor.
  const cookieStore = await cookies();
  const lang: Lang = cookieStore.get("site_language")?.value === "en" ? "en" : "ar";
  const mode: Mode = (cookieStore.get("site_theme")?.value as Mode | undefined) ?? timeBasedMode();

  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} data-theme={mode} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <SiteProvider initialLang={lang} initialMode={mode}>
          <GuestGuard>{children}</GuestGuard>
        </SiteProvider>
      </body>
    </html>
  );
}
