export const runtime = 'edge';

import type { ReactNode } from "react";
import ConversationList from "./_components/ConversationList";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ display: "flex", height: "calc(100vh - 60px)", overflow: "hidden" }}>
        <ConversationList />
        <div style={{ flex: 1, overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </>
  );
}