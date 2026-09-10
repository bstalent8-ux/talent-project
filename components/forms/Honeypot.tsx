"use client";

// A field no human sees but naive bots fill in. The server treats any
// submission with this field set as spam and silently 200s
// (lib/rate-limit.ts → isHoneypotTripped / HONEYPOT_FIELD = "_hp").
//
// Deliberately NOT display:none — some bots skip hidden inputs. Positioned
// off-screen instead, removed from the tab order and the a11y tree.
export default function Honeypot({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-9999px",
        width: 1,
        height: 1,
        overflow: "hidden",
      }}
    >
      <label>
        Leave this field empty
        <input
          type="text"
          name="_hp"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
