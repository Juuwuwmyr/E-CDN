/**
 * AnnouncementsPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * Professional institutional announcements management system.
 * Split-pane: inbox-style list (left) + detail / compose pane (right).
 * Stats bar at top. Mobile responsive via JS-driven matchMedia.
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  fetchAllAnnouncements,
  createAnnouncement,
  deactivateAnnouncement,
  reactivateAnnouncement,
  deleteAnnouncement,
} from '../../../lib/announcements';
import { supabase } from '../../../lib/supabase';

/* ── Constants ───────────────────────────────────────────────── */
const COURSES = ['BSIS', 'BPA', 'BTVTED-CHS', 'BTVTED-WFT'];
const YEAR_LEVELS = ['1', '2', '3', '4'];
const YEAR_LABELS = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };

const TYPE_CONFIG = {
  info:    { label: 'Info',    color: '#002280', bg: '#eef1fb', border: '#c7d3f7' },
  warning: { label: 'Warning', color: '#b45309', bg: '#fdf8ec', border: '#fcd34d' },
  urgent:  { label: 'Urgent',  color: '#C8102E', bg: '#fff0f2', border: '#fecdd3' },
  event:   { label: 'Event',   color: '#10813f', bg: '#edf7f1', border: '#86efac' },
};

const TYPE_ICONS = {
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  urgent: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  event: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};

/* ── Helpers ─────────────────────────────────────────────────── */
function timeAgo(ts) {
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (d < 60)    return d + 's ago';
  if (d < 3600)  return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
}

function audienceLabel(ann) {
  const courses = ann.target_courses?.length ? ann.target_courses.join(', ') : null;
  const years   = ann.target_year_levels?.length
    ? ann.target_year_levels.map(y => YEAR_LABELS[y] || ('Year ' + y)).join(', ')
    : null;
  if (!courses && !years) return 'All Students';
  if (courses && !years)  return courses;
  if (!courses && years)  return 'All Courses · ' + years;
  return courses + ' · ' + years;
}

function toggle(arr, val) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

/* ── Inline update (no helper in lib) ───────────────────────── */
async function updateAnnouncement(id, updates) {
  const { error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

/* ═══════════════════════════════════════════════════════════════ */
export default function AnnouncementsPage({ user }) {
  /* ── Core data ─────────────────────────────────────────────── */
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);

  /* ── Filter / search ───────────────────────────────────────── */
  const [search,       setSearch]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  /* ── Pane state ────────────────────────────────────────────── */
  const [selectedId,   setSelectedId]   = useState(null);
  const [composeOpen,  setComposeOpen]  = useState(false);
  const [editingId,    setEditingId]    = useState(null);  // null = new, id = edit

  /* ── Form fields ───────────────────────────────────────────── */
  const [title,            setTitle]            = useState('');
  const [body,             setBody]             = useState('');
  const [type,             setType]             = useState('info');
  const [targetCourses,    setTargetCourses]    = useState([]);
  const [targetYearLevels, setTargetYearLevels] = useState([]);

  /* ── Mutation state ────────────────────────────────────────── */
  const [saving, setSaving] = useState(false);

  /* ── Toast ─────────────────────────────────────────────────── */
  const [toast, setToast]   = useState(null);  // { msg, type }
  const toastTimer           = useRef(null);

  /* ── Mobile ─────────────────────────────────────────────────── */
  const [isMobile,        setIsMobile]        = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  /* ── matchMedia listener ───────────────────────────────────── */
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  /* ── Load ──────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAnnouncements(await fetchAllAnnouncements());
    } catch (e) {
      showToast('Failed to load: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  /* ── Toast helper ──────────────────────────────────────────── */
  const showToast = useCallback((msg, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  /* ── Archive page handlers ─────────────────────────────────── */
  const handleArchiveRestore = useCallback(async (id) => {
    try {
      await reactivateAnnouncement(id);
      setAnnouncements(prev => prev.map(x => x.id === id ? { ...x, is_active: true } : x));
      showToast('Announcement restored.');
    } catch (e) {
      showToast(e.message || 'Restore failed.', 'error');
    }
  }, [showToast]);

  const handleArchiveDelete = useCallback(async (ann) => {
    if (!window.confirm('Permanently delete this announcement? This cannot be undone.')) return;
    try {
      await deleteAnnouncement(ann.id);
      setAnnouncements(prev => prev.filter(x => x.id !== ann.id));
      showToast('Announcement permanently deleted.');
    } catch (e) {
      showToast(e.message || 'Delete failed.', 'error');
    }
  }, [showToast]);

  /* ── Derived values ────────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return announcements
      .filter(a => {
        if (q && !a.title.toLowerCase().includes(q) && !a.body.toLowerCase().includes(q)) return false;
        if (typeFilter !== 'all' && a.type !== typeFilter) return false;
        if (statusFilter === 'active'   && !a.is_active)  return false;
        if (statusFilter === 'hidden'   &&  a.is_active)  return false;
        if (statusFilter === 'archived' &&  a.is_active)  return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [announcements, search, typeFilter, statusFilter]);

  const selected = useMemo(
    () => announcements.find(a => a.id === selectedId) || null,
    [announcements, selectedId]
  );

  const previewAudience = useMemo(() => {
    const c = targetCourses.length    ? targetCourses.join(', ')                                       : 'All Courses';
    const y = targetYearLevels.length ? targetYearLevels.map(v => YEAR_LABELS[v]).join(', ') : 'All Year Levels';
    return c + ' · ' + y;
  }, [targetCourses, targetYearLevels]);

  const total       = announcements.length;
  const activeNow   = announcements.filter(a => a.is_active).length;
  const hidden      = announcements.filter(a => !a.is_active).length;
  const sentThisWeek = announcements.filter(a =>
    new Date(a.created_at).getTime() >= Date.now() - 7 * 24 * 3600 * 1000
  ).length;

  /* ── Right-pane mode ────────────────────────────────────────── */
  // 'compose' | 'detail' | 'empty'
  const paneMode = composeOpen ? 'compose' : selected ? 'detail' : 'empty';

  /* ── Handlers ───────────────────────────────────────────────── */
  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    setComposeOpen(false);
    setEditingId(null);
    setMobileShowDetail(true);
  }, []);

  const resetForm = useCallback(() => {
    setTitle('');
    setBody('');
    setType('info');
    setTargetCourses([]);
    setTargetYearLevels([]);
  }, []);

  const handleNew = useCallback(() => {
    resetForm();
    setEditingId(null);
    setSelectedId(null);
    setComposeOpen(true);
    setMobileShowDetail(true);
  }, [resetForm]);

  const handleEdit = useCallback((ann) => {
    setTitle(ann.title);
    setBody(ann.body);
    setType(ann.type);
    setTargetCourses(ann.target_courses  ?? []);
    setTargetYearLevels(ann.target_year_levels ?? []);
    setEditingId(ann.id);
    setSelectedId(ann.id);
    setComposeOpen(true);
    setMobileShowDetail(true);
  }, []);

  const handleCancel = useCallback(() => {
    setComposeOpen(false);
    setEditingId(null);
    resetForm();
    if (isMobile) setMobileShowDetail(!!selectedId);
  }, [isMobile, selectedId, resetForm]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      showToast('Title and message body are required.', 'error');
      return;
    }
    setSaving(true);
    const tCourses = targetCourses.length     ? targetCourses     : null;
    const tYears   = targetYearLevels.length  ? targetYearLevels  : null;
    try {
      if (editingId) {
        await updateAnnouncement(editingId, {
          title:              title.trim(),
          body:               body.trim(),
          type,
          target_courses:     tCourses,
          target_year_levels: tYears,
        });
        showToast('Announcement updated successfully.');
        setComposeOpen(false);
        setEditingId(null);
        resetForm();
        await load();
      } else {
        const row = await createAnnouncement({
          title:            title.trim(),
          body:             body.trim(),
          type,
          createdBy:        user?.username || user?.name || 'Admin',
          targetCourses:    tCourses,
          targetYearLevels: tYears,
        });
        showToast('Announcement posted successfully.');
        setSelectedId(row.id);
        setComposeOpen(false);
        setEditingId(null);
        resetForm();
        await load();
      }
      if (isMobile) setMobileShowDetail(true);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  }, [
    title, body, type, targetCourses, targetYearLevels,
    editingId, user, isMobile, showToast, resetForm, load,
  ]);

  const handleToggle = useCallback(async (ann) => {
    try {
      if (ann.is_active) {
        await deactivateAnnouncement(ann.id);
      } else {
        await reactivateAnnouncement(ann.id);
      }
      setAnnouncements(prev =>
        prev.map(x => x.id === ann.id ? { ...x, is_active: !x.is_active } : x)
      );
      showToast(ann.is_active ? 'Announcement hidden.' : 'Announcement re-activated.');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  }, [showToast]);

  const handleArchive = useCallback(async (ann) => {
    try {
      await deactivateAnnouncement(ann.id);
      setAnnouncements(prev => prev.map(x => x.id === ann.id ? { ...x, is_active: false } : x));
      showToast('Announcement archived.');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  }, [showToast]);

  const handlePermanentDelete = useCallback(async (ann) => {
    if (!window.confirm('Permanently delete this announcement? This cannot be undone.')) return;
    try {
      await deleteAnnouncement(ann.id);
      setAnnouncements(prev => prev.filter(x => x.id !== ann.id));
      if (selectedId === ann.id) {
        setSelectedId(null);
        setComposeOpen(false);
        setMobileShowDetail(false);
      }
      showToast('Announcement permanently deleted.');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  }, [selectedId, showToast]);

  const handleMobileBack = useCallback(() => {
    setMobileShowDetail(false);
    if (!composeOpen) setSelectedId(null);
    setComposeOpen(false);
    setEditingId(null);
    resetForm();
  }, [composeOpen, resetForm]);

  /* ── Pane visibility on mobile ────────────────────────────── */
  const showLeft  = !isMobile || !mobileShowDetail;
  const showRight = !isMobile || mobileShowDetail;

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <div>
          <p style={{ margin:0, fontSize:'.97rem', fontWeight:800, color:'#0f1724' }}>Announcements</p>
          <p style={{ margin:'2px 0 0', fontSize:'.72rem', color:'#94a3b8' }}>Manage and broadcast announcements to students</p>
        </div>
        <button
          onClick={() => setStatusFilter(statusFilter === 'archived' ? 'all' : 'archived')}
          style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'6px 14px', borderRadius:8, border:'1.5px solid',
            borderColor: statusFilter === 'archived' ? '#C8960C' : '#e2e8f0',
            background:  statusFilter === 'archived' ? '#fdf8ec' : '#fff',
            color:       statusFilter === 'archived' ? '#C8960C' : '#6b7280',
            fontSize:'.78rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
          </svg>
          {statusFilter === 'archived' ? '← Back' : 'Archive'}
        </button>
      </div>

      {/* ── STATS BAR / SPLIT-PANE OR ARCHIVE VIEW ─────────── */}
      {statusFilter === 'archived' ? (
        <AnnouncementsArchivePage
          announcements={announcements}
          onRestore={handleArchiveRestore}
          onDelete={handleArchiveDelete}
        />
      ) : (
        <>
      {/* ── STATS BAR ──────────────────────────────────────── */}
      <div className="db-stats-row">
        <StatCard
          value={total}
          label="Total Announcements"
          color="#002280"
          bg="#eef1fb"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6z" />
              <path d="M12 17V3" /><path d="M5 10l7-7 7 7" />
            </svg>
          }
        />
        <StatCard
          value={activeNow}
          label="Active Now"
          color="#10813f"
          bg="#edf7f1"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          }
        />
        <StatCard
          value={hidden}
          label="Hidden / Archived"
          color="#6b7280"
          bg="#f3f4f6"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          }
        />
        <StatCard
          value={sentThisWeek}
          label="Sent This Week"
          color="#b45309"
          bg="#fdf8ec"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
      </div>

      {/* ── SPLIT-PANE ─────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '1.25rem',
        alignItems: 'flex-start',
      }}>

        {/* ── LEFT PANE — inbox list ─────────────────────── */}
        {showLeft && (
          <div
            className="db-panel"
            style={{
              width: isMobile ? '100%' : 340,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 480,
            }}
          >
            {/* List header */}
            <div style={{
              padding: '.9rem 1rem .75rem',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '.5rem',
            }}>
              <div>
                <p style={{ fontSize: '.88rem', fontWeight: 800, color: '#0f1724', margin: 0 }}>Announcements</p>
                <p style={{ fontSize: '.7rem', color: '#9ca3af', margin: '1px 0 0', fontWeight: 500 }}>Manage broadcast messages</p>
              </div>
              <button
                className="sl-btn sl-btn--primary"
                onClick={handleNew}
                style={{ padding: '.5rem .9rem', fontSize: '.78rem', fontWeight: 700, borderRadius: 9, whiteSpace: 'nowrap' }}
              >
                + New
              </button>
            </div>

            {/* Filter bar */}
            <div style={{ padding: '.75rem 1rem .5rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              <div className="sl-search-wrap" style={{ position: 'relative' }}>
                <svg
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9ca3af', pointerEvents: 'none' }}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  className="sl-search"
                  type="text"
                  placeholder="Search announcements…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 32 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <select
                  className="sl-select"
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  style={{ flex: 1, fontSize: '.76rem' }}
                >
                  <option value="all">All Types</option>
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <select
                  className="sl-select"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ flex: 1, fontSize: '.76rem' }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Count */}
            <div style={{ padding: '0 1rem .4rem' }}>
              <span className="sl-count">
                <strong>{filtered.length}</strong> of {announcements.length}
              </span>
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                <div className="sl-loading" style={{
                  display: 'grid', gridTemplateColumns: '1fr', gap: '.5rem', padding: '1rem',
                }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="sl-card sl-card--skeleton" style={{ height: 68, borderRadius: 10 }} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="db-no-results" style={{ padding: '2.5rem 1rem' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6z" />
                    <path d="M12 17V3" /><path d="M5 10l7-7 7 7" />
                  </svg>
                  <p>No announcements match your filters</p>
                </div>
              ) : (
                <div className="sl-list">
                  {filtered.map(ann => {
                    const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info;
                    const isSelected = ann.id === selectedId && !composeOpen;
                    return (
                      <div
                        key={ann.id}
                        className="sl-list-row"
                        onClick={() => handleSelect(ann.id)}
                        style={{
                          padding: '.65rem 1rem',
                          cursor: 'pointer',
                          opacity: ann.is_active ? 1 : 0.5,
                          background: isSelected ? '#eef1fb' : undefined,
                          borderLeft: isSelected ? '3px solid #002280' : '3px solid transparent',
                          gap: '.6rem',
                        }}
                      >
                        {/* Priority dot */}
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: cfg.color, flexShrink: 0, marginTop: 2,
                        }} />

                        {/* Info */}
                        <div className="sl-list-info" style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: 2 }}>
                            <p
                              className="sl-list-name"
                              style={{
                                fontWeight: 700, fontSize: '.82rem', color: '#0f1724',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                margin: 0, flex: 1, minWidth: 0,
                              }}
                            >
                              {ann.title}
                            </p>
                            {!ann.is_active && (
                              <span style={{
                                fontSize: '.58rem', fontWeight: 700, padding: '.1rem .4rem',
                                borderRadius: 999, background: '#f3f4f6', color: '#9ca3af',
                                border: '1px solid #e4e8f2', flexShrink: 0,
                              }}>
                                Hidden
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                            <span style={{
                              fontSize: '.62rem', fontWeight: 700, padding: '.1rem .45rem',
                              borderRadius: 999, background: cfg.bg, color: cfg.color,
                              border: `1px solid ${cfg.border}`, flexShrink: 0,
                            }}>
                              {cfg.label}
                            </span>
                            <span style={{
                              fontSize: '.64rem', color: '#6b7280', fontWeight: 600,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {audienceLabel(ann)}
                            </span>
                          </div>
                        </div>

                        {/* Time */}
                        <span
                          style={{ fontSize: '.63rem', color: '#9ca3af', fontWeight: 600, flexShrink: 0 }}
                          title={new Date(ann.created_at).toLocaleString()}
                        >
                          {timeAgo(ann.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── RIGHT PANE — detail / compose ─────────────── */}
        {showRight && (
          <div
            className="db-panel"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              minHeight: 480,
            }}
          >
            {/* Mobile back button */}
            {isMobile && mobileShowDetail && (
              <div style={{ padding: '.75rem 1rem .5rem', borderBottom: '1px solid #f3f4f6' }}>
                <button
                  className="sl-btn sl-btn--ghost"
                  onClick={handleMobileBack}
                  style={{ fontSize: '.78rem', padding: '.45rem .85rem', borderRadius: 8 }}
                >
                  ← Back to List
                </button>
              </div>
            )}

            {/* ── EMPTY STATE ─────────────────────────────── */}
            {paneMode === 'empty' && (
              <div className="db-empty-state" style={{ flex: 1, justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6z" />
                  <path d="M12 17V3" /><path d="M5 10l7-7 7 7" />
                </svg>
                <p>Select an announcement or compose new</p>
                <span>Click a row on the left, or press "New" to draft an announcement.</span>
                <button
                  className="sl-btn sl-btn--primary"
                  onClick={handleNew}
                  style={{ marginTop: '.75rem', padding: '.6rem 1.25rem', fontSize: '.82rem', borderRadius: 10 }}
                >
                  + New Announcement
                </button>
              </div>
            )}

            {/* ── DETAIL VIEW ─────────────────────────────── */}
            {paneMode === 'detail' && selected && (
              <DetailPane
                ann={selected}
                onEdit={handleEdit}
                onToggle={handleToggle}
                onDelete={handleArchive}
                onArchive={handleArchive}
                onPermanentDelete={handlePermanentDelete}
              />
            )}

            {/* ── COMPOSE / EDIT FORM ─────────────────────── */}
            {paneMode === 'compose' && (
              <ComposePane
                editingId={editingId}
                title={title}         setTitle={setTitle}
                body={body}           setBody={setBody}
                type={type}           setType={setType}
                targetCourses={targetCourses}       setTargetCourses={setTargetCourses}
                targetYearLevels={targetYearLevels} setTargetYearLevels={setTargetYearLevels}
                previewAudience={previewAudience}
                saving={saving}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            )}
          </div>
        )}
      </div>
        </>
      )}

      {/* ── TOAST ───────────────────────────────────────────── */}
      {toast && (
        <div className={`sl-toast sl-toast--${toast.type === 'error' ? 'error' : 'success'}`}>
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   StatCard
───────────────────────────────────────────────────────────── */
function StatCard({ value, label, color, bg, icon }) {
  return (
    <div className="db-stat-card" style={{ '--sc': color, '--sc-bg': bg }}>
      <div className="db-stat-icon" style={{ background: bg, color }}>
        {icon}
      </div>
      <div className="db-stat-body">
        <span className="db-stat-value">{value}</span>
        <span className="db-stat-label">{label}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DetailPane
───────────────────────────────────────────────────────────── */
function DetailPane({ ann, onEdit, onToggle, onDelete, onArchive, onPermanentDelete }) {
  const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Detail header */}
      <div style={{ padding: '1.25rem 1.4rem .9rem', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap', marginBottom: '.55rem' }}>
              <span style={{
                fontSize: '.68rem', fontWeight: 800, padding: '.25rem .7rem',
                borderRadius: 999, background: cfg.bg, color: cfg.color,
                border: `1.5px solid ${cfg.border}`, textTransform: 'uppercase', letterSpacing: '.05em',
              }}>
                {cfg.label}
              </span>
              {!ann.is_active && (
                <span style={{
                  fontSize: '.68rem', fontWeight: 700, padding: '.25rem .7rem',
                  borderRadius: 999, background: '#f3f4f6', color: '#6b7280',
                  border: '1px solid #e4e8f2', textTransform: 'uppercase',
                }}>
                  Hidden
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0f1724', margin: '0 0 .4rem', lineHeight: 1.3 }}>
              {ann.title}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', fontSize: '.74rem', color: '#6b7280', fontWeight: 600 }}>
              <span>
                <svg style={{ width: 12, height: 12, marginRight: 3, verticalAlign: 'middle', color: '#002280' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                </svg>
                {audienceLabel(ann)}
              </span>
              <span>
                Posted by <strong style={{ color: '#374151' }}>{ann.created_by || 'Admin'}</strong>
              </span>
              <span title={new Date(ann.created_at).toLocaleString()}>
                {timeAgo(ann.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '1.1rem 1.4rem', flex: 1 }}>
        <p style={{
          fontSize: '.88rem', color: '#374151', lineHeight: 1.75,
          whiteSpace: 'pre-wrap', margin: 0,
        }}>
          {ann.body}
        </p>
      </div>

      {/* Action bar */}
      <div style={{
        padding: '.9rem 1.4rem',
        borderTop: '1px solid #f3f4f6',
        display: 'flex', gap: '.5rem', alignItems: 'center',
      }}>
        <button
          className="sl-act-btn sl-act-btn--edit"
          onClick={() => onEdit(ann)}
          title="Edit this announcement"
          style={{ width: 'auto', padding: '.45rem .95rem', borderRadius: 9, fontSize: '.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '.4rem' }}
        >
          <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>
        <button
          className="sl-act-btn sl-act-btn--toggle"
          onClick={() => onToggle(ann)}
          title={ann.is_active ? 'Hide announcement' : 'Re-activate announcement'}
          style={{ width: 'auto', padding: '.45rem .95rem', borderRadius: 9, fontSize: '.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '.4rem' }}
        >
          {ann.is_active ? (
            <>
              <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              Hide
            </>
          ) : (
            <>
              <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Show
            </>
          )}
        </button>
        {!ann.is_active && (
          <button
            className="sl-act-btn sl-act-btn--edit"
            onClick={() => onToggle(ann)}
            title="Restore announcement"
            style={{ width: 'auto', padding: '.45rem .95rem', borderRadius: 9, fontSize: '.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '.4rem' }}
          >
            ↩ Restore
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button
          className="sl-act-btn sl-act-btn--toggle"
          onClick={() => onArchive(ann)}
          title="Archive announcement"
          style={{ width: 'auto', padding: '.45rem .95rem', borderRadius: 9, fontSize: '.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '.4rem' }}
        >
          <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
          </svg>
          Archive
        </button>
        {!ann.is_active && (
          <button
            className="sl-act-btn sl-act-btn--del"
            onClick={() => onPermanentDelete(ann)}
            title="Permanently delete"
            style={{ width: 'auto', padding: '.45rem .95rem', borderRadius: 9, fontSize: '.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '.4rem' }}
          >
            <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            Permanently Delete
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ComposePane
───────────────────────────────────────────────────────────── */
function ComposePane({
  editingId,
  title, setTitle,
  body, setBody,
  type, setType,
  targetCourses, setTargetCourses,
  targetYearLevels, setTargetYearLevels,
  previewAudience,
  saving,
  onSubmit,
  onCancel,
}) {
  const isEdit = !!editingId;
  const cfg    = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const valid  = title.trim().length > 0 && body.trim().length > 0;

  const pillStyle = (selected, selColor, selBg, selBorder) => ({
    padding: '.32rem .75rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 700,
    cursor: 'pointer', border: selected ? `1.5px solid ${selBorder || selColor}` : '1.5px solid #e4e8f2',
    background: selected ? selBg : '#f7f8fc', color: selected ? selColor : '#6b7280',
    fontFamily: 'inherit', transition: 'all .12s',
  });

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Form header */}
      <div style={{
        padding: '.9rem 1.4rem .75rem', borderBottom: '1px solid #f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: '.88rem', fontWeight: 800, color: '#0f1724', margin: 0 }}>
            {isEdit ? 'Edit Announcement' : 'Compose New Announcement'}
          </p>
          <p style={{ fontSize: '.7rem', color: '#9ca3af', margin: '1px 0 0', fontWeight: 500 }}>
            {isEdit ? 'Update the announcement below' : 'Draft and publish to students'}
          </p>
        </div>
      </div>

      {/* Scrollable form body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Title */}
        <div>
          <label style={{ fontSize: '.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: '.35rem' }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Enrollment for AY 2026-2027 is now open"
            maxLength={120}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '.75rem .95rem',
              borderRadius: 10, border: '1.5px solid #e4e8f2', fontSize: '.88rem',
              fontWeight: 600, color: '#0f1724', fontFamily: 'inherit', outline: 'none',
              transition: 'border .15s',
            }}
            onFocus={e => e.target.style.borderColor = '#002280'}
            onBlur={e => e.target.style.borderColor = '#e4e8f2'}
          />
          <p style={{ fontSize: '.67rem', color: '#9ca3af', textAlign: 'right', margin: '3px 0 0' }}>
            {title.length}/120
          </p>
        </div>

        {/* Body */}
        <div>
          <label style={{ fontSize: '.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: '.35rem' }}>
            Message Body
          </label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write the full announcement message here…"
            rows={5}
            maxLength={1000}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '.75rem .95rem',
              borderRadius: 10, border: '1.5px solid #e4e8f2', fontSize: '.86rem',
              color: '#0f1724', fontFamily: 'inherit', resize: 'vertical', outline: 'none',
              lineHeight: 1.65, transition: 'border .15s',
            }}
            onFocus={e => e.target.style.borderColor = '#002280'}
            onBlur={e => e.target.style.borderColor = '#e4e8f2'}
          />
          <p style={{ fontSize: '.67rem', color: '#9ca3af', textAlign: 'right', margin: '3px 0 0' }}>
            {body.length}/1000
          </p>
        </div>

        {/* Validation message */}
        {!valid && (title || body) && (
          <p style={{ fontSize: '.75rem', color: '#C8102E', fontWeight: 600, margin: 0 }}>
            Both title and message body are required.
          </p>
        )}

        {/* Type selector */}
        <div>
          <label style={{ fontSize: '.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: '.5rem' }}>
            Announcement Type
          </label>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => setType(k)}
                style={{
                  padding: '.5rem 1rem', borderRadius: 9, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '.78rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '.4rem',
                  border: type === k ? `2px solid ${v.color}` : `1.5px solid ${v.border}`,
                  background: type === k ? v.bg : '#fafafa',
                  color: type === k ? v.color : '#6b7280',
                  transition: 'all .12s',
                }}
              >
                <span style={{ width: 14, height: 14, color: type === k ? v.color : '#9ca3af' }}>
                  {TYPE_ICONS[k]}
                </span>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Course targeting */}
        <div>
          <label style={{ fontSize: '.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: '.5rem' }}>
            Course{' '}
            <span style={{ fontWeight: 500, textTransform: 'none', fontSize: '.68rem', color: '#9ca3af' }}>
              (empty = All Courses)
            </span>
          </label>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {COURSES.map(c => {
              const sel = targetCourses.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTargetCourses(prev => toggle(prev, c))}
                  style={pillStyle(sel, '#002280', '#eef1fb', '#c7d3f7')}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Year level targeting */}
        <div>
          <label style={{ fontSize: '.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: '.5rem' }}>
            Year Level{' '}
            <span style={{ fontWeight: 500, textTransform: 'none', fontSize: '.68rem', color: '#9ca3af' }}>
              (empty = All Year Levels)
            </span>
          </label>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {YEAR_LEVELS.map(y => {
              const sel = targetYearLevels.includes(y);
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => setTargetYearLevels(prev => toggle(prev, y))}
                  style={pillStyle(sel, '#002280', '#eef1fb', '#c7d3f7')}
                >
                  {YEAR_LABELS[y]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live preview */}
        <div>
          <label style={{ fontSize: '.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: '.5rem' }}>
            Live Preview
          </label>
          <div style={{
            background: cfg.bg, border: `1.5px solid ${cfg.border}`,
            borderRadius: 12, padding: '1rem 1.1rem',
            display: 'flex', gap: '.75rem', alignItems: 'flex-start',
          }}>
            <span style={{ width: 20, height: 20, color: cfg.color, flexShrink: 0, marginTop: 2 }}>
              {TYPE_ICONS[type]}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '.82rem', fontWeight: 800, color: cfg.color, margin: '0 0 4px' }}>
                {title || 'Untitled announcement'}
              </p>
              <p style={{ fontSize: '.78rem', color: '#374151', margin: '0 0 6px', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                {body || 'Announcement body will appear here…'}
              </p>
              <p style={{ fontSize: '.67rem', color: cfg.color, margin: 0, fontWeight: 700 }}>
                → {previewAudience}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        padding: '.9rem 1.4rem', borderTop: '1px solid #f3f4f6',
        display: 'flex', gap: '.6rem', alignItems: 'center',
      }}>
        <button
          type="submit"
          className="sl-btn sl-btn--primary"
          disabled={saving || !valid}
          style={{
            padding: '.6rem 1.4rem', fontSize: '.84rem', fontWeight: 800,
            borderRadius: 10, display: 'flex', alignItems: 'center', gap: '.5rem',
          }}
        >
          {saving ? (
            <>
              <span style={{
                width: 14, height: 14,
                border: '2px solid rgba(255,255,255,.4)',
                borderTop: '2px solid #fff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                display: 'inline-block',
              }} />
              {isEdit ? 'Updating…' : 'Posting…'}
            </>
          ) : (
            <>
              <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              {isEdit ? 'Update Announcement' : 'Post Announcement'}
            </>
          )}
        </button>
        <button
          type="button"
          className="sl-btn sl-btn--ghost"
          onClick={onCancel}
          style={{ padding: '.6rem 1.1rem', fontSize: '.84rem', borderRadius: 10 }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────────
   AnnouncementsArchivePage — full-page archive view
───────────────────────────────────────────────────────────── */
function AnnouncementsArchivePage({ announcements, onRestore, onDelete }) {
  const archived = announcements
    .filter(a => !a.is_active)
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

  return (
    <div className="db-panel" style={{ padding: '1.5rem' }}>
      {/* Section header */}
      <div style={{ marginBottom: '1rem', paddingBottom: '.75rem', borderBottom: '1px solid #f3f4f6' }}>
        <p style={{ margin: 0, fontSize: '.95rem', fontWeight: 800, color: '#0f1724' }}>Archived Announcements</p>
        <p style={{ margin: '2px 0 0', fontSize: '.72rem', color: '#94a3b8' }}>
          {archived.length} archived announcement{archived.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Count badge */}
      <span className="sl-count" style={{ marginBottom: '0.75rem', display: 'block' }}>
        <strong>{archived.length}</strong> archived announcements
      </span>

      {/* Empty state */}
      {archived.length === 0 ? (
        <div className="db-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 44, height: 44, color: '#d1d5db' }}>
            <polyline points="21 8 21 21 3 21 3 8"/>
            <rect x="1" y="3" width="22" height="5"/>
            <line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
          <p>No archived announcements</p>
          <span>Announcements you archive will appear here.</span>
        </div>
      ) : (
        <div className="sl-list">
          {archived.map((ann, i) => {
            const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info;
            return (
              <div key={ann.id} className="sl-list-row" style={{ alignItems: 'center' }}>
                <span className="sl-list-num">{i + 1}</span>
                {/* Type badge */}
                <span style={{
                  fontSize: '.62rem', fontWeight: 700, padding: '.15rem .5rem', borderRadius: 999,
                  background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                  flexShrink: 0,
                }}>
                  {cfg.label}
                </span>
                <div className="sl-list-info" style={{ flex: 2 }}>
                  <p className="sl-list-name">{ann.title}</p>
                  <p className="sl-list-sn">
                    {audienceLabel(ann)} · Archived {timeAgo(ann.updated_at || ann.created_at)}
                  </p>
                </div>
                {/* Row actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="sl-btn sl-btn--ghost"
                    style={{ padding: '5px 12px', fontSize: '.76rem' }}
                    onClick={() => onRestore(ann.id)}
                  >
                    ↩ Restore
                  </button>
                  <button
                    className="sl-act-btn"
                    title="Permanently delete"
                    onClick={() => onDelete(ann)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14H6L5 6"/>
                      <path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
