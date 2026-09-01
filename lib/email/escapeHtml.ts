// Escapes the 5 HTML-significant characters so a string is safe to
// interpolate into an HTML template as TEXT — never as markup.
//
// This is character substitution, not pattern/tag detection: it can't be
// bypassed the way a blacklist regex ("strip anything that looks like
// <script>") can, because it never tries to recognize "dangerous" input —
// it just makes every occurrence of & < > " ' inert, unconditionally.
// Order matters: & must be escaped first, or the escape sequences the
// other replacements produce (e.g. "&lt;") would themselves get
// re-escaped on a later pass.
//
// Arabic text, other non-Latin scripts, emoji, and all other Unicode pass
// through completely untouched — this only ever touches those 5 ASCII
// characters.
//
// Pure function, no imports — safe to import from both the email
// templates (server-side send path) and any client component that
// previews them (matches the existing "pure template" convention in this
// directory).
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
