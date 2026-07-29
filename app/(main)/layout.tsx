export const runtime = 'edge';

import { createClient, getCachedUser } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlobalChat from "@/components/chat/GlobalChat";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedUser();
  const supabase = await createClient();

  let initialAvatarUrl: string | null = null;
  let initialFullName: string | null = null;

  if (user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      initialAvatarUrl = profile.avatar_url;
      initialFullName = profile.full_name;
    }
  }

  return (
    <>
      {/* `initialProfileLoaded` tells Navbar the profile question is already
          settled server-side, so it does not re-fetch /api/me on mount. Without
          it, every guest page load — and every logged-in user with no avatar and
          no display name — fired an extra /api/me round trip per navigation. */}
      <Navbar
        initialAvatarUrl={initialAvatarUrl}
        initialFullName={initialFullName}
        initialProfileLoaded
      />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <GlobalChat />
    </>
  );
}