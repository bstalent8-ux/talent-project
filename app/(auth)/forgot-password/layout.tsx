export const runtime = 'edge';

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset password | Talents",
  description: "Reset your Talents account password.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
