/**
 * SettingsDrawer
 * Right-side slide-in panel. Opened by clicking Settings in the profile dropdown.
 * Tabs: Account · Security · Notifications · System Logs
 */
import { useState, useEffect, useMemo } from 'react';
import { logActivity, getActivityLogs, getLogStats, exportLogsCSV } from '../../lib/activityLogger';

/* ────────────────────────────────────────────────────────────
   Shared primitives
──────────────────────────────────────────────────────────── */
const Toggle = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    style={{
      width: 40, height: 22, borderRadius: 11, border: 'none',
      background: checked ? '#002280' : '#cbd5e1',
      position: 'relative', flexShrink: 0, cursor: 'pointer',
      transition: 'background .18s',
    }}
  >
    <span style={{
      position: 'absolute', top: 2,
      left: checked ? 20 : 2,
      width: 18, height: 18, borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      transition: 'left .18s',
      display: 'block',
    }} />
  </button>
);

const Row = ({ label, hint, last, children }) => (
  <div style={{
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 16,
    padding: '13px 0',
    borderBottom: last ? 'none' : '1px solid #f1f5f9',
  }}>
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: '.87rem', fontWeight: 600, color: '#1e293b' }}>{label}</p>
      {hint && <p style={{ margin: '2px 0 0', fontSize: '.74rem', color: '#94a3b8', lineHeight: 1.4 }}>{hint}</p>}
    </div>
    {children}
  </div>
);

const GroupLabel = ({ children }) => (
  <p style={{
    margin: '22px 0 2px', fontSize: '.67rem', fontWeight: 800,
    textTransform: 'uppercase', letterSpacing: '.09em', color: '#94a3b8',
  }}>{children}</p>
);

const SaveBtn = ({ onClick, children = 'Save changes' }) => (
  <button
    onClick={onClick}
    style={{
      marginTop: 20, padding: '10px 22px', borderRadius: 9, border: 'none',
      background: '#002280', color: '#fff', fontSize: '.86rem',
      fontWeight: 700, cursor: 'pointer',
      transition: 'opacity .15s',
    }}
    onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
  >
    {children}
  </button>
);

/* ────────────────────────────────────────────────────────────
   Account Tab
──────────────────────────────────────────────────────────── */
const AccountTab = ({ user }) => {
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';
  return (
    <div>
      {/* Profile header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '4px 0 20px', borderBottom: '1px solid #f1f5f9',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: 'linear-gradient(135deg,#002280,#0044cc)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '1.3rem', fontWeight: 800,
        }}>{initial}</div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '.97rem', fontWeight: 800, color: '#0f1724',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.name ?? 'User'}
          </p>
          <p style={{ margin: '3px 0 0', fontSize: '.76rem', color: '#64748b' }}>
            {user?.role ?? 'Member'} · {user?.username ?? '—'}
          </p>
        </div>
        <span style={{
          marginLeft: 'auto', flexShrink: 0,
          fontSize: '.69rem', fontWeight: 700,
          background: '#dcfce7', color: '#166534',
          padding: '3px 9px', borderRadius: 20,
        }}>Active</span>
      </div>

      <GroupLabel>Personal info</GroupLabel>
      <Row label="Full Name"      hint={user?.name ?? '—'} />
      <Row label="Username"       hint={user?.username ?? '—'} />
      <Row label="Role"           hint={user?.role ?? '—'} />
      <Row label="Student No."    hint={user?.studentNumber ?? (user?.userType === 'staff' ? 'Staff account' : '—')} last={!user?.course} />

      {user?.course && (
        <>
          <GroupLabel>Enrollment</GroupLabel>
          <Row label="Course"     hint={user.course} />
          <Row label="Year Level" hint={user.yearLevel ?? '—'} last />
        </>
      )}

      <button style={{
        marginTop: 20, padding: '9px 18px', borderRadius: 9,
        border: '1.5px solid #e2e8f0', background: '#fff',
        fontSize: '.85rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer',
      }}>
        Edit Profile
      </button>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Security Tab
──────────────────────────────────────────────────────────── */
const SecurityTab = ({ user }) => {
  const [form,  setForm]  = useState({ current: '', next: '', confirm: '' });
  const [twoFA, setTwoFA] = useState(false);
  const [msg,   setMsg]   = useState('');

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.current || !form.next) return;
    if (form.next !== form.confirm) { setMsg('error'); return; }
    logActivity('password_change', 'Password updated', user?.username);
    setForm({ current: '', next: '', confirm: '' });
    setMsg('ok');
    setTimeout(() => setMsg(''), 3500);
  };

  return (
    <div>
      {msg === 'ok' && (
        <div style={{ background: '#dcfce7', color: '#166534', borderRadius: 9,
          padding: '9px 13px', fontSize: '.84rem', fontWeight: 600, marginBottom: 14 }}>
          ✓ Password updated successfully
        </div>
      )}
      {msg === 'error' && (
        <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 9,
          padding: '9px 13px', fontSize: '.84rem', fontWeight: 600, marginBottom: 14 }}>
          Passwords don't match — please try again.
        </div>
      )}

      <GroupLabel>Change Password</GroupLabel>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { key: 'current', label: 'Current password' },
          { key: 'next',    label: 'New password' },
          { key: 'confirm', label: 'Confirm new password' },
        ].map(field => (
          <div key={field.key}>
            <label style={{
              display: 'block', marginBottom: 5,
              fontSize: '.74rem', fontWeight: 700, color: '#64748b',
            }}>{field.label}</label>
            <input
              type="password"
              value={form[field.key]}
              onChange={f(field.key)}
              style={{
                width: '100%', padding: '9px 11px', borderRadius: 8,
                border: '1.5px solid #e2e8f0', fontSize: '.87rem',
                outline: 'none', boxSizing: 'border-box',
                background: '#fafafa', color: '#1e293b',
              }}
            />
          </div>
        ))}
        <button type="submit" style={{
          padding: '10px', borderRadius: 9, border: 'none',
          background: '#002280', color: '#fff',
          fontSize: '.87rem', fontWeight: 700, cursor: 'pointer', marginTop: 2,
        }}>
          Update Password
        </button>
      </form>

      <GroupLabel>Two-Factor Auth</GroupLabel>
      <Row label="Enable 2FA" hint="Require a one-time code when signing in" last>
        <Toggle checked={twoFA} onChange={setTwoFA} />
      </Row>

      <GroupLabel>Active Sessions</GroupLabel>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: 10, padding: '11px 14px',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '.85rem', fontWeight: 700, color: '#1e293b' }}>This device</p>
          <p style={{ margin: '2px 0 0', fontSize: '.74rem', color: '#94a3b8' }}>Current session · just now</p>
        </div>
        <span style={{ fontSize: '.69rem', fontWeight: 700,
          background: '#dcfce7', color: '#166534', padding: '3px 9px', borderRadius: 20 }}>
          Online
        </span>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Notifications Tab
──────────────────────────────────────────────────────────── */
const NotificationsTab = () => {
  const [prefs, setPrefs] = useState({
    email: true, system: true, login: true, digest: false,
  });
  const toggle = k => setPrefs(p => ({ ...p, [k]: !p[k] }));

  const items = [
    { key: 'email',  label: 'Email Notifications',    hint: 'Get notified about important updates' },
    { key: 'system', label: 'System Alerts',           hint: 'Downtime and maintenance notices' },
    { key: 'login',  label: 'Login Alerts',            hint: 'Notify me on new sign-ins' },
    { key: 'digest', label: 'Weekly Digest',           hint: 'Activity summary every Monday' },
  ];

  return (
    <div>
      <GroupLabel>Email & Alerts</GroupLabel>
      {items.map((item, i) => (
        <Row key={item.key} label={item.label} hint={item.hint} last={i === items.length - 1}>
          <Toggle checked={prefs[item.key]} onChange={() => toggle(item.key)} />
        </Row>
      ))}
      <SaveBtn onClick={() => logActivity('notifications_updated', 'Preferences saved')} />
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

  // Re-fetch when filters change
  useEffect(() => {
    setPage(0);
    fetchLogs();
  }, [action, status]);

  // Client-side search filter (fast, no extra round trip)
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
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
        {[
          { label:'Total',  value: loading ? '…' : stats.total,       color:'#002280' },
          { label:'Today',  value: loading ? '…' : stats.todayCount,  color:'#10813f' },
          { label:'Failed', value: loading ? '…' : stats.failedCount, color:'#C8102E' },
        ].map(c => (
          <div key={c.label} style={{
            background:'#f8fafc', border:'1px solid #e2e8f0',
            borderRadius:10, padding:'10px 0', textAlign:'center',
          }}>
            <p style={{ margin:0, fontSize:'1.3rem', fontWeight:900, color:c.color, lineHeight:1 }}>{c.value}</p>
            <p style={{ margin:'4px 0 0', fontSize:'.69rem', fontWeight:600, color:'#94a3b8' }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
        <input
          style={{ ...inp, flex:1, minWidth:80 }}
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
          style={{ ...inp, cursor:'pointer', background:'#eef1fb', color:'#002280', fontWeight:700, border:'1.5px solid #c7d2fe' }}
        >↻ Refresh</button>
        <button
          onClick={() => exportLogsCSV(filtered)}
          style={{ ...inp, cursor:'pointer', background:'#fff', fontWeight:700, display:'flex', alignItems:'center', gap:4 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ border:'1px solid #f1f5f9', borderRadius:10, overflow:'hidden', fontSize:'.78rem' }}>
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 70px 65px',
          padding:'8px 12px', background:'#f8fafc',
          borderBottom:'1px solid #f1f5f9',
          fontSize:'.66rem', fontWeight:800, textTransform:'uppercase',
          letterSpacing:'.06em', color:'#94a3b8',
        }}>
          <span>Timestamp · User · Action</span>
          <span>Module</span>
          <span>Status</span>
        </div>

        {loading ? (
          <p style={{ padding:'24px', textAlign:'center', color:'#94a3b8', margin:0 }}>Loading…</p>
        ) : slice.length === 0 ? (
          <p style={{ padding:'24px', textAlign:'center', color:'#94a3b8', margin:0 }}>No logs found.</p>
        ) : slice.map((log, i) => {
          const { bg, color } = badge(log.status);
          return (
            <div key={log.id ?? i} style={{
              display:'grid', gridTemplateColumns:'1fr 70px 65px',
              padding:'9px 12px', borderBottom:'1px solid #f8fafc',
              alignItems:'center', gap:8,
            }}>
              <div style={{ minWidth:0 }}>
                <p style={{ margin:0, fontWeight:700, color:'#1e293b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {(log.action||'').replace(/_/g,' ')}
                </p>
                <p style={{ margin:'2px 0 0', color:'#94a3b8', fontSize:'.71rem' }}>
                  {log.user_id || log.userId || '—'} · {new Date(log.created_at || log.timestamp).toLocaleString('en-PH',{ month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                </p>
              </div>
              <span style={{ fontSize:'.71rem', color:'#64748b' }}>{log.module || '—'}</span>
              <span style={{ background:bg, color, borderRadius:6, padding:'3px 8px', fontSize:'.68rem', fontWeight:700, textTransform:'capitalize', whiteSpace:'nowrap' }}>
                {log.status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, fontSize:'.78rem', color:'#64748b' }}>
          <span>{filtered.length} entries</span>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0}
              style={{ padding:'5px 10px', borderRadius:7, border:'1.5px solid #e2e8f0', background:'#fff', cursor: page===0?'not-allowed':'pointer', opacity: page===0?.4:1, fontFamily:'inherit', fontWeight:600 }}>← Prev</button>
            <span style={{ lineHeight:'30px' }}>{page+1}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}
              style={{ padding:'5px 10px', borderRadius:7, border:'1.5px solid #e2e8f0', background:'#fff', cursor: page>=totalPages-1?'not-allowed':'pointer', opacity: page>=totalPages-1?.4:1, fontFamily:'inherit', fontWeight:600 }}>Next →</button>
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

  /* close on Escape */
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  /* lock body scroll when open */
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
        style={{
          position:'fixed', inset:0, zIndex:400,
          background:'rgba(15,23,36,.35)',
          backdropFilter:'blur(2px)',
          animation:'sDrawerBdIn .2s ease',
        }}
      />

      {/* drawer panel */}
      <div
        role="dialog"
        aria-label="Settings"
        style={{
          position:'fixed', top:0, right:0, bottom:0, zIndex:401,
          width: 420, maxWidth:'95vw',
          background:'#fff',
          boxShadow:'-8px 0 40px rgba(0,34,128,.12)',
          display:'flex', flexDirection:'column',
          animation:'sDrawerIn .22s cubic-bezier(.16,1,.3,1)',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'18px 22px 16px',
          borderBottom:'1px solid #f1f5f9',
          flexShrink:0,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:34, height:34, borderRadius:9,
              background:'#eef1fb', color:'#002280',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </div>
            <div>
              <p style={{ margin:0, fontSize:'.97rem', fontWeight:800, color:'#0f1724' }}>Settings</p>
              <p style={{ margin:0, fontSize:'.72rem', color:'#94a3b8' }}>Manage your account &amp; preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            style={{
              width:32, height:32, borderRadius:8, border:'1.5px solid #e2e8f0',
              background:'#f8fafc', cursor:'pointer', color:'#64748b',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6"  y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div style={{
          display:'flex', gap:0,
          padding:'0 22px',
          borderBottom:'2px solid #f1f5f9',
          flexShrink:0, overflowX:'auto',
        }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding:'11px 14px',
                border:'none', background:'none', cursor:'pointer',
                fontSize:'.82rem', fontWeight: tab===t ? 700 : 600,
                color: tab===t ? '#002280' : '#94a3b8',
                borderBottom: tab===t ? '2px solid #002280' : '2px solid transparent',
                marginBottom:'-2px', whiteSpace:'nowrap',
                transition:'color .15s',
              }}
            >{t}</button>
          ))}
        </div>

        {/* ── Scrollable content ── */}
        <div style={{
          flex:1, overflowY:'auto',
          padding:'6px 22px 32px',
        }}>
          {tab === 'Account'       && <AccountTab       user={user} />}
          {tab === 'Security'      && <SecurityTab      user={user} />}
          {tab === 'Notifications' && <NotificationsTab />}
          {tab === 'System Logs'   && <SystemLogsTab />}
        </div>
      </div>

      {/* keyframe animations */}
      <style>{`
        @keyframes sDrawerIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes sDrawerBdIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default SettingsDrawer;
