export const runtime = 'edge';

import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LazyGlobalChat from "@/components/chat/LazyGlobalChat";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialAvatarUrl: string | null = null;
  let initialFullName: string | null = null;
  let initialProfileLoaded = !user;

  if (user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", user.id)
      .maybeSingle();

    initialProfileLoaded = Boolean(profile);

    if (profile) {
      initialAvatarUrl = profile.avatar_url;
      initialFullName = profile.full_name;
    }
  }

  return (
    <>
      <Navbar
        initialAvatarUrl={initialAvatarUrl}
        initialFullName={initialFullName}
        initialProfileLoaded={initialProfileLoaded}
      />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <LazyGlobalChat />
    </>
  );
}
