export const runtime = 'edge';

import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlobalChat from "@/components/chat/GlobalChat";
import PageViewTracker from "@/components/analytics/PageViewTracker";
import ClickTracker from "@/components/analytics/ClickTracker";

// No server-side cookies()/getUser()/profile lookup here — that was the
// proven cause of every (main) route rendering fully dynamic on Cloudflare
// (cfCacheStatus: DYNAMIC, ~7.5-8s origin time in production). Navbar now
// resolves its own auth/profile state client-side via GuestGuard, the app's
// single shared auth source — see components/Navbar.tsx.
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* useSearchParams() inside PageViewTracker requires a Suspense
          boundary — wrapping only this leaf, not the whole tree, keeps the
          rest of (main) exactly as static/streamed as before. */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <ClickTracker />
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <GlobalChat />
    </>
  );
}