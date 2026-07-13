export default function ChatIndexPage() {
  return (
    <div style={{
      flex: 1, height: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 12,
    }}>
      <span style={{ fontSize: 48 }}>💬</span>
      <p style={{ margin: 0, fontSize: 16, color: "#64748b" }}>
        Select a conversation to start chatting
      </p>
    </div>
  );
}
