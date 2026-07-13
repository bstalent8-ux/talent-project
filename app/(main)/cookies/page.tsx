export const runtime = 'edge';

import type { Metadata } from "next";
import CookiesClient from "../legal/cookies/_components/CookiesClient";

export const metadata: Metadata = {
  title: "سياسة الكوكيز — Talents | Cookie Policy",
};

export default function CookiesPage() {
  return <CookiesClient />;
}
