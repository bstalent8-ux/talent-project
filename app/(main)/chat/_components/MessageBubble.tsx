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
  const GOLD    = "var(--color-accent-strong)";
  const myBg    = dark ? "#1F4A4B"  : "#DCEDEA";
  const theirBg = dark ? "#352A22"  : "#F1EAD3";
  const myText  = dark ? "#F5EEDB"  : "#2B211D";
  const MUTED   = dark ? "#8F8175"  : "#8C7D71";

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
        border: isMine ? `1px solid color-mix(in srgb, ${GOLD} 20%, transparent)` : `1px solid ${dark ? "#3A2E28" : "#E6DCC3"}`,
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
