export const runtime = 'edge';

import AuthShell from "./_components/AuthShell";

// The frame (top bar, showcase card) lives here so it stays mounted while you
// move between /login and /register — only the form inside animates.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
