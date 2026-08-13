export const runtime = 'edge';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlobalChat from "@/components/chat/GlobalChat";

// No server-side cookies()/getUser()/profile lookup here — that was the
// proven cause of every (main) route rendering fully dynamic on Cloudflare
// (cfCacheStatus: DYNAMIC, ~7.5-8s origin time in production). Navbar now
// resolves its own auth/profile state client-side via GuestGuard, the app's
// single shared auth source — see components/Navbar.tsx.
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <GlobalChat />
    </>
  );
}