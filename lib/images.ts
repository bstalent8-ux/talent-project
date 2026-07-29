// ─── Remote image sizing ──────────────────────────────────────────────────────
// Avatars and portfolio media are uploaded to Cloudinary at their original
// resolution and were rendered through a raw `<img src>`, so a 40px navbar
// avatar could download a multi-megabyte PNG. Cloudinary applies transforms
// from the URL path, so the fix is a pure string rewrite — no loader, no
// dependency, no change to how images are stored or uploaded.
//
// Non-Cloudinary URLs (Supabase storage, Unsplash, data: URIs) pass through
// untouched.

const CLOUDINARY_UPLOAD = "/image/upload/";

/**
 * Returns `url` with Cloudinary delivery transforms applied.
 *
 * @param width  target render width in CSS px — pass the largest size the
 *               element is displayed at; `dpr_auto` covers retina.
 * @param crop   `fill` (default) for fixed-ratio boxes like avatars and cards,
 *               `limit` when the image must keep its own aspect ratio.
 */
export function cdnImage(
  url: string | null | undefined,
  width: number,
  crop: "fill" | "limit" = "fill",
): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com") || !url.includes(CLOUDINARY_UPLOAD)) return url;

  // Already transformed (an earlier call, or a hand-written URL) — leave it be.
  const [prefix, rest] = url.split(CLOUDINARY_UPLOAD);
  if (/^[a-z]{1,3}_[^/]+\//.test(rest)) return url;

  const transform = `f_auto,q_auto,dpr_auto,w_${width},c_${crop}`;
  return `${prefix}${CLOUDINARY_UPLOAD}${transform}/${rest}`;
}
