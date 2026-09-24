export const runtime = 'edge';

import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { SiteProvider } from "@/contexts/SiteContext";
import { GuestGuard } from "@/contexts/GuestGuard";
import MetaPixel from "@/components/analytics/MetaPixel";
import type { Lang, Mode } from "@/contexts/SiteContext";

export const metadata: Metadata = {
  // Without these, a link shared to WhatsApp/Facebook/iMessage has no
  // og:title/og:image for the crawler to read, so the preview falls back to
  // a bare title-only text link (or the raw URL) instead of a real card —
  // confirmed live by sharing https://talent-s.com/home to WhatsApp.
  metadataBase: new URL("https://talent-s.com"),
  title: "Talents - منصة المواهب العربية",
  description: "ربط البراندات بأفضل المواهب والمؤثرين في العالم العربي",
  openGraph: {
    title: "Talents - منصة المواهب العربية",
    description: "ربط البراندات بأفضل المواهب والمؤثرين في العالم العربي",
    url: "https://talent-s.com",
    siteName: "Talents",
    images: [{ url: "/site-icon.png", width: 544, height: 544 }],
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Talents - منصة المواهب العربية",
    description: "ربط البراندات بأفضل المواهب والمؤثرين في العالم العربي",
    images: ["/site-icon.png"],
  },
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
  // The browser fetches this on every first visit, so it is a 3 KB 64px copy
  // rather than the 544px master (still used for the og:image above).
  icons: {
    icon: [{ url: "/site-icon-64.png", sizes: "64x64", type: "image/png" }],
    apple: [{ url: "/site-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5eedb", // Vanilla Cream — the default (light) page ground
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
// Google Fonts used to be an @import at the top of globals.css: the browser had
// to download and parse that stylesheet before it even discovered the fonts
// CSS, and the fonts CSS then blocked first paint (~0.9 s on a slow phone).
// A stylesheet <link> inserted from script is not render-blocking, and
// display=swap paints text in the fallback face until the real one arrives.
// The preconnects (below) start the two TLS handshakes during HTML parse.
const FONTS_URL = "https://fonts.googleapis.com/css2?family=Alexandria:wght@400;500;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Caveat:wght@600&family=Aref+Ruqaa:wght@700&display=swap";
const FONTS_SCRIPT = `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='${FONTS_URL}';document.head.appendChild(l)})()`;

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: FONTS_SCRIPT }} />
        <noscript>
          <link rel="stylesheet" href={FONTS_URL} />
        </noscript>
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
