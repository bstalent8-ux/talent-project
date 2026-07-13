export const runtime = 'edge';

import type { Metadata } from "next";
import BecomeTalentClient from "./_components/BecomeTalentClient";

export const metadata: Metadata = {
  title: "كن موهوباً — Talents | Become a Talent",
  description: "Join Talents marketplace. Connect with top brands, grow your income, and build your creative career.",
};

export default function BecomeTalentPage() {
  return <BecomeTalentClient />;
}
