/**
 * AccountsPage — Professional institutional account management
 * Split-pane layout: left user list | right detail/edit/reset panel
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  getPortalUsers, getStudentAccounts,
  createPortalUser, updatePortalUser,
  toggleUserActive, deletePortalUser,
  resetStudentPassword, accountAvatarColor,
} from '../../../lib/userAccounts';
import { logActivity } from '../../../lib/activityLogger';
import { supabase } from '../../../lib/supabase';

/* ─── constants ─────────────────────────────────────────── */
const ROLE_META = {
  admin:   { color: '#002280', bg: '#eef1fb', label: 'Admin' },
  staff:   { color: '#10813f', bg: '#edf7f1', label: 'Staff' },
  student: { color: '#7c3aed', bg: '#f5f0ff', label: 'Student' },
};

const fmtDate = (val) =>
  val
    ? new Date(val).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
      })
    : '—';

/* ─── EyeIcon helper ─────────────────────────────────────── */
const EyeIcon = ({ open }) =>
  open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

/* ─── Toast ──────────────────────────────────────────────── */
const Toast = ({ msg, type }) => (
  <div className={`sl-toast sl-toast--${type}`}>{msg}</div>
);

/* ─── Add User Modal ─────────────────────────────────────── */
const AddUserModal = ({ onSave, onClose }) => {
  const [form, setForm]     = useState({ username: '', full_name: '', role: 'staff', password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { setErr('Full name is required.'); return; }
    if (!form.username.trim())  { setErr('Username is required.'); return; }
    if (!form.password)         { setErr('Password is required.'); return; }
    if (form.password !== form.confirm) { setErr('Passwords do not match.'); return; }
    setSaving(true);
    try {
      await onSave({ username: form.username.trim(), full_name: form.full_name.trim(), role: form.role, password: form.password });
      onClose();
    } catch (ex) {
      setErr(ex.message || 'Failed to create account.');
      setSaving(false);
    }
  };

  const inp = {
    width: '100%', padding: '9px 11px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', fontSize: '.87rem',
    outline: 'none', boxSizing: 'border-box',
    background: '#fafafa', color: '#1e293b', fontFamily: 'inherit',
  };
  const lbl = { display: 'block', marginBottom: 4, fontSize: '.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.03em' };
  const help = { fontSize: '.75rem', color: '#94a3b8', marginTop: 3 };

  return (
    <div className="sl-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sl-modal" style={{ maxWidth: 440, width: '100%' }}>
        <div className="sl-modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f1724' }}>Create Portal Account</h3>
            <p style={{ margin: '2px 0 0', fontSize: '.8rem', color: '#64748b' }}>New admin or staff user</p>
          </div>
          <button className="sl-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {err && (
          <div style={{ background: '#fee2e2', color: '#991b1b', fontSize: '.83rem', padding: '8px 12px', borderRadius: 8, marginTop: -4 }}>
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Full Name</label>
            <input style={inp} value={form.full_name} onChange={f('full_name')} placeholder="e.g. Juan Dela Cruz" autoFocus />
          </div>
          <div>
            <label style={lbl}>Username</label>
            <input style={inp} value={form.username} onChange={f('username')} placeholder="e.g. jdelacruz" autoComplete="off" />
          </div>
          <div>
            <label style={lbl}>Role</label>
            <select style={inp} value={form.role} onChange={f('role')} className="sl-select">
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
            <p style={help}>
              {form.role === 'admin' ? 'Full portal access — can manage all settings and users.' : 'Limited access — can manage records but not system settings.'}
            </p>
          </div>
          <div>
            <label style={lbl}>Password</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inp, paddingRight: 36 }} type={showPw ? 'text' : 'password'} value={form.password} onChange={f('password')} placeholder="••••••••" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPw((s) => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }} tabIndex={-1}>
                <EyeIcon open={showPw} />
              </button>
            </div>
          </div>
          <div>
            <label style={lbl}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inp, paddingRight: 36 }} type={showCf ? 'text' : 'password'} value={form.confirm} onChange={f('confirm')} placeholder="••••••••" autoComplete="new-password" />
              <button type="button" onClick={() => setShowCf((s) => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }} tabIndex={-1}>
                <EyeIcon open={showCf} />
              </button>
            </div>
          </div>
          <div className="sl-modal-actions" style={{ marginTop: 4 }}>
            <button type="button" className="sl-btn sl-btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="sl-btn sl-btn--primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Detail / Edit / Reset-Password right pane ─────────── */
const RightPane = ({ selectedUser, subTab, rightPaneMode, setRightPaneMode, onMutate, user: adminUser }) => {
  /* ── edit form state ── */
  const [editForm, setEditForm]   = useState({ full_name: '', role: 'staff', password: '' });
  const [editErr, setEditErr]     = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [showEditPw, setShowEditPw] = useState(false);

  /* ── reset pw form state ── */
  const [rpForm, setRpForm]       = useState({ newPw: '', confirm: '' });
  const [rpErr, setRpErr]         = useState('');
  const [rpSaving, setRpSaving]   = useState(false);
  const [showRpPw, setShowRpPw]   = useState(false);
  const [showRpCf, setShowRpCf]   = useState(false);

  /* ── last login ── */
  const [lastLogin, setLastLogin] = useState(null);
  const [llLoading, setLlLoading] = useState(false);

  /* sync edit form when selection changes */
  useEffect(() => {
    if (selectedUser && rightPaneMode === 'edit') {
      setEditForm({ full_name: selectedUser.full_name || '', role: selectedUser.role || 'staff', password: '' });
      setEditErr('');
    }
    if (rightPaneMode === 'reset-password') {
      setRpForm({ newPw: '', confirm: '' });
      setRpErr('');
    }
  }, [selectedUser, rightPaneMode]);

  /* fetch last login for portal users */
  useEffect(() => {
    if (!selectedUser || subTab !== 'portal') { setLastLogin(null); return; }
    let cancelled = false;
    setLlLoading(true);
    supabase
      .from('portal_sessions')
      .select('login_at')
      .eq('user_id', selectedUser.username)
      .order('login_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (!cancelled) {
          setLastLogin(data && data.length > 0 ? data[0].login_at : null);
          setLlLoading(false);
        }
      })
      .catch(() => { if (!cancelled) { setLastLogin(null); setLlLoading(false); } });
    return () => { cancelled = true; };
  }, [selectedUser, subTab]);

  if (!selectedUser) {
    return (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="db-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
          <p>Select a user to view details</p>
          <span>Click any user in the list on the left</span>
        </div>
      </div>
    );
  }

  const color   = accountAvatarColor(selectedUser.username || selectedUser.student_number);
  const name    = selectedUser.full_name || selectedUser.student_number || '—';
  const sub     = selectedUser.username || selectedUser.student_number || '—';
  const role    = selectedUser.role || 'student';
  const rc      = ROLE_META[role] || ROLE_META.student;
  const active  = selectedUser.is_active !== false;
  const isPortal = subTab === 'portal';

  const inp = {
    width: '100%', padding: '9px 11px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', fontSize: '.87rem',
    outline: 'none', boxSizing: 'border-box',
    background: '#fafafa', color: '#1e293b', fontFamily: 'inherit',
  };
  const lbl = { display: 'block', marginBottom: 4, fontSize: '.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.03em' };

  /* ── edit submit ── */
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.full_name.trim()) { setEditErr('Full name is required.'); return; }
    setEditSaving(true);
    try {
      const updates = { full_name: editForm.full_name.trim(), role: editForm.role };
      if (editForm.password) updates.password = editForm.password;
      await updatePortalUser(selectedUser.id, updates);
      await logActivity('user_updated', `Updated account: ${selectedUser.username}`, adminUser?.username, 'success', 'Accounts');
      onMutate('Account updated successfully.', 'success');
      setRightPaneMode('view');
    } catch (ex) {
      setEditErr(ex.message || 'Failed to save changes.');
    } finally {
      setEditSaving(false);
    }
  };

  /* ── reset-password submit ── */
  const handleRpSubmit = async (e) => {
    e.preventDefault();
    if (!rpForm.newPw) { setRpErr('New password is required.'); return; }
    if (rpForm.newPw !== rpForm.confirm) { setRpErr('Passwords do not match.'); return; }
    setRpSaving(true);
    try {
      if (isPortal) {
        await updatePortalUser(selectedUser.id, { password: rpForm.newPw });
        await logActivity('password_reset', `Reset password for ${selectedUser.username}`, adminUser?.username, 'success', 'Accounts');
      } else {
        await resetStudentPassword(selectedUser.student_number, rpForm.newPw);
        await logActivity('password_reset', `Reset password for student ${selectedUser.student_number}`, adminUser?.username, 'success', 'Accounts');
      }
      onMutate('Password reset successfully.', 'success');
      setRightPaneMode('view');
    } catch (ex) {
      setRpErr(ex.message || 'Failed to reset password.');
    } finally {
      setRpSaving(false);
    }
  };

  /* ── delete ── */
  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete account "${selectedUser.username}"?\nThis action cannot be undone.`)) return;
    try {
      await deletePortalUser(selectedUser.id);
      await logActivity('user_deleted', `Deleted account: ${selectedUser.username}`, adminUser?.username, 'success', 'Accounts');
      onMutate(`Account "${selectedUser.username}" deleted.`, 'success', true);
    } catch (ex) {
      onMutate(ex.message || 'Delete failed.', 'error', false);
    }
  };

  /* ── toggle ── */
  const handleToggle = async () => {
    try {
      await toggleUserActive(selectedUser.id, !active);
      await logActivity('user_toggled', `${active ? 'Deactivated' : 'Activated'} ${selectedUser.username}`, adminUser?.username, 'success', 'Accounts');
      onMutate(`Account ${active ? 'deactivated' : 'activated'}.`, 'success');
    } catch (ex) {
      onMutate(ex.message || 'Toggle failed.', 'error', false);
    }
  };

  const panelPad = { padding: '24px 28px', flex: 1, minWidth: 0, overflowY: 'auto' };

  /* ══ VIEW MODE ══ */
  if (rightPaneMode === 'view') {
    return (
      <div style={panelPad}>
        {/* Avatar + name + badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 700, flexShrink: 0,
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0f1724', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name}
            </div>
            <div style={{ fontSize: '.82rem', color: '#64748b', marginTop: 2 }}>{sub}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <span className="sl-dept-badge" style={{ color: rc.color, background: rc.bg, fontSize: '.72rem', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                {rc.label}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: '.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                color: active ? '#10813f' : '#6b7280',
                background: active ? '#edf7f1' : '#f1f5f9',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? '#10813f' : '#9ca3af', display: 'inline-block' }} />
                {active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0',
          border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden',
          marginBottom: 16, fontSize: '.83rem',
        }}>
          {[
            { label: 'Role',         value: rc.label },
            { label: 'Status',       value: active ? 'Active' : 'Inactive' },
            { label: 'Created',      value: fmtDate(selectedUser.created_at) },
            { label: 'Last Updated', value: fmtDate(selectedUser.updated_at) },
            ...(isPortal ? [{ label: 'Last Login', value: llLoading ? '…' : lastLogin ? fmtDate(lastLogin) : 'Never', span: 2 }] : []),
          ].map((item, idx) => (
            <div key={item.label} style={{
              padding: '10px 14px',
              gridColumn: item.span === 2 ? '1 / -1' : undefined,
              borderBottom: idx < (isPortal ? 4 : 4) - 1 ? '1px solid #f1f5f9' : undefined,
              borderRight: (item.span === 2 || idx % 2 === 1) ? undefined : '1px solid #f1f5f9',
              background: idx % 2 === 0 ? '#fafafa' : '#fff',
            }}>
              <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 2 }}>{item.label}</div>
              <div style={{ color: '#1e293b', fontWeight: 500 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Action bar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {isPortal && (
            <>
              <button className="sl-act-btn sl-act-btn--edit" onClick={() => { setEditForm({ full_name: selectedUser.full_name || '', role: selectedUser.role || 'staff', password: '' }); setEditErr(''); setRightPaneMode('edit'); }}
                style={{ width: 'auto', padding: '0 12px', gap: 5, fontSize: '.78rem', fontWeight: 600 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
              <button className="sl-act-btn sl-act-btn--toggle" onClick={handleToggle}
                style={{ width: 'auto', padding: '0 12px', gap: 5, fontSize: '.78rem', fontWeight: 600 }}>
                {active ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                )}
                {active ? 'Deactivate' : 'Activate'}
              </button>
            </>
          )}
          <button className="sl-act-btn" onClick={() => { setRpForm({ newPw: '', confirm: '' }); setRpErr(''); setRightPaneMode('reset-password'); }}
            style={{ width: 'auto', padding: '0 12px', gap: 5, fontSize: '.78rem', fontWeight: 600, color: '#0891b2', background: 'none', border: '1.5px solid #e2e8f0' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            Reset Password
          </button>
          {isPortal && (
            <button className="sl-act-btn sl-act-btn--del" onClick={handleDelete}
              style={{ width: 'auto', padding: '0 12px', gap: 5, fontSize: '.78rem', fontWeight: 600, marginLeft: 'auto' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
              </svg>
              Delete
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ══ EDIT MODE ══ */
  if (rightPaneMode === 'edit') {
    return (
      <div style={panelPad}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f1724' }}>Edit Account</h3>
            <p style={{ margin: '2px 0 0', fontSize: '.8rem', color: '#64748b' }}>{selectedUser.username}</p>
          </div>
        </div>

        {editErr && (
          <div style={{ background: '#fee2e2', color: '#991b1b', fontSize: '.83rem', padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>
            {editErr}
          </div>
        )}

        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Full Name</label>
            <input style={inp} value={editForm.full_name} onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="e.g. Juan Dela Cruz" autoFocus />
          </div>
          <div>
            <label style={lbl}>Role</label>
            <select style={inp} value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))} className="sl-select">
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div>
            <label style={lbl}>New Password <span style={{ fontWeight: 400, color: '#94a3b8', textTransform: 'none' }}>(leave blank to keep current)</span></label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inp, paddingRight: 36 }} type={showEditPw ? 'text' : 'password'} value={editForm.password}
                onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••" autoComplete="new-password" />
              <button type="button" onClick={() => setShowEditPw((s) => !s)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }} tabIndex={-1}>
                <EyeIcon open={showEditPw} />
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" className="sl-btn sl-btn--ghost" onClick={() => setRightPaneMode('view')} disabled={editSaving}>Cancel</button>
            <button type="submit" className="sl-btn sl-btn--primary" disabled={editSaving}>
              {editSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ══ RESET PASSWORD MODE ══ */
  if (rightPaneMode === 'reset-password') {
    return (
      <div style={panelPad}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f1724' }}>Reset Password</h3>
          <p style={{ margin: '2px 0 0', fontSize: '.8rem', color: '#64748b' }}>
            {isPortal ? selectedUser.username : selectedUser.student_number}
          </p>
        </div>

        {rpErr && (
          <div style={{ background: '#fee2e2', color: '#991b1b', fontSize: '.83rem', padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>
            {rpErr}
          </div>
        )}

        <form onSubmit={handleRpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inp, paddingRight: 36 }} type={showRpPw ? 'text' : 'password'} value={rpForm.newPw}
                onChange={(e) => setRpForm((p) => ({ ...p, newPw: e.target.value }))} placeholder="••••••••" autoFocus autoComplete="new-password" />
              <button type="button" onClick={() => setShowRpPw((s) => !s)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }} tabIndex={-1}>
                <EyeIcon open={showRpPw} />
              </button>
            </div>
          </div>
          <div>
            <label style={lbl}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inp, paddingRight: 36, borderColor: rpErr && rpErr.includes('match') ? '#f87171' : '#e2e8f0' }}
                type={showRpCf ? 'text' : 'password'} value={rpForm.confirm}
                onChange={(e) => setRpForm((p) => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" autoComplete="new-password" />
              <button type="button" onClick={() => setShowRpCf((s) => !s)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }} tabIndex={-1}>
                <EyeIcon open={showRpCf} />
              </button>
            </div>
            {rpErr && rpErr.includes('match') && (
              <p style={{ margin: '4px 0 0', fontSize: '.78rem', color: '#dc2626' }}>Passwords do not match</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" className="sl-btn sl-btn--ghost" onClick={() => setRightPaneMode('view')} disabled={rpSaving}>Cancel</button>
            <button type="submit" className="sl-btn sl-btn--primary" disabled={rpSaving}>
              {rpSaving ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return null;
};

/* ─── Main page ──────────────────────────────────────────── */
const AccountsPage = ({ user }) => {
  const [portalUsers,  setPortalUsers]  = useState([]);
  const [studentAccts, setStudentAccts] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [subTab,       setSubTab]       = useState('portal');
  const [toast,        setToast]        = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rightPaneMode, setRightPaneMode] = useState('view'); // 'view' | 'edit' | 'reset-password'
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pu, sa] = await Promise.all([getPortalUsers(), getStudentAccounts()]);
      setPortalUsers(pu);
      setStudentAccts(sa);
      /* refresh selectedUser if it exists */
      setSelectedUser((prev) => {
        if (!prev) return null;
        if (prev.username) {
          const updated = pu.find((u) => u.id === prev.id);
          return updated || null;
        }
        const updated = sa.find((u) => u.student_number === prev.student_number);
        return updated || null;
      });
    } catch (e) {
      showToast(e.message || 'Failed to load accounts.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* clear search when tab changes */
  useEffect(() => { setSearch(''); setSelectedUser(null); setRightPaneMode('view'); }, [subTab]);

  /* stats */
  const counts = useMemo(() => ({
    total:   portalUsers.length + studentAccts.length,
    portal:  portalUsers.length,
    active:  portalUsers.filter((u) => u.is_active !== false).length,
    student: studentAccts.length,
  }), [portalUsers, studentAccts]);

  /* filtered list */
  const currentList = subTab === 'portal' ? portalUsers : studentAccts;
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return currentList;
    return currentList.filter((u) =>
      [u.username, u.full_name, u.role, u.student_number]
        .some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [currentList, search]);

  /* handle mutation callback from RightPane */
  const handleMutate = useCallback((msg, type, clearSelection = false) => {
    showToast(msg, type);
    fetchAll();
    if (clearSelection) { setSelectedUser(null); setRightPaneMode('view'); }
  }, [showToast, fetchAll]);

  /* handle add user */
  const handleAddUser = async (form) => {
    await createPortalUser(form);
    await logActivity('user_created', `Created account: ${form.username}`, user?.username, 'success', 'Accounts');
    showToast(`Account "${form.username}" created.`);
    fetchAll();
  };

  const STAT_CARDS = [
    { label: 'Total Accounts',       value: counts.total,   color: '#002280', bg: '#eef1fb',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
    { label: 'Portal Users',         value: counts.portal,  color: '#10813f', bg: '#edf7f1',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { label: 'Active Portal Users',  value: counts.active,  color: '#C8960C', bg: '#fdf8ec',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { label: 'Student Accounts',     value: counts.student, color: '#7c3aed', bg: '#f5f0ff',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
  ];

  return (
    <div className="db-home-content" style={{ paddingBottom: '2rem' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Stats */}
      <div className="db-stats-row" style={{ marginBottom: '1.5rem' }}>
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="db-stat-card">
            <div className="db-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="db-stat-body">
              <p className="db-stat-value">{loading ? '—' : s.value}</p>
              <p className="db-stat-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Split pane */}
      <div style={{ display: 'flex', gap: 0, minHeight: 540, border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>

        {/* ── LEFT PANE ── */}
        <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          {/* Left header */}
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: '.92rem', fontWeight: 700, color: '#0f1724' }}>Users</span>
            {subTab === 'portal' && (
              <button className="sl-btn sl-btn--primary" onClick={() => setShowModal(true)}
                style={{ fontSize: '.75rem', padding: '4px 10px', gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add User
              </button>
            )}
          </div>

          {/* Tab toggle */}
          <div style={{ padding: '8px 10px 4px', flexShrink: 0 }}>
            <div className="sl-view-toggle" style={{ width: '100%' }}>
              {[{ key: 'portal', label: 'Portal Users' }, { key: 'student', label: 'Student Accounts' }].map((t) => (
                <button
                  key={t.key}
                  className={'sl-view-btn' + (subTab === t.key ? ' sl-view-btn--active' : '')}
                  onClick={() => setSubTab(t.key)}
                  style={{ flex: 1, padding: '0 6px', fontSize: '.73rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{ padding: '6px 10px 6px', flexShrink: 0 }}>
            <div className="sl-search-wrap" style={{ position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', zIndex: 1 }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className="sl-search" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 30, fontSize: '.8rem', width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* User list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="sl-card sl-card--skeleton" style={{ height: 44, margin: '4px 10px', borderRadius: 8 }} />
              ))
            ) : filtered.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '.82rem' }}>
                No users found.
              </div>
            ) : (
              filtered.map((u) => {
                const uColor  = accountAvatarColor(u.username || u.student_number);
                const uName   = u.full_name || u.student_number || '—';
                const uSub    = u.username || u.student_number || '';
                const uActive = u.is_active !== false;
                const isSel   = selectedUser && (
                  (u.id && selectedUser.id === u.id) ||
                  (u.student_number && selectedUser.student_number === u.student_number)
                );
                return (
                  <div
                    key={u.id || u.student_number}
                    onClick={() => { setSelectedUser(u); setRightPaneMode('view'); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '6px 12px', cursor: 'pointer', height: 44,
                      boxSizing: 'border-box',
                      background: isSel ? '#f0f4ff' : 'transparent',
                      borderLeft: isSel ? '3px solid #002280' : '3px solid transparent',
                      transition: 'background .12s',
                    }}
                    onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div className="sl-list-avatar" style={{ background: uColor, color: '#fff', width: 32, height: 32, flexShrink: 0, fontSize: '.82rem', fontWeight: 700 }}>
                      {uName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '.82rem', fontWeight: 700, color: '#0f1724', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{uName}</p>
                      <p style={{ margin: 0, fontSize: '.72rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{uSub}</p>
                    </div>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: uActive ? '#10813f' : '#9ca3af', flexShrink: 0 }} title={uActive ? 'Active' : 'Inactive'} />
                  </div>
                );
              })
            )}
          </div>

          {/* Count */}
          {!loading && (
            <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9', fontSize: '.72rem', color: '#94a3b8', flexShrink: 0 }}>
              {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
              {search && filtered.length !== currentList.length && ` of ${currentList.length}`}
            </div>
          )}
        </div>

        {/* ── RIGHT PANE ── */}
        <RightPane
          selectedUser={selectedUser}
          subTab={subTab}
          rightPaneMode={rightPaneMode}
          setRightPaneMode={setRightPaneMode}
          onMutate={handleMutate}
          user={user}
        />
      </div>

      {/* Add User Modal */}
      {showModal && (
        <AddUserModal
          onSave={handleAddUser}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default AccountsPage;
