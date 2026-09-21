export const runtime = 'edge';

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an account | Talents",
  description: "Join Talents as a brand or as a UGC creator / model.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
