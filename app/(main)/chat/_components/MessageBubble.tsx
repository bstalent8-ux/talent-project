import type { Message } from "@/features/chat/types";

interface Props {
  message: Message;
  isMine: boolean;
  dark: boolean;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message, isMine, dark }: Props) {
  const GOLD    = "#FFB800";
  const myBg    = dark ? "#1a3a5c"  : "#FFF3CC";
  const theirBg = dark ? "#0f1e2e"  : "#F1F5F9";
  const myText  = dark ? "#f1f5f9"  : "#0f172a";
  const MUTED   = dark ? "#64748b"  : "#94a3b8";

  return (
    <div style={{
      display: "flex",
      justifyContent: isMine ? "flex-end" : "flex-start",
      marginBottom: 4,
    }}>
      <div style={{
        maxWidth: "70%",
        padding: "9px 14px",
        borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        backgroundColor: isMine ? myBg : theirBg,
        border: isMine ? `1px solid ${GOLD}33` : `1px solid ${dark ? "#1e293b" : "#e2e8f0"}`,
        position: "relative",
      }}>
        <p style={{ margin: 0, fontSize: 14, color: myText, lineHeight: 1.5, wordBreak: "break-word" }}>
          {message.content}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: MUTED }}>{formatTime(message.created_at)}</span>
          {isMine && (
            <span style={{ fontSize: 11, color: message.is_read ? GOLD : MUTED }}>
              {message.is_read ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
