import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Logged-in users → home dashboard
    redirect("/home");
  } else {
    // Guests → login
    redirect("/login");
  }
}
