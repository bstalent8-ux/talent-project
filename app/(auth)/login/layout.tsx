export const runtime = 'edge';

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in | Talents",
  description: "Log in to your Talents account.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
