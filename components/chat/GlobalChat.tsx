"use client";
import FloatingChatWidget from "./FloatingChatWidget";
import { useGuestGuard } from "@/contexts/GuestGuard";

export default function GlobalChat() {
  const { isGuest } = useGuestGuard();
  if (isGuest) return null;
  return <FloatingChatWidget />;
}
