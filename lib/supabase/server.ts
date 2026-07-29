import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";

// Usage in Server Components / API Routes:
// import { createClient } from "@/lib/supabase/server";
// const supabase = await createClient();

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

/**
 * `getUser()` revalidates the JWT against Supabase over the network (~200ms),
 * and a single render calls it more than once — the (main) layout needs it for
 * the navbar profile while the page below needs it for its own data. React's
 * `cache` scopes one call per request, so the layout and the page share it.
 *
 * Use this instead of `createClient().auth.getUser()` in Server Components.
 * Keep using the raw call in API route handlers: they are separate requests,
 * so there is nothing to share.
 */
export const getCachedUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});
