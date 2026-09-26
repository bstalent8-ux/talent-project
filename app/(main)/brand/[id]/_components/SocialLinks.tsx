// Brand social icons for the hero. Same platform keys and URL rules as
// components/profile/brand/BrandSocialCard.tsx (BRAND_SOCIAL_KEYS); lucide 1.x
// ships no brand marks, so the glyphs are inline SVG.

const PLATFORMS: Array<{ key: string; label: string; base: string; path: string }> = [
  { key: "instagram", label: "Instagram", base: "https://instagram.com/",
    path: "M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3c1.2-.1 1.6-.1 4.8-.1zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-9.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z" },
  { key: "tiktok", label: "TikTok", base: "https://tiktok.com/@",
    path: "M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" },
  { key: "youtube", label: "YouTube", base: "https://youtube.com/@",
    path: "M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.8 15.1V8.9l5.7 3.1-5.7 3.1z" },
  { key: "facebook", label: "Facebook", base: "https://facebook.com/",
    path: "M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.57 1.53-4 3.87-4 1.12 0 2.3.2 2.3.2v2.5h-1.3c-1.28 0-1.68.8-1.68 1.62V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0 0 22 12z" },
  { key: "linkedin", label: "LinkedIn", base: "https://linkedin.com/in/",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" },
  { key: "x", label: "X", base: "https://x.com/",
    path: "M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z" },
];

function toHref(base: string, raw: string): string | null {
  const value = raw.trim().replace(/^@/, "");
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (/[^\w.-]/.test(value)) return null;
  return `${base}${value}`;
}

export function SocialLinks({ links, className }: { links: Record<string, unknown>; className: string }) {
  const items = PLATFORMS.flatMap((p) => {
    const raw = links?.[p.key];
    if (typeof raw !== "string" || raw.trim().length <= 2) return [];
    const href = toHref(p.base, raw);
    return href ? [{ ...p, href }] : [];
  });
  if (!items.length) return null;
  return (
    <>
      {items.map((p) => (
        <a key={p.key} className={className} href={p.href} target="_blank" rel="noopener noreferrer nofollow" aria-label={p.label} title={p.label}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={p.path} /></svg>
        </a>
      ))}
    </>
  );
}
