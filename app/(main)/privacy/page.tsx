export const runtime = 'edge';

import type { Metadata } from "next";
import PrivacyClient from "../legal/privacy/_components/PrivacyClient";

export const metadata: Metadata = {
  title: "سياسة الخصوصية — Talents | Privacy Policy",
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
