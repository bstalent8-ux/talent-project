// Pure logic extracted out of components/analytics/PageViewTracker.tsx so it
// is unit-testable without a DOM/React renderer (the repo deliberately has
// no jsdom/RTL — see vitest.config.ts). The component itself is a thin
// useEffect wrapper that calls this once per (pathname, searchParams)
// change: once on initial mount, once per SPA route change after that.

import { trackEvent } from "./track";
import { trackMetaEvent } from "./meta-pixel";

export function firePageView(path: string): void {
  trackEvent("page_view", { metadata: { path } });
  trackMetaEvent("PageView");
}
