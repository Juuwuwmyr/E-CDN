/**
 * SettingsDrawer
 * Right-side slide-in panel. Opened by clicking Settings in the profile dropdown.
 * Tabs: Account · Security · Notifications · System Logs
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { logActivity, getActivityLogs, getLogStats, exportLogsCSV } from '../../lib/activityLogger';
import { supabase } from '../../lib/supabase';

/* ────────────────────────────────────────────────────────────
   Shared primitives
──────────────────────────────────────────────────────────── */
const Toggle = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    style={{width: 40, height: 22, borderRadius: 11, border: 'none',
      background: checked ? '#002280' : '#cbd5e1',
      position: 'relative', flexShrink: 0, cursor: 'pointer',
      transition: 'background .18s',}}
  >
    <span style={{position: 'absolute', top: 2,
      left: checked ? 20 : 2,
      width: 18, height: 18, borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      transition: 'left .18s',
      display: 'block',}} />
  </button>
);

const Row = ({ label, hint, last, children }) => (
  <div style={{display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 16,
    padding: '13px 0',
    borderBottom: last ? 'none' : '1px solid #f1f5f9',}}>
    <div style={{minWidth: 0}}>
      <p style={{margin: 0, fontSize: '.87rem', fontWeight: 600, color: '#1e293b'}}>{label}</p>
      {hint && <p style={{margin: '2px 0 0', fontSize: '.74rem', color: '#94a3b8', lineHeight: 1.4}}>{hint}</p>}
    </div>
    {children}
  </div>
);

const GroupLabel = ({ children }) => (
  <p style={{margin: '22px 0 2px', fontSize: '.67rem', fontWeight: 800,
    textTransform: 'uppercase', letterSpacing: '.09em', color: '#94a3b8',}}>{children}</p>
);

/* ────────────────────────────────────────────────────────────
   Spinner
──────────────────────────────────────────────────────────── */
const Spinner = () => (
  <span style={{display: 'inline-block', width: 14, height: 14,
    border: '2px solid rgba(255,255,255,.4)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin .6s linear infinite', marginRight: 6,
    verticalAlign: 'middle',}} />
);

/* ────────────────────────────────────────────────────────────
   inputStyle
──────────────────────────────────────────────────────────── */
const inputStyle = (focused, error) => ({
  width: '100%', padding: '9px 11px', borderRadius: 8, boxSizing: 'border-box',
  border: `1.5px solid ${error ? '#fca5a5' : focused ? '#002280' : '#e2e8f0'}`,
  boxShadow: focused && !error ? '0 0 0 3px rgba(0,34,128,.08)' : 'none',
  fontSize: '.87rem', outline: 'none',
  background: '#fafafa', color: '#1e293b',
  transition: 'border-color .15s, box-shadow .15s',
});

/* ────────────────────────────────────────────────────────────
   Account Tab
──────────────────────────────────────────────────────────── */
const AccountTab = ({ user, showToast }) => {
  const [editing, setEditing]       = useState(false);
  const [fullName, setFullName]     = useState(user?.name ?? '');
  const [saving, setSaving]         = useState(false);
  const [nameFocused, setNameFocus] = useState(false);
  const [lastLogin, setLastLogin]   = useState(null);
  const [sessions, setSessions]     = useState(null);

  useEffect(() => {
    if (!user?.username) return;
    // Last login
    supabase
      .from('portal_sessions')
      .select('login_at')
      .eq('user_id', user.username)
      .order('login_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setLastLogin(new Date(data[0].login_at).toLocaleString('en-PH', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }));
      });
    // Active sessions count
    supabase
      .from('portal_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.username)
      .is('logout_at', null)
      .then(({ count }) => setSessions(count ?? 0));
  }, [user?.username]);

  const handleSave = async () => {
    if (!fullName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('portal_users')
        .update({ full_name: fullName.trim() })
        .eq('username', user.username);
      if (error) throw error;
      await logActivity('profile_update', `Full name updated`, user.username);
      showToast('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      showToast(err.message ?? 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const initial = (user?.name ?? 'U').charAt(0).toUpperCase();

  return (
    <div>
      {/* Avatar + header */}
      <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '4px 0 20px', borderBottom: '1px solid #f1f5f9'}}>
        <div style={{width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: 'linear-gradient(135deg,#002280,#0044cc)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '1.3rem', fontWeight: 800,}}>{initial}</div>
        <div style={{minWidth: 0}}>
          <p style={{margin: 0, fontSize: '.97rem', fontWeight: 800, color: '#0f1724', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
            {user?.name ?? 'User'}
          </p>
          <p style={{margin: '3px 0 0', fontSize: '.76rem', color: '#64748b'}}>
            {user?.role ?? 'Member'} · @{user?.username ?? '—'}
          </p>
        </div>
        <span style={{marginLeft: 'auto', flexShrink: 0, fontSize: '.69rem', fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '3px 9px', borderRadius: 20}}>Active</span>
      </div>

      <GroupLabel>Personal Info</GroupLabel>

      {/* Full Name row — editable */}
      <div style={{padding: '13px 0', borderBottom: '1px solid #f1f5f9'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editing ? 8 : 0}}>
          <div>
            <p style={{margin: 0, fontSize: '.87rem', fontWeight: 600, color: '#1e293b'}}>Full Name</p>
            {!editing && <p style={{margin: '2px 0 0', fontSize: '.74rem', color: '#94a3b8'}}>{user?.name ?? '—'}</p>}
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{padding: '5px 12px', borderRadius: 7, border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer'}}>Edit</button>
          )}
        </div>
        {editing && (
          <div style={{display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: 'column'}}>
            <input
              autoFocus
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              onFocus={() => setNameFocus(true)}
              onBlur={() => setNameFocus(false)}
              style={inputStyle(nameFocused, false)}
              placeholder="Enter full name"
            />
            <div style={{display: 'flex', gap: 8}}>
              <button
                onClick={handleSave}
                disabled={saving || !fullName.trim()}
                style={{padding: '7px 16px', borderRadius: 8, border: 'none', background: '#002280', color: '#fff', fontSize: '.83rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1, display: 'flex', alignItems: 'center'}}>
                {saving && <Spinner />}Save
              </button>
              <button onClick={() => { setEditing(false); setFullName(user?.name ?? ''); }} style={{padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: '.83rem', fontWeight: 600, color: '#64748b', cursor: 'pointer'}}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <Row label="Username" hint={`@${user?.username ?? '—'}`} />
      <Row label="Role">
        <span style={{fontSize: '.75rem', fontWeight: 700, background: '#eef1fb', color: '#002280', padding: '3px 10px', borderRadius: 20}}>{user?.role ?? 'Member'}</span>
      </Row>
      <Row label="Student No." hint={user?.studentNumber ?? (user?.userType === 'staff' ? 'Staff account' : '—')} last={!user?.course} />

      {user?.course && (
        <>
          <GroupLabel>Enrollment</GroupLabel>
          <Row label="Course" hint={user.course} />
          <Row label="Year Level" hint={user.yearLevel ?? '—'} last />
        </>
      )}

      <GroupLabel>Session Info</GroupLabel>
      <Row label="Last Login" hint={lastLogin ?? 'Loading...'} />
      <Row label="Active Sessions" hint="Sessions currently signed in" last>
        <span style={{fontSize: '.82rem', fontWeight: 800, color: '#002280'}}>{sessions === null ? '…' : sessions}</span>
      </Row>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Security Tab
──────────────────────────────────────────────────────────── */
const SecurityTab = ({ user, showToast }) => {
  const [form, setForm]   = useState({ current: '', next: '', confirm: '' });
  const [show, setShow]   = useState({ current: false, next: false, confirm: false });
  const [focus, setFocus] = useState({ current: false, next: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [revoking, setRevoking] = useState(null);

  // Load active sessions
  const loadSessions = useCallback(async () => {
    if (!user?.username) return;
    const { data } = await supabase
      .from('portal_sessions')
      .select('id,login_at')
      .eq('user_id', user.username)
      .is('logout_at', null)
      .order('login_at', { ascending: false });
    setSessions(data ?? []);
  }, [user?.username]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Password strength
  const strength = useMemo(() => {
    const pw = form.next;
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8)  s++;
    if (pw.length >= 12) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^a-zA-Z0-9]/.test(pw)) s++;
    return s;
  }, [form.next]);

  const strengthLabel = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][strength];

  const validate = () => {
    const e = {};
    if (!form.current) e.current = 'Required';
    if (form.next.length < 8) e.next = 'At least 8 characters';
    if (form.next !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      // Verify current password
      const { data, error } = await supabase
        .from('portal_users')
        .update({ password: form.next })
        .eq('username', user.username)
        .eq('password', form.current)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        setErrors({ current: 'Current password is incorrect' });
        return;
      }
      await logActivity('password_change', 'Password updated', user.username);
      showToast('Password updated successfully');
      setForm({ current: '', next: '', confirm: '' });
      setErrors({});
    } catch (err) {
      showToast(err.message ?? 'Failed to update password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const revokeSession = async (id) => {
    setRevoking(id);
    try {
      await supabase
        .from('portal_sessions')
        .update({ logout_at: new Date().toISOString() })
        .eq('id', id);
      await logActivity('session_revoked', `Session ${id} revoked`, user.username);
      showToast('Session revoked');
      await loadSessions();
    } catch {
      showToast('Failed to revoke session', 'error');
    } finally {
      setRevoking(null);
    }
  };

  const fields = [
    { key: 'current', label: 'Current Password' },
    { key: 'next',    label: 'New Password' },
    { key: 'confirm', label: 'Confirm New Password' },
  ];

  return (
    <div>
      <GroupLabel>Change Password</GroupLabel>
      <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        {fields.map(field => (
          <div key={field.key}>
            <label style={{display: 'block', marginBottom: 5, fontSize: '.74rem', fontWeight: 700, color: '#64748b'}}>{field.label}</label>
            <div style={{position: 'relative'}}>
              <input
                type={show[field.key] ? 'text' : 'password'}
                value={form[field.key]}
                onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                onFocus={() => setFocus(p => ({ ...p, [field.key]: true }))}
                onBlur={() => setFocus(p => ({ ...p, [field.key]: false }))}
                style={{...inputStyle(focus[field.key], !!errors[field.key]), paddingRight: 36}}
              />
              <button
                type="button"
                onClick={() => setShow(p => ({ ...p, [field.key]: !p[field.key] }))}
                style={{position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex'}}>
                {show[field.key]
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {errors[field.key] && <p style={{margin: '4px 0 0', fontSize: '.72rem', color: '#ef4444'}}>{errors[field.key]}</p>}
            {/* Strength bars under new password */}
            {field.key === 'next' && form.next && (
              <div style={{marginTop: 6}}>
                <div style={{display: 'flex', gap: 4}}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{flex: 1, height: 4, borderRadius: 2, background: i <= strength ? strengthColor : '#e2e8f0', transition: 'background .2s'}} />
                  ))}
                </div>
                <p style={{margin: '3px 0 0', fontSize: '.71rem', color: strengthColor, fontWeight: 600}}>{strengthLabel}</p>
              </div>
            )}
          </div>
        ))}
        <button
          type="submit"
          disabled={saving}
          style={{padding: '10px', borderRadius: 9, border: 'none', background: '#002280', color: '#fff', fontSize: '.87rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {saving && <Spinner />}Update Password
        </button>
      </form>

      <GroupLabel>Two-Factor Auth</GroupLabel>
      <Row label="Enable 2FA" hint="Require a one-time code when signing in" last>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <span style={{fontSize: '.67rem', fontWeight: 700, background: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: 20}}>Coming Soon</span>
          <Toggle checked={false} onChange={() => {}} />
        </div>
      </Row>

      <GroupLabel>Active Sessions</GroupLabel>
      {sessions.length === 0 ? (
        <p style={{fontSize: '.82rem', color: '#94a3b8', padding: '8px 0'}}>No active sessions found.</p>
      ) : sessions.map((s) => (
        <div key={s.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '11px 14px', marginBottom: 8}}>
          <div>
            <p style={{margin: 0, fontSize: '.85rem', fontWeight: 700, color: '#1e293b'}}>Session</p>
            <p style={{margin: '2px 0 0', fontSize: '.74rem', color: '#94a3b8'}}>
              {new Date(s.login_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            onClick={() => revokeSession(s.id)}
            disabled={revoking === s.id}
            style={{padding: '5px 12px', borderRadius: 7, border: '1.5px solid #fca5a5', background: '#fff', color: '#ef4444', fontSize: '.76rem', fontWeight: 700, cursor: revoking === s.id ? 'not-allowed' : 'pointer', opacity: revoking === s.id ? .6 : 1}}>
            {revoking === s.id ? 'Revoking…' : 'Revoke'}
          </button>
        </div>
      ))}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Notifications Tab  (localStorage-backed)
──────────────────────────────────────────────────────────── */
const NOTIF_KEY = 'cdn_notif_prefs';

const NotificationsTab = () => {
  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(NOTIF_KEY)) ?? { email: true, system: true, login: true, digest: false };
    } catch { return { email: true, system: true, login: true, digest: false }; }
  });
  const [saved, setSaved] = useState(false);

  const toggle = useCallback(k => {
    setPrefs(p => {
      const next = { ...p, [k]: !p[k] };
      localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      return next;
    });
  }, []);

  const items = [
    { key: 'email',  label: 'Email Notifications', hint: 'Get notified about important updates' },
    { key: 'system', label: 'System Alerts',        hint: 'Downtime and maintenance notices' },
    { key: 'login',  label: 'Login Alerts',         hint: 'Notify me on new sign-ins' },
    { key: 'digest', label: 'Weekly Digest',        hint: 'Activity summary every Monday' },
  ];

  return (
    <div>
      <GroupLabel>Email &amp; Alerts</GroupLabel>
      {items.map((item, i) => (
        <Row key={item.key} label={item.label} hint={item.hint} last={i === items.length - 1}>
          <Toggle checked={prefs[item.key]} onChange={() => toggle(item.key)} />
        </Row>
      ))}
      {saved && (
        <p style={{marginTop: 12, fontSize: '.8rem', fontWeight: 700, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 5}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Saved
        </p>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   System Logs Tab  (Supabase-backed)
──────────────────────────────────────────────────────────── */
const SystemLogsTab = ({ user }) => {
  const [logs,       setLogs]       = useState([]);
  const [stats,      setStats]      = useState({ total: 0, todayCount: 0, failedCount: 0 });
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [action,     setAction]     = useState('all');
  const [status,     setStatus]     = useState('all');
  const [page,       setPage]       = useState(0);
  const PER = 15;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [data, s] = await Promise.all([
        getActivityLogs({ limit: 500, search: search || null, action, status }),
        getLogStats(),
      ]);
      setLogs(data);
      setStats(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  useEffect(() => {
    setPage(0);
    fetchLogs();
  }, [action, status]);

  const filtered = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter(l =>
      [l.user_id, l.action, l.details, l.module]
        .some(v => (v||'').toLowerCase().includes(q))
    );
  }, [logs, search]);

  const totalPages = Math.ceil(filtered.length / PER);
  const slice      = filtered.slice(page * PER, (page + 1) * PER);

  const actionOpts = useMemo(() => ['all', ...new Set(logs.map(l => l.action).filter(Boolean))], [logs]);

  const badge = s => ({
    success: { bg:'#dcfce7', color:'#166534' },
    failed:  { bg:'#fee2e2', color:'#991b1b' },
    warning: { bg:'#fef9c3', color:'#854d0e' },
  }[s] ?? { bg:'#f1f5f9', color:'#64748b' });

  const inp = {
    padding: '7px 10px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', fontSize: '.8rem',
    outline: 'none', background: '#fafafa', color: '#374151', fontFamily: 'inherit',
  };

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16}}>
        {[
          { label:'Total',  value: loading ? '…' : stats.total,       color:'#002280' },
          { label:'Today',  value: loading ? '…' : stats.todayCount,  color:'#10813f' },
          { label:'Failed', value: loading ? '…' : stats.failedCount, color:'#C8102E' },
        ].map(c => (
          <div key={c.label} style={{background:'#f8fafc', border:'1px solid #e2e8f0',
            borderRadius:10, padding:'10px 0', textAlign:'center',}}>
            <p style={{margin:0, fontSize:'1.3rem', fontWeight:900, color:c.color, lineHeight:1}}>{c.value}</p>
            <p style={{margin:'4px 0 0', fontSize:'.69rem', fontWeight:600, color:'#94a3b8'}}>{c.label}</p>
          </div>
        ))}
      </div>

      <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:10}}>
        <input
          style={{...inp, flex:1, minWidth:80}}
          placeholder="Search user, action, details…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
        />
        <select style={inp} value={action} onChange={e => setAction(e.target.value)}>
          {actionOpts.map(a => (
            <option key={a} value={a}>{a === 'all' ? 'All actions' : a.replace(/_/g,' ')}</option>
          ))}
        </select>
        <select style={inp} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">All status</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="failed">Failed</option>
        </select>
        <button
          onClick={fetchLogs}
          style={{...inp, cursor:'pointer', background:'#eef1fb', color:'#002280', fontWeight:700, border:'1.5px solid #c7d2fe'}}
        >↻ Refresh</button>
        <button
          onClick={() => exportLogsCSV(filtered)}
          style={{...inp, cursor:'pointer', background:'#fff', fontWeight:700, display:'flex', alignItems:'center', gap:4}}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          CSV
        </button>
      </div>

      <div style={{border:'1px solid #f1f5f9', borderRadius:10, overflow:'hidden', fontSize:'.78rem'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 70px 65px',
          padding:'8px 12px', background:'#f8fafc',
          borderBottom:'1px solid #f1f5f9',
          fontSize:'.66rem', fontWeight:800, textTransform:'uppercase',
          letterSpacing:'.06em', color:'#94a3b8',}}>
          <span>Timestamp · User · Action</span>
          <span>Module</span>
          <span>Status</span>
        </div>

        {loading ? (
          <p style={{padding:'24px', textAlign:'center', color:'#94a3b8', margin:0}}>Loading…</p>
        ) : slice.length === 0 ? (
          <p style={{padding:'24px', textAlign:'center', color:'#94a3b8', margin:0}}>No logs found.</p>
        ) : slice.map((log, i) => {
          const { bg, color } = badge(log.status);
          return (
            <div key={log.id ?? i} style={{display:'grid', gridTemplateColumns:'1fr 70px 65px',
              padding:'9px 12px', borderBottom:'1px solid #f8fafc',
              alignItems:'center', gap:8,}}>
              <div style={{minWidth:0}}>
                <p style={{margin:0, fontWeight:700, color:'#1e293b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                  {(log.action||'').replace(/_/g,' ')}
                </p>
                <p style={{margin:'2px 0 0', color:'#94a3b8', fontSize:'.71rem'}}>
                  {log.user_id || log.userId || '—'} · {new Date(log.created_at || log.timestamp).toLocaleString('en-PH',{ month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                </p>
              </div>
              <span style={{fontSize:'.71rem', color:'#64748b'}}>{log.module || '—'}</span>
              <span style={{background:bg, color, borderRadius:6, padding:'3px 8px', fontSize:'.68rem', fontWeight:700, textTransform:'capitalize', whiteSpace:'nowrap'}}>
                {log.status}
              </span>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, fontSize:'.78rem', color:'#64748b'}}>
          <span>{filtered.length} entries</span>
          <div style={{display:'flex', gap:6}}>
            <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0}
              style={{padding:'5px 10px', borderRadius:7, border:'1.5px solid #e2e8f0', background:'#fff', cursor: page===0?'not-allowed':'pointer', opacity: page===0?.4:1, fontFamily:'inherit', fontWeight:600}}>← Prev</button>
            <span style={{lineHeight:'30px'}}>{page+1}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}
              style={{padding:'5px 10px', borderRadius:7, border:'1.5px solid #e2e8f0', background:'#fff', cursor: page>=totalPages-1?'not-allowed':'pointer', opacity: page>=totalPages-1?.4:1, fontFamily:'inherit', fontWeight:600}}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   SettingsDrawer  (default export — used by DashboardShell)
──────────────────────────────────────────────────────────── */
const TABS = ['Account', 'Security', 'Notifications', 'System Logs'];

const SettingsDrawer = ({ open, onClose, user }) => {
  const [tab, setTab] = useState('Account');
  const [toast, setToast] = useState(null);
  const _ref = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{position:'fixed', inset:0, zIndex:400,
          background:'rgba(15,23,36,.35)',
          backdropFilter:'blur(2px)',
          animation:'sDrawerBdIn .2s ease',}}
      />

      {/* drawer panel */}
      <div
        ref={_ref}
        role="dialog"
        aria-label="Settings"
        style={{position:'fixed', top:0, right:0, bottom:0, zIndex:401,
          width: 420, maxWidth:'95vw',
          background:'#fff',
          boxShadow:'-8px 0 40px rgba(0,34,128,.12)',
          display:'flex', flexDirection:'column',
          animation:'sDrawerIn .22s cubic-bezier(.16,1,.3,1)',}}
      >
        {/* Header */}
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'18px 22px 16px',
          borderBottom:'1px solid #f1f5f9',
          flexShrink:0,}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:34, height:34, borderRadius:9, background:'#eef1fb', color:'#002280', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </div>
            <div>
              <p style={{margin:0, fontSize:'.97rem', fontWeight:800, color:'#0f1724'}}>Settings</p>
              <p style={{margin:0, fontSize:'.72rem', color:'#94a3b8'}}>Manage your account &amp; preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            style={{width:32, height:32, borderRadius:8, border:'1.5px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center'}}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6"  y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div style={{display:'flex', gap:0, padding:'0 22px', borderBottom:'2px solid #f1f5f9', flexShrink:0, overflowX:'auto'}}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{padding:'11px 14px', border:'none', background:'none', cursor:'pointer', fontSize:'.82rem', fontWeight: tab===t ? 700 : 600, color: tab===t ? '#002280' : '#94a3b8', borderBottom: tab===t ? '2px solid #002280' : '2px solid transparent', marginBottom:'-2px', whiteSpace:'nowrap', transition:'color .15s'}}
            >{t}</button>
          ))}
        </div>

        {/* Scrollable content */}
        <div style={{flex:1, overflowY:'auto', padding:'6px 22px 32px', position: 'relative'}}>
          {tab === 'Account'       && <AccountTab       user={user} showToast={showToast} />}
          {tab === 'Security'      && <SecurityTab      user={user} showToast={showToast} />}
          {tab === 'Notifications' && <NotificationsTab />}
          {tab === 'System Logs'   && <SystemLogsTab    user={user} />}

          {/* Toast */}
          {toast && (
            <div style={{position: 'sticky', bottom: 0, left: 0, right: 0,
              background: toast.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: toast.type === 'success' ? '#166534' : '#991b1b',
              borderRadius: 10, padding: '11px 16px',
              fontSize: '.84rem', fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0,0,0,.12)',
              display: 'flex', alignItems: 'center', gap: 8,
              marginTop: 16,
              animation: 'sDrawerBdIn .2s ease',}}>
              <span>{toast.type === 'success' ? '✓' : '✕'}</span>
              {toast.message}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes sDrawerIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes sDrawerBdIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default SettingsDrawer;
