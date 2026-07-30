"use client";

// Heartbeats "I am reading this thread" to the server so the chat message
// event can skip notifying someone who is already looking at the conversation.
//
// Cheap by design: one POST on open, one every 30s while the tab is visible,
// one DELETE on close. The server's tolerance window is 45s, so a single
// dropped beat never causes a false "present".

import { useEffect } from "react";

const HEARTBEAT_MS = 30_000;

export function useConversationPresence(conversationId: string | null | undefined) {
  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;
    const url = `/api/chat/conversations/${conversationId}/presence`;

    const beat = () => {
      if (cancelled || document.visibilityState !== "visible") return;
      void fetch(url, { method: "POST", credentials: "include" }).catch(() => {});
    };

    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
      void fetch(url, { method: "DELETE", credentials: "include" }).catch(() => {});
    };
  }, [conversationId]);
}
