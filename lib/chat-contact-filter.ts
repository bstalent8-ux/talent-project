// ─── Chat contact-info filter — pure, unit-tested ───────────────────────────
// Brands and talents negotiating a deal in-chat and then swapping a phone
// number/email/WhatsApp link to finish it off-platform is the single biggest
// leak in this marketplace's revenue model — every booking that moves off
// the platform after first contact is a booking whose payment (and future
// platform fee, see CLAUDE.md's payment-proof section) never happens here.
// This blocks the message outright at the API boundary
// (app/api/chat/conversations/[id]/messages's POST) rather than sending it
// and flagging it after the fact — the whole point is the contact info never
// reaches the other party.
//
// Reuses the admin bio-detector's phone regex (same false-positive-avoidance
// tuning — years, prices, ids don't false-positive) rather than duplicating
// it; that module is already a dependency-free pure leaf, safe to import
// from here.

import { extractPhoneCandidates } from "@/features/admin/services/bio-phone-detection";

export type ContactInfoType = "phone" | "email" | "off_platform_link";

export interface ContactInfoMatch {
  type: ContactInfoType;
  raw:  string;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Deliberately narrow to actual "leave the app and talk elsewhere" deep
// links — NOT every social-media mention. A talent saying "check my
// Instagram" or pasting an instagram.com/whatever link is normal portfolio
// talk (the platform's own social_links field sanctions exactly that
// elsewhere) and isn't blocked here; a WhatsApp/Telegram chat link has no
// legitimate purpose in this chat other than moving the conversation off it.
const OFF_PLATFORM_LINK_REGEX = /\b(?:wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|t\.me|telegram\.me)\/\S+/gi;

export function findContactInfo(text: string | null | undefined): ContactInfoMatch[] {
  if (!text) return [];
  const matches: ContactInfoMatch[] = [];

  for (const p of extractPhoneCandidates(text)) matches.push({ type: "phone", raw: p.raw });
  for (const raw of text.match(EMAIL_REGEX) ?? []) matches.push({ type: "email", raw });
  for (const raw of text.match(OFF_PLATFORM_LINK_REGEX) ?? []) matches.push({ type: "off_platform_link", raw });

  return matches;
}

export function containsContactInfo(text: string | null | undefined): boolean {
  return findContactInfo(text).length > 0;
}
