"use client";
import { useSite } from "@/contexts/SiteContext";
import HomeLanding, { type HomeLandingProps } from "./home/HomeLanding";

export type HomeClientProps = Omit<HomeLandingProps, "lang">;

export default function HomeClient(props: HomeClientProps) {
  const { lang } = useSite();
  return <HomeLanding lang={lang} {...props} />;
}
