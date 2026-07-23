export const runtime = 'edge';

import type { Metadata } from "next";
import "./globals.css";
import { SiteProvider } from "@/contexts/SiteContext";

export const metadata: Metadata = {
  title: "Talents — منصة المواهب العربية",
  description: "ربط البراندات بأفضل المواهب والمؤثرين في العالم العربي",
};

// Blocking script — runs before React hydrates to prevent flash of wrong theme/lang.
// Reads site_language / site_theme from localStorage; falls back to "ar" and time-based mode.
const INIT_SCRIPT = `(function(){try{

  var l=localStorage.getItem('site_language')||'ar';
  var m=localStorage.getItem('site_theme');
  if(!m){var h=new Date().getHours();m=(h>=6&&h<18)?'light':'dark';}
  document.documentElement.setAttribute('data-theme',m);
  document.documentElement.setAttribute('lang',l);
  document.documentElement.setAttribute('dir',l==='ar'?'rtl':'ltr');
  var raw=localStorage.getItem('talents_system_design');
  if(raw){
    var d=JSON.parse(raw);
    var theme=d.theme||{};
    var vars={
      '--color-primary':theme.primary,
      '--color-secondary':theme.secondary,
      '--color-accent':theme.accent,
      '--font-sans':theme.fontSans?('\''+theme.fontSans+'\', system-ui, sans-serif'):null,
      '--font-display':theme.fontDisplay?('\''+theme.fontDisplay+'\', system-ui, sans-serif'):null
    };
    Object.keys(vars).forEach(function(k){ if(vars[k]) document.documentElement.style.setProperty(k,vars[k]); });
  }
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <SiteProvider>{children}</SiteProvider>
      </body>
    </html>
  );
}
