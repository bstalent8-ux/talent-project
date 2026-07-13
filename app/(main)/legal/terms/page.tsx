export const runtime = 'edge';

import type { Metadata } from "next";
import TermsClient from "./_components/TermsClient";

export const metadata: Metadata = {
  title: "الشروط والأحكام — Talents | Terms of Service",
  description: "Read the Talents platform terms of service.",
};

export default function TermsPage() {
  return <TermsClient />;
}
