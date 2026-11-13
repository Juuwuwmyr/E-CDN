import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

/* ── constants ──────────────────────────────────────────── */
const CATEGORIES = [
  { key: 'academics', label: 'Academics' },
  { key: 'admin',     label: 'Admin' },
  { key: 'finance',   label: 'Finance' },
  { key: 'health',    label: 'Health' },
  { key: 'library',   label: 'Library' },
  { key: 'schedule',  label: 'Schedule' },
  { key: 'reports',   label: 'Reports' },
  { key: 'more',      label: 'More' },
];

const COLOR_PRESETS = [
  { color: '#002280', bg: '#eef1fb', label: 'Blue' },
  { color: '#C8102E', bg: '#fdf0f2', label: 'Red' },
  { color: '#C8960C', bg: '#fdf8ec', label: 'Gold' },
  { color: '#10813f', bg: '#edf7f1', label: 'Green' },
  { color: '#7c3aed', bg: '#f5f0ff', label: 'Purple' },
  { color: '#0891b2', bg: '#ecf8fb', label: 'Cyan' },
  { color: '#e11d48', bg: '#fff0f3', label: 'Rose' },
  { color: '#374151', bg: '#f3f4f6', label: 'Gray' },
];

const catLabel = (key) => CATEGORIES.find(c => c.key === key)?.label ?? key;

const relativeTime = (ts) => {
  if (!ts) return '—';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)    return diff + 's ago';
  if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
};

const truncateUrl = (url, max = 42) =>
  url && url.length > max ? url.slice(0, max) + '…' : url;

const EMPTY_FORM = {
  id: '', label: '', sub: '', url: '',
  category: 'academics', color: '#002280', bg: '#eef1fb',
  badge: '', is_active: true,
};

/* ── Toast helper ───────────────────────────────────────── */
const Toast = ({ toast }) => {
  if (!toast) return null;
  const isErr = toast.type === 'error';
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 20000,
      background: isErr ? '#fef2f2' : '#f0fdf4',
      border: `1px solid ${isErr ? '#fca5a5' : '#86efac'}`,
      color: isErr ? '#991b1b' : '#166534',
      borderRadius: 10, padding: '12px 20px',
      fontSize: '0.875rem', fontWeight: 600,
      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      display: 'flex', alignItems: 'center', gap: 10,
      maxWidth: 360,
    }}>
      {isErr ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ width: 18, height: 18, flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ width: 18, height: 18, flexShrink: 0 }}>
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      )}
      {toast.msg}
    </div>
  );
};

/* ── Toggle switch ──────────────────────────────────────── */
const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    title={checked ? 'Deactivate' : 'Activate'}
    style={{
      width: 40, height: 22, borderRadius: 11,
      background: checked ? '#10813f' : '#d1d5db',
      border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      position: 'relative', transition: 'background 0.2s',
      flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: 3,
      left: checked ? 21 : 3,
      width: 16, height: 16, borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      transition: 'left 0.2s',
      display: 'block',
    }}/>
  </button>
);

/* ── Skeleton row ───────────────────────────────────────── */
const SkeletonRow = () => (
  <tr style={{ background: '#fff' }}>
    {[48, 110, 140, 90, 200, 70, 70, 100, 100].map((w, i) => (
      <td key={i} style={{ padding: '14px 12px' }}>
        <div style={{
          height: 14, width: w, borderRadius: 6,
          background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite linear',
        }}/>
      </td>
    ))}
  </tr>
);

/* ── Main component ─────────────────────────────────────── */
const SystemAppsManager = () => {
  const [apps,       setApps]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [formData,   setFormData]   = useState(EMPTY_FORM);
  const [errors,     setErrors]     = useState({});
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Toolbar state
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  /* toast helper */
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* fetch */
  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setApps(data || []);
    } catch (err) {
      console.error('Error fetching apps:', err);
      showToast('Failed to load system applications.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  /* filtered list */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return apps.filter(a => {
      const isArchived = a.badge === 'Archived';
      if (statusFilter === 'archived') {
        return isArchived && (
          !q || a.label?.toLowerCase().includes(q)
            || a.id?.toLowerCase().includes(q)
            || a.url?.toLowerCase().includes(q)
        ) && (!catFilter || a.category === catFilter);
      }
      // For non-archived views, exclude archived apps
      if (isArchived) return false;
      const matchSearch = !q || a.label?.toLowerCase().includes(q)
        || a.id?.toLowerCase().includes(q)
        || a.url?.toLowerCase().includes(q);
      const matchCat    = !catFilter    || a.category === catFilter;
      const matchStatus = !statusFilter
        || (statusFilter === 'active'   &&  a.is_active)
        || (statusFilter === 'inactive' && !a.is_active);
      return matchSearch && matchCat && matchStatus;
    });
  }, [apps, search, catFilter, statusFilter]);

  /* modal open/close */
  const openModal = (app = null) => {
    setErrors({});
    if (app) {
      setEditingApp(app);
      setFormData({
        id:        app.id        || '',
        label:     app.label     || '',
        sub:       app.sub       || '',
        url:       app.url       || '',
        category:  app.category  || 'academics',
        color:     app.color     || '#002280',
        bg:        app.bg        || '#eef1fb',
        badge:     app.badge     || '',
        is_active: app.is_active !== false,
      });
    } else {
      setEditingApp(null);
      setFormData(EMPTY_FORM);
    }
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingApp(null); setErrors({}); };

  /* form field helper */
  const field = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  /* validate */
  const validate = () => {
    const e = {};
    if (!formData.id.trim())    e.id    = 'System ID is required.';
    if (!formData.label.trim()) e.label = 'Label is required.';
    if (!formData.url.trim())   e.url   = 'URL is required.';
    else {
      try { new URL(formData.url); }
      catch { e.url = 'Enter a valid URL (include https://).'; }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingApp) {
        const { error } = await supabase
          .from('system_applications')
          .update({
            label:      formData.label,
            sub:        formData.sub,
            url:        formData.url,
            category:   formData.category,
            color:      formData.color,
            bg:         formData.bg,
            badge:      formData.badge || null,
            is_active:  formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingApp.id);
        if (error) throw error;
        showToast('Application updated successfully.');
      } else {
        const { error } = await supabase
          .from('system_applications')
          .insert({
            id:        formData.id,
            label:     formData.label,
            sub:       formData.sub,
            url:       formData.url,
            category:  formData.category,
            color:     formData.color,
            bg:        formData.bg,
            badge:     formData.badge || null,
            is_active: formData.is_active,
          });
        if (error) {
          if (error.code === '23505') {
            setErrors({ id: 'This System ID already exists.' });
            setSaving(false);
            return;
          }
          throw error;
        }
        showToast('Application added successfully.');
      }
      closeModal();
      fetchApps();
    } catch (err) {
      console.error('Error saving app:', err);
      showToast('Failed to save application. ' + (err.message || ''), 'error');
    } finally {
      setSaving(false);
    }
  };

  /* delete */
  const handleDelete = async (app) => {
    if (!window.confirm(`Delete "${app.label}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase
        .from('system_applications')
        .delete()
        .eq('id', app.id);
      if (error) throw error;
      showToast(`"${app.label}" deleted.`);
      fetchApps();
    } catch (err) {
      console.error('Error deleting app:', err);
      showToast('Failed to delete application.', 'error');
    }
  };

  /* archive — deactivate + mark badge as Archived */
  const handleArchive = async (app) => {
    if (!window.confirm(`Archive "${app.label}"? It will be hidden from the portal.`)) return;
    try {
      const { error } = await supabase
        .from('system_applications')
        .update({ is_active: false, badge: 'Archived', updated_at: new Date().toISOString() })
        .eq('id', app.id);
      if (error) throw error;
      showToast(`"${app.label}" archived.`);
      fetchApps();
    } catch (err) {
      showToast('Failed to archive application.', 'error');
    }
  };

  /* restore — re-activate and clear Archived badge */
  const handleRestore = async (app) => {
    try {
      const { error } = await supabase
        .from('system_applications')
        .update({ is_active: true, badge: null, updated_at: new Date().toISOString() })
        .eq('id', app.id);
      if (error) throw error;
      showToast(`"${app.label}" restored.`);
      fetchApps();
    } catch (err) {
      showToast('Failed to restore application.', 'error');
    }
  };

  /* toggle active */
  const toggleActive = async (app) => {
    setTogglingId(app.id);
    try {
      const { error } = await supabase
        .from('system_applications')
        .update({ is_active: !app.is_active })
        .eq('id', app.id);
      if (error) throw error;
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, is_active: !a.is_active } : a));
    } catch (err) {
      console.error('Error toggling status:', err);
      showToast('Failed to update status.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  /* ── render ─────────────────────────────────────────────── */
  return (
    <>
      {/* shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <Toast toast={toast} />

      <div className="db-panel" style={{ marginTop: 24 }}>
        {/* Panel header */}
        <div className="db-panel-header">
          <div className="db-panel-header-left">
            <div className="db-panel-icon" style={{ background: '#f5f0ff', color: '#7c3aed' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M3 5v4c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
                <path d="M3 9v4c0 1.66 4.03 3 9 3s9-1.34 9-3V9"/>
                <path d="M3 13v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4"/>
              </svg>
            </div>
            <div>
              <h3 className="db-panel-title">Application Registry</h3>
              <p className="db-panel-sub">
                Manage system applications displayed on the student portal
              </p>
            </div>
          </div>
          {/* Archive toggle button */}
          <button
            onClick={() => { setStatusFilter(statusFilter === 'archived' ? '' : 'archived'); }}
            style={{
              display:'inline-flex', alignItems:'center', gap:6,
              padding:'6px 14px', borderRadius:8, border:'1.5px solid',
              borderColor: statusFilter === 'archived' ? '#C8960C' : '#e2e8f0',
              background:  statusFilter === 'archived' ? '#fdf8ec' : '#fff',
              color:       statusFilter === 'archived' ? '#C8960C' : '#6b7280',
              fontSize:'.78rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
            </svg>
            {statusFilter === 'archived' ? '← Back' : 'Archive'}
          </button>
        </div>

        {/* Toolbar / Table OR Archive view */}
        {statusFilter === 'archived' ? (
          <SystemAppsArchiveView
            apps={apps}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        ) : (
          <div style={{ padding: '0 16px 16px' }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
          padding: '12px 0 16px', borderBottom: '1px solid #e5e7eb',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, ID, or URL…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: 34, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
                border: '1px solid #d1d5db', borderRadius: 7, fontSize: '0.84rem',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Category filter */}
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            style={{
              padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7,
              fontSize: '0.84rem', background: '#fff', cursor: 'pointer', flex: '0 0 auto',
            }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7,
              fontSize: '0.84rem', background: '#fff', cursor: 'pointer', flex: '0 0 auto',
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>

          {/* Spacer */}
          <span style={{ flex: '1 1 0' }}/>

          {/* Count */}
          <span style={{ fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
            Showing {filtered.length} of {apps.length}
          </span>

          {/* Refresh */}
          <button
            onClick={fetchApps}
            title="Refresh"
            style={{
              background: 'none', border: '1px solid #d1d5db', borderRadius: 7,
              padding: '7px 10px', cursor: 'pointer', color: '#6b7280', display: 'flex',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ width: 16, height: 16 }}>
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
            </svg>
          </button>

          {/* Add */}
          <button
            onClick={() => openModal()}
            style={{
              background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 7,
              padding: '8px 14px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ width: 16, height: 16 }}>
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Application
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', marginTop: 4, padding: '0 4px' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem',
          }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['#', 'System ID', 'Label', 'Category', 'URL', 'Status', 'Badge', 'Last Updated', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '10px 12px', textAlign: 'left', fontSize: '0.75rem',
                    fontWeight: 700, color: '#6b7280', textTransform: 'uppercase',
                    letterSpacing: '0.04em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }, (_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '48px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#9ca3af' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                        style={{ width: 44, height: 44 }}>
                        <ellipse cx="12" cy="5" rx="9" ry="3"/>
                        <path d="M3 5v4c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
                        <path d="M3 9v4c0 1.66 4.03 3 9 3s9-1.34 9-3V9"/>
                        <path d="M3 13v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4"/>
                      </svg>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>No applications registered.</span>
                      <span style={{ fontSize: '0.8rem' }}>
                        {apps.length > 0 ? 'No results match your filter.' : 'Click "Add Application" to get started.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((app, idx) => (
                  <tr
                    key={app.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      background: '#fff',
                      opacity: app.is_active ? 1 : 0.6,
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    {/* # */}
                    <td style={{ padding: '12px 12px', color: '#9ca3af', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {idx + 1}
                    </td>

                    {/* System ID */}
                    <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
                      <code style={{
                        background: '#f3f4f6', borderRadius: 4, padding: '2px 7px',
                        fontSize: '0.78rem', fontWeight: 700, color: '#374151',
                        fontFamily: 'monospace',
                      }}>{app.id}</code>
                    </td>

                    {/* Label */}
                    <td style={{ padding: '12px 12px', minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: app.bg, color: app.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            style={{ width: 14, height: 14 }}>
                            <rect x="2" y="3" width="20" height="14" rx="2"/>
                            <path d="M8 21h8M12 17v4"/>
                          </svg>
                        </div>
                        <div>
                          <div style={{
                            fontWeight: 700, color: '#111827',
                            textDecoration: app.is_active ? 'none' : 'line-through',
                          }}>{app.label}</div>
                          {app.sub && (
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{app.sub}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        background: app.bg, color: app.color,
                        fontSize: '0.72rem', fontWeight: 700,
                        padding: '3px 8px', borderRadius: 4,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>{catLabel(app.category)}</span>
                    </td>

                    {/* URL */}
                    <td style={{ padding: '12px 12px', maxWidth: 240 }}>
                      <span
                        title={app.url}
                        style={{
                          fontSize: '0.78rem', color: '#6b7280',
                          fontFamily: 'monospace', cursor: 'default',
                          display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', maxWidth: 220,
                        }}
                      >{truncateUrl(app.url)}</span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        background: app.is_active ? '#edf7f1' : '#f3f4f6',
                        color: app.is_active ? '#10813f' : '#6b7280',
                        fontSize: '0.72rem', fontWeight: 700,
                        padding: '3px 8px', borderRadius: 20,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        {app.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Badge */}
                    <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
                      {app.badge ? (
                        <span style={{
                          background: '#fef9c3', color: '#854d0e',
                          fontSize: '0.68rem', fontWeight: 800,
                          padding: '2px 7px', borderRadius: 4,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>{app.badge}</span>
                      ) : (
                        <span style={{ color: '#d1d5db', fontSize: '0.78rem' }}>—</span>
                      )}
                    </td>

                    {/* Last Updated */}
                    <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
                      <span
                        title={app.updated_at ? new Date(app.updated_at).toLocaleString() : '—'}
                        style={{ fontSize: '0.78rem', color: '#6b7280', cursor: 'default' }}
                      >
                        {relativeTime(app.updated_at || app.created_at)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {app.badge === 'Archived' ? (
                          <>
                            {/* Restore */}
                            <button
                              onClick={() => handleRestore(app)}
                              title="Restore"
                              style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4,
                                borderRadius: 6, background: '#eef1fb', color: '#002280',
                                border: 'none', cursor: 'pointer', fontSize: '.78rem', fontWeight: 700 }}
                            >
                              ↩ Restore
                            </button>
                            {/* Permanent Delete */}
                            <button
                              onClick={() => handleDelete(app)}
                              title="Permanently delete"
                              style={{ width: 28, height: 28, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', borderRadius: 6,
                                background: '#fef2f2', color: '#991b1b',
                                border: 'none', cursor: 'pointer', flexShrink: 0 }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ width: 13, height: 13 }}>
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Open link */}
                            <a
                              href={app.url}
                              target="_blank"
                              rel="noreferrer"
                              title="Open in new tab"
                              style={{
                                width: 28, height: 28, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', borderRadius: 6,
                                background: '#f3f4f6', color: '#374151',
                                textDecoration: 'none', flexShrink: 0,
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ width: 14, height: 14 }}>
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                                <polyline points="15 3 21 3 21 9"/>
                                <line x1="10" y1="14" x2="21" y2="3"/>
                              </svg>
                            </a>

                            {/* Edit */}
                            <button
                              onClick={() => openModal(app)}
                              title="Edit"
                              style={{
                                width: 28, height: 28, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', borderRadius: 6,
                                background: '#eef1fb', color: '#002280',
                                border: 'none', cursor: 'pointer', flexShrink: 0,
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ width: 13, height: 13 }}>
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>

                            {/* Toggle */}
                            <ToggleSwitch
                              checked={app.is_active}
                              onChange={() => toggleActive(app)}
                              disabled={togglingId === app.id}
                            />

                            {/* Archive */}
                            <button
                              onClick={() => handleArchive(app)}
                              title="Archive (hide from portal)"
                              style={{
                                width: 28, height: 28, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', borderRadius: 6,
                                background: '#f3f4f6', color: '#6b7280',
                                border: 'none', cursor: 'pointer', flexShrink: 0,
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ width: 13, height: 13 }}>
                                <polyline points="21 8 21 21 3 21 3 8"/>
                                <rect x="1" y="3" width="22" height="5"/>
                                <line x1="10" y1="12" x2="14" y2="12"/>
                              </svg>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(app)}
                              title="Delete permanently"
                              style={{
                                width: 28, height: 28, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', borderRadius: 6,
                                background: '#fef2f2', color: '#991b1b',
                                border: 'none', cursor: 'pointer', flexShrink: 0,
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ width: 13, height: 13 }}>
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          </div>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, padding: 20,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: '#fff', borderRadius: 14,
              width: '100%', maxWidth: 640,
              maxHeight: '92vh', overflowY: 'auto',
              padding: 32, boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F1422' }}>
                  {editingApp ? 'Edit Application' : 'Register New Application'}
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4 }}>
                  {editingApp ? 'Update application settings and status.' : 'Add a new system to the portal registry.'}
                </p>
              </div>
              <button onClick={closeModal} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9ca3af', padding: 4, lineHeight: 1,
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ width: 20, height: 20 }}>
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Row 1: ID + Label */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <FieldWrap label="System ID" required error={errors.id}>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={e => field('id', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="e.g., csc, osas"
                    disabled={!!editingApp}
                    style={inputStyle(!!errors.id, !!editingApp)}
                  />
                  <FieldNote>Unique key (lowercase). Cannot change after creation.</FieldNote>
                </FieldWrap>

                <FieldWrap label="Label" required error={errors.label}>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={e => field('label', e.target.value)}
                    placeholder="e.g., CSC Services"
                    style={inputStyle(!!errors.label)}
                  />
                </FieldWrap>
              </div>

              {/* Description */}
              <FieldWrap label="Description" style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  value={formData.sub}
                  onChange={e => field('sub', e.target.value)}
                  placeholder="Short description shown under the label"
                  style={inputStyle()}
                />
              </FieldWrap>

              {/* Row 2: URL + Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <FieldWrap label="Application URL" required error={errors.url}>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={e => field('url', e.target.value)}
                    placeholder="https://example.com"
                    style={inputStyle(!!errors.url)}
                  />
                </FieldWrap>

                <FieldWrap label="Category">
                  <select
                    value={formData.category}
                    onChange={e => field('category', e.target.value)}
                    style={{ ...inputStyle(), cursor: 'pointer' }}
                  >
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </FieldWrap>
              </div>

              {/* Color scheme */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Color Scheme</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {COLOR_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => { field('color', preset.color); field('bg', preset.bg); setFormData(prev => ({ ...prev, color: preset.color, bg: preset.bg })); }}
                      title={preset.label}
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: preset.color, border: formData.color === preset.color
                          ? '3px solid #0F1422' : '3px solid transparent',
                        cursor: 'pointer', flexShrink: 0,
                        outline: formData.color === preset.color ? `2px solid ${preset.color}` : 'none',
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Primary</label>
                    <input type="color" value={formData.color}
                      onChange={e => field('color', e.target.value)}
                      style={{ width: '100%', height: 38, border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}/>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Background</label>
                    <input type="color" value={formData.bg}
                      onChange={e => field('bg', e.target.value)}
                      style={{ width: '100%', height: 38, border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}/>
                  </div>
                </div>
              </div>

              {/* Badge */}
              <FieldWrap label="Badge (optional)" style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={e => field('badge', e.target.value)}
                  placeholder="e.g., New, Beta, Updated"
                  style={inputStyle()}
                />
                <FieldNote>Leave empty for no badge</FieldNote>
              </FieldWrap>

              {/* Active toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <ToggleSwitch
                  checked={formData.is_active}
                  onChange={() => field('is_active', !formData.is_active)}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                  {formData.is_active ? 'Active — visible on portal' : 'Inactive — hidden from portal'}
                </span>
              </div>

              {/* Live preview */}
              <div style={{
                background: '#f9fafb', borderRadius: 10, padding: 16,
                marginBottom: 24, border: '1px solid #e5e7eb',
              }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Preview
                </p>
                <div style={{
                  background: '#fff', borderRadius: 10, padding: 14,
                  border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 14,
                  maxWidth: 320, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: formData.bg, color: formData.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                      style={{ width: 24, height: 24 }}>
                      <rect x="2" y="3" width="20" height="14" rx="2"/>
                      <path d="M8 21h8M12 17v4M7 8h10M7 12h6"/>
                    </svg>
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F1422', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {formData.label || 'App Label'}
                      {formData.badge && (
                        <span style={{
                          fontSize: '0.6rem', fontWeight: 800, background: '#FFD700',
                          color: '#002280', padding: '1px 6px', borderRadius: 3,
                          textTransform: 'uppercase',
                        }}>{formData.badge}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
                      {formData.sub || 'Short description'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button" onClick={closeModal}
                  style={{
                    background: '#f3f4f6', color: '#374151', border: 'none',
                    borderRadius: 7, padding: '9px 22px', fontSize: '0.875rem',
                    fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={saving}
                  style={{
                    background: saving ? '#a78bfa' : '#7c3aed', color: '#fff', border: 'none',
                    borderRadius: 7, padding: '9px 22px', fontSize: '0.875rem',
                    fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Saving…' : (editingApp ? 'Save Changes' : 'Add Application')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

/* ── small helper components (defined outside, no hooks) ── */
const labelStyle = {
  display: 'block', fontSize: '0.8rem', fontWeight: 700,
  color: '#374151', marginBottom: 5,
};

const inputStyle = (hasError = false, disabled = false) => ({
  width: '100%', padding: '9px 12px',
  border: `1px solid ${hasError ? '#f87171' : '#d1d5db'}`,
  borderRadius: 7, fontSize: '0.84rem',
  background: disabled ? '#f9fafb' : '#fff',
  outline: 'none', boxSizing: 'border-box',
  boxShadow: hasError ? '0 0 0 2px rgba(239,68,68,0.15)' : 'none',
});

const FieldWrap = ({ label, required, error, children, style: extraStyle }) => (
  <div style={extraStyle}>
    {label && (
      <label style={labelStyle}>
        {label}{required && <span style={{ color: '#C8102E', marginLeft: 2 }}>*</span>}
      </label>
    )}
    {children}
    {error && (
      <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 4 }}>{error}</p>
    )}
  </div>
);

const FieldNote = ({ children }) => (
  <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>{children}</p>
);

export default SystemAppsManager;

/* ─────────────────────────────────────────────────────────────
   SystemAppsArchiveView — full-page archive view inside db-panel
───────────────────────────────────────────────────────────── */
function SystemAppsArchiveView({ apps, onRestore, onDelete }) {
  const archived = apps.filter(a => a.badge === 'Archived');

  return (
    <div style={{ padding: '1.25rem 0' }}>
      {/* Section header */}
      <div style={{ marginBottom: '1rem', paddingBottom: '.75rem', borderBottom: '1px solid #f3f4f6' }}>
        <p style={{ margin: 0, fontSize: '.92rem', fontWeight: 800, color: '#0f1724' }}>Archived Applications</p>
        <p style={{ margin: '2px 0 0', fontSize: '.72rem', color: '#94a3b8' }}>
          {archived.length} archived application{archived.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Count */}
      <span style={{ fontSize: '.78rem', color: '#94a3b8', fontWeight: 600, marginBottom: '.75rem', display: 'block' }}>
        <strong style={{ color: '#374151' }}>{archived.length}</strong> archived applications
      </span>

      {/* Empty state */}
      {archived.length === 0 ? (
        <div className="db-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 44, height: 44, color: '#d1d5db' }}>
            <polyline points="21 8 21 21 3 21 3 8"/>
            <rect x="1" y="3" width="22" height="5"/>
            <line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
          <p>No archived applications</p>
          <span>Applications you archive will appear here.</span>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['#', 'Application', 'Category', 'URL', 'Date Archived', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '10px 12px', textAlign: 'left', fontSize: '.72rem',
                    fontWeight: 700, color: '#6b7280', textTransform: 'uppercase',
                    letterSpacing: '.04em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {archived.map((app, i) => (
                <tr key={app.id} style={{ borderBottom: '1px solid #f3f4f6', background: '#fff' }}>
                  <td style={{ padding: '12px', color: '#9ca3af', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: '12px', minWidth: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6, background: app.bg, color: app.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                          <rect x="2" y="3" width="20" height="14" rx="2"/>
                          <path d="M8 21h8M12 17v4"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#111827' }}>{app.label}</div>
                        {app.sub && <div style={{ fontSize: '.72rem', color: '#9ca3af' }}>{app.sub}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: app.bg, color: app.color,
                      fontSize: '.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                      textTransform: 'uppercase', letterSpacing: '.04em',
                    }}>
                      {catLabel(app.category)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', maxWidth: 200 }}>
                    <span style={{
                      fontSize: '.76rem', color: '#6b7280', fontFamily: 'monospace',
                      display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180,
                    }} title={app.url}>
                      {truncateUrl(app.url)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#9ca3af', fontSize: '.78rem', whiteSpace: 'nowrap' }}>
                    {app.updated_at ? new Date(app.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => onRestore(app)}
                        className="sl-btn sl-btn--ghost"
                        style={{ padding: '5px 12px', fontSize: '.76rem' }}
                      >
                        ↩ Restore
                      </button>
                      <button
                        onClick={() => onDelete(app)}
                        className="sl-act-btn"
                        title="Permanently delete"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14H6L5 6"/>
                          <path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

