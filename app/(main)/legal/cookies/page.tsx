export const runtime = 'edge';

import type { Metadata } from "next";
import CookiesClient from "./_components/CookiesClient";

export const metadata: Metadata = {
  title: "سياسة الكوكيز — Talents | Cookie Policy",
  description: "Learn how Talents uses cookies and tracking technologies.",
};

export default function CookiesPage() {
  return <CookiesClient />;
}
