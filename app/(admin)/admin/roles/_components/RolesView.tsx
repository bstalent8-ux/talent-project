"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Search, Trash2, UserPlus, Users } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import EmptyState from "@/components/admin/EmptyState";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import { ADMIN_RESOURCE_KEYS, type AdminResourceKey } from "@/lib/auth/admin-resources";
import type { AdminRole, AdminRoleAuditEntry, AdminSearchResult } from "@/features/admin-roles/types";

const RESOURCE_LABELS: Record<AdminResourceKey, { ar: string; en: string }> = {
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  leads: { ar: "العملاء المحتملين", en: "Leads" },
  candidates: { ar: "المرشحين", en: "Candidates" },
  talents: { ar: "المواهب", en: "Talents" },
  verifications: { ar: "طلبات التحقق", en: "Verifications" },
  talentDemand: { ar: "طلب أنواع المواهب", en: "Talent Demand" },
  bookings: { ar: "الحجوزات", en: "Bookings" },
  reviews: { ar: "التقييمات", en: "Reviews" },
  brands: { ar: "الشركات", en: "Brands" },
  trustedBrands: { ar: "براندات موثوقة", en: "Trusted Brands" },
  support: { ar: "تذاكر الدعم", en: "Support" },
  emails: { ar: "الإيميلات", en: "Emails" },
  notifications: { ar: "الإشعارات", en: "Notifications" },
  notificationsLog: { ar: "سجل الإشعارات", en: "Notification Log" },
  userActivity: { ar: "نشاط المستخدمين", en: "User Activity" },
  healthCheck: { ar: "الفحص الصحي", en: "Health Check" },
  blog: { ar: "المقالات", en: "Blog" },
  testimonials: { ar: "آراء الصفحة الرئيسية", en: "Testimonials" },
  brandMoments: { ar: "لحظات البراندات", en: "Brand Moments" },
  categories: { ar: "التصنيفات", en: "Categories" },
  packages: { ar: "الباقات", en: "Packages" },
  profileConfig: { ar: "إعدادات الملفات", en: "Profile Config" },
  // No "settings" entry — it's no longer a gated resource, see
  // lib/auth/admin-resources.ts's ADMIN_ROUTE_MAP comment.
};

const TX = {
  ar: {
    tabRoles: "الأدوار", tabAudit: "سجل التغييرات",
    newRole: "دور جديد", roleKeyPh: "معرف الدور (بالإنجليزي، مثلا: leads_agent)", roleLabelArPh: "الاسم بالعربي", roleLabelEnPh: "الاسم بالإنجليزي",
    create: "إنشاء", cancel: "إلغاء",
    assignedCount: (n: number) => `${n} أدمن معيّن`, tab: "التاب", read: "قراءة", cr: "إضافة", up: "تعديل", del: "مسح",
    assignTo: "عيّن الدور لأدمن", searchAdmin: "دوّر باسم الأدمن...", currentRole: "الدور الحالي",
    fullAccess: "كل الصلاحيات (بدون قيد)", assign: "عيّن",
    deleteRole: "مسح الدور", deleteTitle: "مسح الدور؟", deleteDesc: (n: number) => `${n} أدمن معيّن على الدور ده هيرجعوا "كل الصلاحيات" تلقائي. الخطوة دي مش هترجع.`,
    noRoles: "لسه مفيش أدوار", noAudit: "لسه مفيش تغييرات مسجلة",
    by: "بواسطة", roleCreated: "دور جديد اتعمل", roleDeleted: "دور اتمسح", permChanged: "صلاحية اتغيرت", assignChanged: "تعيين اتغير",
    on: "على",
    createAdmin: "إنشاء أدمن جديد", emailPh: "الإيميل", passwordPh: "الباسورد (8 أحرف على الأقل)", fullNamePh: "الاسم الكامل",
    confirmPasswordPh: "تأكيد الباسورد", passwordMismatch: "الباسورد وتأكيده مش متطابقين",
    roleForNewAdmin: "الدور", createAdminBtn: "إنشاء", creating: "بيتعمل...",
    createAdminSuccess: "الأدمن اتعمل بنجاح",
  },
  en: {
    tabRoles: "Roles", tabAudit: "Change log",
    newRole: "New role", roleKeyPh: "role key (english, e.g. leads_agent)", roleLabelArPh: "Arabic name", roleLabelEnPh: "English name",
    create: "Create", cancel: "Cancel",
    assignedCount: (n: number) => `${n} admin(s) assigned`, tab: "Tab", read: "Read", cr: "Create", up: "Update", del: "Delete",
    assignTo: "Assign role to an admin", searchAdmin: "Search admin by name...", currentRole: "Current role",
    fullAccess: "Full access (unrestricted)", assign: "Assign",
    deleteRole: "Delete role", deleteTitle: "Delete this role?", deleteDesc: (n: number) => `${n} admin(s) on this role will revert to full access automatically. This can't be undone.`,
    noRoles: "No roles yet", noAudit: "No changes logged yet",
    by: "by", roleCreated: "Role created", roleDeleted: "Role deleted", permChanged: "Permission changed", assignChanged: "Assignment changed",
    on: "on",
    createAdmin: "Create new admin", emailPh: "Email", passwordPh: "Password (min 8 characters)", fullNamePh: "Full name",
    confirmPasswordPh: "Confirm password", passwordMismatch: "Password and confirmation don't match",
    roleForNewAdmin: "Role", createAdminBtn: "Create", creating: "Creating...",
    createAdminSuccess: "Admin created successfully",
  },
};

export default function RolesView() {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const ar = lang === "ar";

  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const TH = dark ? "#0a121c" : "#f8fafc";

  const [tab, setTab] = useState<"roles" | "audit">("roles");
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showNewRole, setShowNewRole] = useState(false);
  const [newRole, setNewRole] = useState({ key: "", labelAr: "", labelEn: "" });
  const [creating, setCreating] = useState(false);
  const [newRoleError, setNewRoleError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminRole | null>(null);

  const [auditEntries, setAuditEntries] = useState<AdminRoleAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const cardStyle: React.CSSProperties = { backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" };
  const inputStyle: React.CSSProperties = { padding: "9px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 13 };

  async function loadRoles() {
    setLoading(true);
    const res = await fetch("/api/admin/roles").catch(() => null);
    const data = await res?.json().catch(() => null) as { roles?: AdminRole[] } | null;
    setRoles(data?.roles ?? []);
    setLoading(false);
  }

  async function loadAudit() {
    setAuditLoading(true);
    const res = await fetch("/api/admin/roles/audit-log").catch(() => null);
    const data = await res?.json().catch(() => null) as { entries?: AdminRoleAuditEntry[] } | null;
    setAuditEntries(data?.entries ?? []);
    setAuditLoading(false);
  }

  useEffect(() => { loadRoles(); }, []);
  useEffect(() => { if (tab === "audit") loadAudit(); }, [tab]);

  async function toggleCell(role: AdminRole, resourceKey: AdminResourceKey, field: "canRead" | "canCreate" | "canUpdate" | "canDelete") {
    const current = role.permissions.find((p) => p.resourceKey === resourceKey)
      ?? { resourceKey, canRead: false, canCreate: false, canUpdate: false, canDelete: false };
    const next = { ...current, [field]: !current[field] };

    // Optimistic update so a checkbox click feels instant.
    setRoles((prev) => prev.map((r) => r.id !== role.id ? r : {
      ...r, permissions: [...r.permissions.filter((p) => p.resourceKey !== resourceKey), next],
    }));

    await fetch(`/api/admin/roles/${role.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceKey, canRead: next.canRead, canCreate: next.canCreate, canUpdate: next.canUpdate, canDelete: next.canDelete }),
    }).catch(() => {});
  }

  async function createRole(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setNewRoleError(null);
    const res = await fetch("/api/admin/roles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRole),
    }).catch(() => null);
    const data = await res?.json().catch(() => null) as { error?: string } | null;
    setCreating(false);
    if (res?.ok) {
      setNewRole({ key: "", labelAr: "", labelEn: "" });
      setShowNewRole(false);
      loadRoles();
    } else {
      setNewRoleError(data?.error ?? "failed to create role");
    }
  }

  async function confirmDeleteRole() {
    if (!deleteTarget) return;
    await fetch(`/api/admin/roles/${deleteTarget.id}`, { method: "DELETE" }).catch(() => {});
    setDeleteTarget(null);
    loadRoles();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {(["roles", "audit"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            style={{
              padding: "7px 16px", borderRadius: 20, border: `1px solid ${tab === k ? "#00D26A" : BORDER}`,
              backgroundColor: tab === k ? "rgba(0,210,106,0.1)" : "transparent",
              color: tab === k ? "#00D26A" : MUTED, fontSize: 13, fontWeight: tab === k ? 700 : 400, cursor: "pointer",
            }}
          >
            {k === "roles" ? t.tabRoles : t.tabAudit}
          </button>
        ))}
      </div>

      {tab === "roles" ? (
        <>
          <CreateAdminPanel roles={roles} lang={lang} dark={dark} onCreated={loadRoles} />
          <AssignRolePanel roles={roles} lang={lang} dark={dark} onAssigned={loadRoles} />

          <div style={cardStyle}>
            <div style={{ padding: 14, borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{t.tabRoles}</span>
              <button
                type="button"
                onClick={() => setShowNewRole((s) => !s)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontSize: 12.5, fontWeight: 700 }}
              >
                <Plus size={14} />{t.newRole}
              </button>
            </div>

            {showNewRole && (
              <form onSubmit={createRole} style={{ padding: 14, borderBottom: `1px solid ${BORDER}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input required style={inputStyle} placeholder={t.roleKeyPh} value={newRole.key}
                  onChange={(e) => setNewRole((r) => ({ ...r, key: e.target.value }))} />
                <input required style={inputStyle} placeholder={t.roleLabelArPh} value={newRole.labelAr}
                  onChange={(e) => setNewRole((r) => ({ ...r, labelAr: e.target.value }))} />
                <input required style={inputStyle} placeholder={t.roleLabelEnPh} value={newRole.labelEn}
                  onChange={(e) => setNewRole((r) => ({ ...r, labelEn: e.target.value }))} />
                <button type="submit" disabled={creating}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  {creating ? t.creating : t.create}
                </button>
                {newRoleError && <p style={{ width: "100%", margin: 0, fontSize: 12, color: "#EF4444" }}>{newRoleError}</p>}
              </form>
            )}

            {loading ? null : roles.length === 0 ? (
              <EmptyState message={t.noRoles} />
            ) : (
              roles.map((role) => {
                const isOpen = expandedId === role.id;
                return (
                  <div key={role.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <div
                      onClick={() => setExpandedId(isOpen ? null : role.id)}
                      style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {isOpen ? <ChevronUp size={14} color={MUTED} /> : <ChevronDown size={14} color={MUTED} />}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: TEXT }}>{lang === "ar" ? role.labelAr : role.labelEn}</div>
                          <div style={{ fontSize: 11.5, color: MUTED }}>{role.key} · {t.assignedCount(role.assignedCount)}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        title={t.deleteRole}
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(role); }}
                        style={{ display: "flex", background: "none", border: "none", cursor: "pointer", color: "#EF4444" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {isOpen && (
                      <div style={{ overflowX: "auto", padding: "0 14px 14px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: ar ? "right" : "left", padding: "6px 8px", color: MUTED, backgroundColor: TH }}>{t.tab}</th>
                              <th style={{ padding: "6px 8px", color: MUTED, backgroundColor: TH }}>{t.read}</th>
                              <th style={{ padding: "6px 8px", color: MUTED, backgroundColor: TH }}>{t.cr}</th>
                              <th style={{ padding: "6px 8px", color: MUTED, backgroundColor: TH }}>{t.up}</th>
                              <th style={{ padding: "6px 8px", color: MUTED, backgroundColor: TH }}>{t.del}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ADMIN_RESOURCE_KEYS.map((key) => {
                              const perm = role.permissions.find((p) => p.resourceKey === key)
                                ?? { canRead: false, canCreate: false, canUpdate: false, canDelete: false };
                              return (
                                <tr key={key}>
                                  <td style={{ padding: "6px 8px", color: TEXT, borderTop: `1px solid ${BORDER}` }}>{RESOURCE_LABELS[key][lang]}</td>
                                  {(["canRead", "canCreate", "canUpdate", "canDelete"] as const).map((field) => (
                                    <td key={field} style={{ padding: "6px 8px", textAlign: "center", borderTop: `1px solid ${BORDER}` }}>
                                      <input
                                        type="checkbox"
                                        checked={perm[field]}
                                        onChange={() => toggleCell(role, key, field)}
                                        style={{ cursor: "pointer" }}
                                      />
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div style={cardStyle}>
          {auditLoading ? null : auditEntries.length === 0 ? (
            <EmptyState message={t.noAudit} />
          ) : (
            auditEntries.map((entry) => (
              <div key={entry.id} style={{ padding: "12px 14px", borderBottom: `1px solid ${BORDER}`, fontSize: 12.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ color: TEXT, fontWeight: 600 }}>
                    {actionLabel(entry.action, t)}
                    {entry.roleKey && <span style={{ color: MUTED, fontWeight: 400 }}> · {entry.roleKey}</span>}
                    {entry.resourceKey && <span style={{ color: MUTED, fontWeight: 400 }}> · {t.on} {RESOURCE_LABELS[entry.resourceKey as AdminResourceKey]?.[lang] ?? entry.resourceKey}</span>}
                    {entry.targetUserName && <span style={{ color: MUTED, fontWeight: 400 }}> · {entry.targetUserName}</span>}
                  </span>
                  <span style={{ color: MUTED }}>
                    {new Date(entry.createdAt).toLocaleString(ar ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
                <div style={{ marginTop: 4, color: MUTED }}>{t.by} {entry.changedByName ?? "—"}</div>
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmationModal
        open={!!deleteTarget}
        title={t.deleteTitle}
        description={deleteTarget ? t.deleteDesc(deleteTarget.assignedCount) : undefined}
        confirmLabel={t.deleteRole}
        cancelLabel={t.cancel}
        onConfirm={confirmDeleteRole}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function actionLabel(action: AdminRoleAuditEntry["action"], t: (typeof TX)["ar"]): string {
  switch (action) {
    case "role_created": return t.roleCreated;
    case "role_deleted": return t.roleDeleted;
    case "permission_changed": return t.permChanged;
    case "assignment_changed": return t.assignChanged;
  }
}

// ─── Assign-role-to-admin panel ──────────────────────────────────────────
function AssignRolePanel({ roles, lang, dark, onAssigned }: { roles: AdminRole[]; lang: "ar" | "en"; dark: boolean; onAssigned: () => void }) {
  const t = TX[lang];
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AdminSearchResult | null>(null);
  const [roleChoice, setRoleChoice] = useState<string>(""); // "" = full access
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onQueryChange(value: string) {
    setQuery(value);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/admin/roles/admins?q=${encodeURIComponent(value)}`).catch(() => null);
      const data = await res?.json().catch(() => null) as { admins?: AdminSearchResult[] } | null;
      setResults(data?.admins ?? []);
    }, 300);
  }

  function pick(admin: AdminSearchResult) {
    setSelected(admin);
    setQuery(admin.fullName ?? admin.handle ?? "");
    setRoleChoice(admin.adminRoleId ?? "");
    setOpen(false);
  }

  async function submitAssign() {
    if (!selected) return;
    setSaving(true);
    await fetch("/api/admin/roles/assign", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selected.id, roleId: roleChoice || null }),
    }).catch(() => {});
    setSaving(false);
    setSelected(null);
    setQuery("");
    onAssigned();
  }

  const inputStyle: React.CSSProperties = { padding: "9px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 13 };

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Users size={14} color={MUTED} />
        <span style={{ fontWeight: 700, fontSize: 13.5, color: TEXT }}>{t.assignTo}</span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={13} color={MUTED} style={{ position: "absolute", insetInlineStart: 10, top: 12 }} />
          <input
            style={{ ...inputStyle, width: "100%", paddingInlineStart: 30 }}
            placeholder={t.searchAdmin}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => { if (blurTimer.current) clearTimeout(blurTimer.current); setOpen(true); }}
            onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 150); }}
          />
          {open && results.length > 0 && (
            <div style={{ position: "absolute", top: "100%", insetInlineStart: 0, right: 0, marginTop: 4, backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, zIndex: 10, maxHeight: 220, overflowY: "auto" }}>
              {results.map((admin) => (
                <div
                  key={admin.id}
                  onClick={() => pick(admin)}
                  style={{ padding: "8px 12px", cursor: "pointer", fontSize: 12.5, color: TEXT, borderBottom: `1px solid ${BORDER}` }}
                >
                  <div style={{ fontWeight: 600 }}>{admin.fullName ?? admin.handle}</div>
                  <div style={{ color: MUTED, fontSize: 11 }}>{admin.adminRoleLabel ?? t.fullAccess}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <>
            <select value={roleChoice} onChange={(e) => setRoleChoice(e.target.value)} style={inputStyle}>
              <option value="">{t.fullAccess}</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{lang === "ar" ? r.labelAr : r.labelEn}</option>)}
            </select>
            <button
              type="button" disabled={saving} onClick={submitAssign}
              style={{ padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
            >
              {t.assign}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Create-admin panel ──────────────────────────────────────────────────
// Mints a real, login-capable admin account — distinct from AssignRolePanel,
// which only reassigns the role on an admin who already exists.
function CreateAdminPanel({ roles, lang, dark, onCreated }: { roles: AdminRole[]; lang: "ar" | "en"; dark: boolean; onCreated: () => void }) {
  const t = TX[lang];
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";

  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", fullName: "", roleId: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputStyle: React.CSSProperties = { padding: "9px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 13 };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(false);
    if (form.password !== form.confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }
    setBusy(true);
    const res = await fetch("/api/admin/roles/create-admin", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email, password: form.password, fullName: form.fullName, roleId: form.roleId || null,
      }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null) as { error?: string } | null;
    setBusy(false);
    if (res?.ok) {
      setSuccess(true);
      setForm({ email: "", password: "", confirmPassword: "", fullName: "", roleId: "" });
      onCreated();
    } else {
      setError(data?.error ?? "failed");
    }
  }

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <UserPlus size={14} color={MUTED} />
        <span style={{ fontWeight: 700, fontSize: 13.5, color: TEXT }}>{t.createAdmin}</span>
      </div>
      <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input required type="text" style={inputStyle} placeholder={t.fullNamePh} value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
        <input required type="email" style={inputStyle} placeholder={t.emailPh} value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        <input required type="password" minLength={8} style={inputStyle} placeholder={t.passwordPh} value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
        <input required type="password" minLength={8} style={inputStyle} placeholder={t.confirmPasswordPh} value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))} />
        <select value={form.roleId} onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))} style={inputStyle} title={t.roleForNewAdmin}>
          <option value="">{t.fullAccess}</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{lang === "ar" ? r.labelAr : r.labelEn}</option>)}
        </select>
        <button
          type="submit" disabled={busy}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", opacity: busy ? 0.7 : 1 }}
        >
          {busy ? t.creating : t.createAdminBtn}
        </button>
      </form>
      {error && <p style={{ marginTop: 8, fontSize: 12.5, color: "#EF4444" }}>{error}</p>}
      {success && <p style={{ marginTop: 8, fontSize: 12.5, color: "#00D26A" }}>{t.createAdminSuccess}</p>}
    </div>
  );
}
