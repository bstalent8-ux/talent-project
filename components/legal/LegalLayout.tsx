"use client";

import { motion } from "framer-motion";
import { useSite } from "@/contexts/SiteContext";

interface Section {
  title: string;
  content: string | string[];
}

interface Props {
  badge:       string;
  title:       string;
  subtitle:    string;
  lastUpdated: string;
  sections:    Section[];
}

export default function LegalLayout({ badge, title, subtitle, lastUpdated, sections }: Props) {
  const { lang, dark } = useSite();
  const ar = lang === "ar";

  const BG     = dark ? "#060d18" : "#f8fafc";
  const CARD   = dark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const BORDER = dark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const GREEN  = "#00D26A";

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ background: BG, minHeight: "100vh", fontFamily: "'Cairo', sans-serif" }}>

      {/* Hero */}
      <section style={{
        position: "relative", overflow: "hidden",
        padding: "90px 24px 70px", textAlign: "center",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: dark
            ? `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,210,106,0.08) 0%, transparent 70%), #060d18`
            : `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,210,106,0.05) 0%, transparent 70%), #f8fafc`,
        }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              display: "inline-block", marginBottom: 16,
              background: dark ? "rgba(0,210,106,0.1)" : "rgba(0,210,106,0.08)",
              border: "1px solid rgba(0,210,106,0.25)",
              borderRadius: 100, padding: "4px 16px",
              color: GREEN, fontSize: 11, fontWeight: 700,
              letterSpacing: 1.2, textTransform: "uppercase",
            }}
          >
            {badge}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 900, color: TEXT, margin: "0 0 16px" }}
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ color: MUTED, fontSize: 15, lineHeight: 1.8, margin: "0 auto 20px", maxWidth: 480 }}
          >
            {subtitle}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ color: MUTED, fontSize: 12, opacity: 0.7 }}
          >
            {lastUpdated}
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {sections.map((sec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: "28px 32px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: `rgba(0,210,106,0.12)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: GREEN, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: TEXT, margin: 0 }}>
                  {sec.title}
                </h2>
              </div>
              {Array.isArray(sec.content) ? (
                <ul style={{ margin: 0, padding: ar ? "0 20px 0 0" : "0 0 0 20px", color: MUTED, fontSize: 14, lineHeight: 2, display: "flex", flexDirection: "column", gap: 4 }}>
                  {sec.content.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: MUTED, fontSize: 14, lineHeight: 2, margin: 0 }}>
                  {sec.content}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
