import type { Metadata } from "next";
import AboutClient from "./_components/AboutClient";

export const metadata: Metadata = {
  title: "About Us — Talents Platform",
  description: "Learn about our mission to connect brands with the best Arab talents. One platform for real creative collaboration.",
};

export default function AboutPage() {
  return <AboutClient />;
}
