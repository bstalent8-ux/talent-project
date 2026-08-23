"use client";

// Mounted once in app/(main)/layout.tsx. Logs a page_view (in-house
// user_events) on every route change and mirrors it to Meta Pixel — one
// place instead of every page wiring its own tracking call.

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { firePageView } from "@/lib/analytics/page-view";

export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const path = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    firePageView(path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}
