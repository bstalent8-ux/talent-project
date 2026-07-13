export const runtime = 'edge';

import type { Metadata } from "next";
import ContactClient from "./_components/ContactClient";

export const metadata: Metadata = {
  title: "تواصل معنا — Talents | Contact Us",
  description: "Contact the Talents team. We're here to help brands and creators succeed.",
};

export default function ContactPage() {
  return <ContactClient />;
}
