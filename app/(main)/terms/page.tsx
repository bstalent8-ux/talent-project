export const runtime = 'edge';

import type { Metadata } from "next";
import TermsClient from "../legal/terms/_components/TermsClient";

export const metadata: Metadata = {
  title: "الشروط والأحكام — Talents | Terms of Service",
};

export default function TermsPage() {
  return <TermsClient />;
}
