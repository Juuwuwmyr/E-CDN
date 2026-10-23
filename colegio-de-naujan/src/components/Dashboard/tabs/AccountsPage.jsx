/**
 * AccountsPage — Admin-only "Accounts" tab
 * Lists portal users (admin/staff) + student registered accounts.
 * Same style as StudentsPage.
 */
import { useState, useEffect, useMemo, useRef } from "react";
import {
  getPortalUsers, getStudentAccounts,
  createPortalUser, updatePortalUser,
  toggleUserActive, deletePortalUser,
  accountAvatarColor,
} from "../../../lib/userAccounts";
import { logActivity } from "../../../lib/activityLogger";

const ROLE_COLORS = {
  admin:   { color: "#002280", bg: "#eef1fb" },
  staff:   { color: "#10813f", bg: "#edf7f1" },
  student: { color: "#7c3aed", bg: "#f5f0ff" },
};

/* ── User list row ── */
const UserRow = ({ user, index, onToggle, onDelete, onEdit, type }) => {
  const color = accountAvatarColor(user.username || user.student_number);
  const name  = user.full_name || user.student_number || "—";
  const init  = name.charAt(0).toUpperCase();
  const role  = user.role || "student";
  const rc    = ROLE_COLORS[role] || ROLE_COLORS.staff;
  const active = user.is_active !== false;

  return (
    <div className="sl-list-row">
      <span className="sl-list-num">{index + 1}</span>
      <div className="sl-list-avatar" style={{ background: color }}>{init}</div>
      <div className="sl-list-info">
        <p className="sl-list-name">{name}</p>
        <p className="sl-list-sn">{user.username || user.student_number}</p>
      </div>
      <span className="sl-dept-badge" style={{ color: rc.color, background: rc.bg }}>{role}</span>
      <span className={"sl-status-badge " + (active ? "sl-status-enrolled" : "sl-status-dropped")}>
        {active ? "Active" : "Inactive"}
      </span>
      <p className="sl-list-sn" style={{ marginLeft: "auto", minWidth: 90 }}>
        {user.created_at ? new Date(user.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}
      </p>
      {type === "portal" && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button className="sl-act-btn sl-act-btn--edit" onClick={() => onEdit(user)} title="Edit">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button className="sl-act-btn sl-act-btn--toggle" onClick={() => onToggle(user)} title={active ? "Deactivate" : "Activate"}>
            {active
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            }
          </button>
          <button className="sl-act-btn sl-act-btn--del" onClick={() => onDelete(user)} title="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

/* ── Add/Edit modal ── */
const UserModal = ({ editing, onSave, onClose }) => {
  const [form, setForm] = useState(
    editing
      ? { username: editing.username, full_name: editing.full_name, role: editing.role, password: "" }
      : { username: "", full_name: "", role: "staff", password: "" }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.full_name) { setErr("Username and full name are required."); return; }
    if (!editing && !form.password) { setErr("Password is required for new accounts."); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setSaving(false);
    }
  };

  const inp = {
    width: "100%", padding: "9px 11px", borderRadius: 8,
    border: "1.5px solid #e2e8f0", fontSize: ".87rem",
    outline: "none", boxSizing: "border-box", background: "#fafafa",
    color: "#1e293b", fontFamily: "inherit",
  };

  return (
    <div className="sl-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sl-modal">
        <div className="sl-modal-header">
          <h3>{editing ? "Edit Account" : "Add Account"}</h3>
          <button className="sl-modal-close" onClick={onClose}>✕</button>
        </div>
        {err && <p style={{ margin: 0, color: "#991b1b", fontSize: ".84rem", background: "#fee2e2", padding: "8px 12px", borderRadius: 8 }}>{err}</p>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontSize: ".74rem", fontWeight: 700, color: "#64748b" }}>Full Name</label>
            <input style={inp} value={form.full_name} onChange={f("full_name")} placeholder="e.g. Juan Dela Cruz" />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontSize: ".74rem", fontWeight: 700, color: "#64748b" }}>Username</label>
            <input style={inp} value={form.username} onChange={f("username")} placeholder="e.g. jdelacruz" disabled={!!editing} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontSize: ".74rem", fontWeight: 700, color: "#64748b" }}>Role</label>
            <select style={inp} value={form.role} onChange={f("role")}>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontSize: ".74rem", fontWeight: 700, color: "#64748b" }}>
              {editing ? "New Password (leave blank to keep)" : "Password"}
            </label>
            <input style={inp} type="password" value={form.password} onChange={f("password")} placeholder="••••••••" />
          </div>
          <div className="sl-modal-actions">
            <button type="button" className="sl-btn sl-btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="sl-btn sl-btn--primary" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main page ── */
const AccountsPage = ({ user }) => {
  const [portalUsers,    setPortalUsers]    = useState([]);
  const [studentAccts,   setStudentAccts]   = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [subTab,         setSubTab]         = useState("portal"); // portal | student
  const [toast,          setToast]          = useState(null);
  const [modal,          setModal]          = useState(null);  // null | "add" | user object
  const [page,           setPage]           = useState(0);
  const PAGE_SIZE = 20;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pu, sa] = await Promise.all([getPortalUsers(), getStudentAccounts()]);
      setPortalUsers(pu);
      setStudentAccts(sa);
    } catch (e) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { setPage(0); }, [search, subTab]);

  /* stat counts */
  const counts = useMemo(() => ({
    total:   portalUsers.length + studentAccts.length,
    portal:  portalUsers.length,
    active:  portalUsers.filter(u => u.is_active !== false).length,
    student: studentAccts.length,
  }), [portalUsers, studentAccts]);

  /* filtered list */
  const currentList = subTab === "portal" ? portalUsers : studentAccts;
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return currentList;
    return currentList.filter(u =>
      [u.username, u.full_name, u.role, u.student_number]
        .some(v => (v || "").toLowerCase().includes(q))
    );
  }, [currentList, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  /* handlers */
  const handleSave = async (form) => {
    if (modal === "add") {
      await createPortalUser(form);
      await logActivity("user_created", `Created account: ${form.username}`, user?.username, "success", "Accounts");
      showToast(`Account "${form.username}" created.`);
    } else {
      const updates = { full_name: form.full_name, role: form.role };
      if (form.password) updates.password = form.password;
      await updatePortalUser(modal.id, updates);
      await logActivity("user_updated", `Updated account: ${form.username}`, user?.username, "success", "Accounts");
      showToast(`Account "${form.username}" updated.`);
    }
    await fetchAll();
  };

  const handleToggle = async (u) => {
    await toggleUserActive(u.id, !u.is_active);
    await logActivity("user_toggled", `${u.is_active ? "Deactivated" : "Activated"} ${u.username}`, user?.username, "success", "Accounts");
    showToast(`Account ${u.is_active ? "deactivated" : "activated"}.`);
    await fetchAll();
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete account "${u.username}"? This cannot be undone.`)) return;
    await deletePortalUser(u.id);
    await logActivity("user_deleted", `Deleted account: ${u.username}`, user?.username, "success", "Accounts");
    showToast(`Account "${u.username}" deleted.`);
    await fetchAll();
  };

  const STAT_CARDS = [
    { label: "Total Accounts", value: counts.total,   color: "#002280", bg: "#eef1fb" },
    { label: "Portal Users",   value: counts.portal,  color: "#10813f", bg: "#edf7f1" },
    { label: "Active",         value: counts.active,  color: "#C8960C", bg: "#fdf8ec" },
    { label: "Student Accts",  value: counts.student, color: "#7c3aed", bg: "#f5f0ff" },
  ];

  return (
    <div className="db-home-content" style={{ paddingBottom: "4rem" }}>
      {toast && <div className={`sl-toast sl-toast--${toast.type}`}>{toast.msg}</div>}

      {/* Stat cards */}
      <div className="db-stats-row" style={{ marginBottom: "1.5rem" }}>
        {STAT_CARDS.map(s => (
          <div key={s.label} className="db-stat-card" style={{ "--sc": s.color, "--sc-bg": s.bg }}>
            <div className="db-stat-icon" style={{ background: s.bg, color: s.color }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div className="db-stat-body">
              <p className="db-stat-value">{loading ? "…" : s.value}</p>
              <p className="db-stat-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="sl-toolbar">
        <div className="sl-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="sl-search" placeholder="Search accounts…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Sub-tabs */}
        <div className="sl-view-toggle" style={{ marginLeft: 0 }}>
          {[{ key: "portal", label: "Portal Users" }, { key: "student", label: "Student Accounts" }].map(t => (
            <button
              key={t.key}
              className={"sl-view-btn" + (subTab === t.key ? " sl-view-btn--active" : "")}
              onClick={() => setSubTab(t.key)}
              style={{ width: "auto", padding: "0 12px", fontSize: ".8rem", fontWeight: 700 }}
            >{t.label}</button>
          ))}
        </div>

        <div className="sl-toolbar-right">
          {subTab === "portal" && (
            <button className="sl-btn sl-btn--primary" onClick={() => setModal("add")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Account
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      <div className="sl-count">
        Showing <strong>{filtered.length}</strong> of {currentList.length} accounts
        {search && <button className="sl-clear-btn" onClick={() => setSearch("")}>Clear</button>}
      </div>

      {/* List */}
      {loading ? (
        <div className="sl-loading">{[...Array(6)].map((_,i) => <div key={i} className="sl-card sl-card--skeleton" style={{ height: 56 }}/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="db-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          <p>No accounts found.</p>
        </div>
      ) : (
        <div className="sl-list">
          {paginated.map((u, i) => (
            <UserRow
              key={u.id || u.student_number}
              user={u}
              index={page * PAGE_SIZE + i}
              type={subTab}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={u => setModal(u)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="sl-pagination">
          <button className="sl-page-btn" onClick={() => setPage(0)} disabled={page === 0}>«</button>
          <button className="sl-page-btn" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>‹ Prev</button>
          <div className="sl-page-nums">
            {Array.from({ length: totalPages }, (_, i) => {
              if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
                return <button key={i} className={"sl-page-num" + (i === page ? " sl-page-num--active" : "")} onClick={() => setPage(i)}>{i + 1}</button>;
              if (Math.abs(i - page) === 2) return <span key={i} className="sl-page-ellipsis">…</span>;
              return null;
            })}
          </div>
          <button className="sl-page-btn" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next ›</button>
          <button className="sl-page-btn" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>»</button>
          <span className="sl-page-info">Page {page + 1} of {totalPages}</span>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <UserModal
          editing={modal === "add" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

export default AccountsPage;