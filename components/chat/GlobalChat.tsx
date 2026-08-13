"use client";
import FloatingChatWidget from "./FloatingChatWidget";
import { useGuestGuard } from "@/contexts/GuestGuard";

export default function GlobalChat() {
  const { isGuest, user } = useGuestGuard();
  if (isGuest || !user?.id) return null;
  return <FloatingChatWidget myId={user.id} />;
}
