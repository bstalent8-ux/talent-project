export const runtime = 'edge';

import type { Metadata } from "next";
import PrivacyClient from "./_components/PrivacyClient";

export const metadata: Metadata = {
  title: "سياسة الخصوصية — Talents | Privacy Policy",
  description: "Learn how Talents collects and protects your data.",
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
