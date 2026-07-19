export const runtime = 'edge';

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Always go to home — guests can browse, logged-in users see personalized content
  redirect("/home");
}