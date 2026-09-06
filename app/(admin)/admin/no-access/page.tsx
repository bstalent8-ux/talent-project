export const runtime = 'edge';

// Reached only when a restricted admin's role grants zero readable tabs —
// middleware.ts redirects here instead of looping, since every other
// /admin/* page would just bounce them right back out.
export default function AdminNoAccessPage() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: 24 }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>لا يوجد لك وصول لأي صفحة حالياً</h1>
        <p style={{ margin: 0, opacity: 0.7, fontSize: 14 }}>تواصل مع الأدمن المسؤول عشان يضيفلك صلاحية على تاب واحد على الأقل.</p>
      </div>
    </div>
  );
}
