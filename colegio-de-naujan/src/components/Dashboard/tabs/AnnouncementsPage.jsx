/**
 * AnnouncementsPage.jsx
 * ─────────────────────────────────────────────────────────
 * Admin tab: compose + manage announcements.
 * Supports audience targeting by course and year level.
 */
import { useState, useEffect } from 'react';
import {
  fetchAllAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  reactivateAnnouncement,
  deactivateAnnouncement,
} from '../../../lib/announcements';

/* ── Audience config ──────────────────────────────────── */
const COURSES = ['BSIS', 'BPA', 'BTVTED-CHS', 'BTVTED-WFT'];
const YEAR_LEVELS = ['1', '2', '3', '4'];
const YEAR_LABELS = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };

/* ── Type config ─────────────────────────────────────────── */
const TYPE_CONFIG = {
  info: { label: 'Info', color: '#002280', bg: '#eef1fb', border: '#c7d3f7' },
  warning: { label: 'Warning', color: '#b45309', bg: '#fdf8ec', border: '#fcd34d' },
  urgent: { label: 'Urgent', color: '#C8102E', bg: '#fff0f2', border: '#fecdd3' },
  event: { label: 'Event', color: '#10813f', bg: '#edf7f1', border: '#86efac' },
};
const TYPE_ICONS = {
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  warning: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  urgent: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  event: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
};

const timeAgo = (ts) => {
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (d < 60) return d + 's ago';
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
};

const audienceLabel = (ann) => {
  const courses = ann.target_courses?.length ? ann.target_courses.join(', ') : null;
  const years = ann.target_year_levels?.length
    ? ann.target_year_levels.map(y => YEAR_LABELS[y] || ('Year ' + y)).join(', ')
    : null;
  if (!courses && !years) return 'All Students';
  if (courses && !years) return courses;
  if (!courses && years) return 'All Courses · ' + years;
  return courses + ' · ' + years;
};

/* Toggle helper for multi-select arrays */
const toggle = (arr, val) =>
  arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

/* ═══════════════════════════════════════════════════════════ */
export default function AnnouncementsPage({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* form state */
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('info');
  const [targetCourses, setTargetCourses] = useState([]); // [] = all
  const [targetYearLevels, setTargetYearLevels] = useState([]); // [] = all

  /* derived: are all selected? */
  const allCourses = targetCourses.length === 0;
  const allYears = targetYearLevels.length === 0;

  /* preview audience string */
  const previewAudience = (() => {
    const c = targetCourses.length ? targetCourses.join(', ') : 'All Courses';
    const y = targetYearLevels.length
      ? targetYearLevels.map(v => YEAR_LABELS[v]).join(', ')
      : 'All Year Levels';
    return c + ' · ' + y;
  })();

  const load = async () => {
    setLoading(true);
    try { setAnnouncements(await fetchAllAnnouncements()); }
    catch (e) { setError('Failed to load: ' + e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  /* ── Post ───────────────────────────────────────────────── */
  const handlePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { setError('Title and message are required.'); return; }
    setPosting(true); setError(''); setSuccess('');
    try {
      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        type,
        createdBy: user?.username || user?.name || 'Admin',
        targetCourses: targetCourses.length ? targetCourses : null,
        targetYearLevels: targetYearLevels.length ? targetYearLevels : null,
      });
      setTitle(''); setBody(''); setType('info');
      setTargetCourses([]); setTargetYearLevels([]);
      setSuccess('✓ Announcement broadcast to ' + previewAudience + '!');
      await load();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError('Failed to post: ' + e.message);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this announcement?')) return;
    try { await deleteAnnouncement(id); setAnnouncements(a => a.filter(x => x.id !== id)); }
    catch (e) { setError(e.message); }
  };

  const handleToggle = async (ann) => {
    try {
      if (ann.is_active) await deactivateAnnouncement(ann.id);
      else await reactivateAnnouncement(ann.id);
      setAnnouncements(a => a.map(x => x.id === ann.id ? { ...x, is_active: !x.is_active } : x));
    } catch (e) { setError(e.message); }
  };

  const filtered = announcements.filter(a => {
    if (filter === 'active') return a.is_active;
    if (filter === 'inactive') return !a.is_active;
    return true;
  });
  const activeCount = announcements.filter(a => a.is_active).length;
  const inactiveCount = announcements.filter(a => !a.is_active).length;

  /* ── Shared pill style helper ─────────────────────────── */
  const pillStyle = (selected) => ({
    padding: '.35rem .85rem', borderRadius: 999, fontSize: '.78rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s', border: 'none',
    background: selected ? '#002280' : '#f3f4f6',
    color: selected ? '#fff' : '#374151',
    outline: selected ? '2px solid #002280' : 'none',
    outlineOffset: 1,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── HERO ──────────────────────────────────────────── */}
      <div className="db-hero">
        <div className="db-hero-noise" aria-hidden="true" />
        <div className="db-hero-stripe" aria-hidden="true" />
        <div className="db-hero-inner">
          <div className="db-hero-left">
            <div className="db-hero-badge"><span className="db-hero-badge-dot" />Announcements</div>
            <h1 className="db-hero-greeting">Broadcast<br /><span className="db-hero-name">Announcements</span></h1>
            <p className="db-hero-sub">Target by <strong>course</strong> and <strong>year level</strong>, or notify <strong>all students</strong> at once.</p>
            <div className="db-hero-pills">
              <span className="db-hero-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6z" /><path d="M12 17V3" /><path d="M5 10l7-7 7 7" /></svg>
                {activeCount} Active
              </span>
              <span className="db-hero-pill db-hero-pill--gold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /></svg>
                {COURSES.length} Courses Supported
              </span>
            </div>
          </div>
          <svg style={{ width: 64, height: 64, color: 'rgba(255,255,255,.18)', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6z" /><path d="M12 17V3" /><path d="M5 10l7-7 7 7" />
          </svg>
        </div>
      </div>

      {/* ── COMPOSE PANEL ─────────────────────────────────── */}
      <div className="db-panel">
        <div className="db-panel-header">
          <div className="db-panel-header-left">
            <div className="db-panel-icon db-panel-icon--blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            </div>
            <div><p className="db-panel-title">Compose Announcement</p><p className="db-panel-sub">Target by course, year level, or send to all</p></div>
          </div>
        </div>

        {error && <div style={{ margin: '0 1.25rem .5rem', padding: '.8rem 1rem', background: '#fff0f2', border: '1px solid #fecdd3', borderRadius: 10, fontSize: '.83rem', color: '#C8102E', fontWeight: 600 }}>{error}</div>}
        {success && <div style={{ margin: '0 1.25rem .5rem', padding: '.8rem 1rem', background: '#edf7f1', border: '1px solid #86efac', borderRadius: 10, fontSize: '.83rem', color: '#10813f', fontWeight: 600 }}>{success}</div>}

        <form onSubmit={handlePost} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* ── Announcement Type ── */}
          <div>
            <p style={{ fontSize: '.72rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>Type</p>
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setType(k)}
                  style={{
                    padding: '.4rem .9rem', borderRadius: 999, fontSize: '.78rem', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s',
                    background: type === k ? v.color : v.bg, color: type === k ? '#fff' : v.color,
                    border: `1.5px solid ${type === k ? v.color : v.border}`,
                  }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Audience: Courses ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
              <p style={{ fontSize: '.72rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', margin: 0 }}>
                Notify — Course
              </p>
              {!allCourses && (
                <button type="button" onClick={() => setTargetCourses([])}
                  style={{ fontSize: '.65rem', fontWeight: 700, color: '#002280', background: '#eef1fb', border: 'none', borderRadius: 6, padding: '.15rem .5rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Clear
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              {/* All Courses button */}
              <button type="button" onClick={() => setTargetCourses([])} style={pillStyle(allCourses)}>
                All Courses
              </button>
              {COURSES.map(c => (
                <button key={c} type="button" onClick={() => setTargetCourses(prev => toggle(prev, c))}
                  style={pillStyle(targetCourses.includes(c))}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* ── Audience: Year Level ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
              <p style={{ fontSize: '.72rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', margin: 0 }}>
                Notify — Year Level
              </p>
              {!allYears && (
                <button type="button" onClick={() => setTargetYearLevels([])}
                  style={{ fontSize: '.65rem', fontWeight: 700, color: '#002280', background: '#eef1fb', border: 'none', borderRadius: 6, padding: '.15rem .5rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Clear
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setTargetYearLevels([])} style={pillStyle(allYears)}>
                All Year Levels
              </button>
              {YEAR_LEVELS.map(y => (
                <button key={y} type="button" onClick={() => setTargetYearLevels(prev => toggle(prev, y))}
                  style={pillStyle(targetYearLevels.includes(y))}>
                  {YEAR_LABELS[y]}
                </button>
              ))}
            </div>
          </div>

          {/* ── Audience summary badge ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.6rem .9rem', background: '#f7f8fc', borderRadius: 10, border: '1.5px solid #e4e8f2' }}>
            <svg style={{ width: 15, height: 15, color: '#002280', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            <p style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', margin: 0 }}>
              <span style={{ color: '#002280' }}>Audience: </span>{previewAudience}
            </p>
          </div>

          {/* ── Title ── */}
          <div>
            <p style={{ fontSize: '.72rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.4rem' }}>Title</p>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Enrollment for AY 2026-2027 is now open"
              maxLength={120}
              style={{ width: '100%', padding: '.8rem 1rem', borderRadius: 10, border: '1.5px solid #e4e8f2', fontSize: '.9rem', fontWeight: 600, color: '#0f1724', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border .15s' }}
              onFocus={e => e.target.style.borderColor = '#002280'}
              onBlur={e => e.target.style.borderColor = '#e4e8f2'}
            />
            <p style={{ fontSize: '.68rem', color: '#9ca3af', marginTop: 4, textAlign: 'right' }}>{title.length}/120</p>
          </div>

          {/* ── Body ── */}
          <div>
            <p style={{ fontSize: '.72rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.4rem' }}>Message</p>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder="Write the full announcement message here…"
              rows={5} maxLength={1000}
              style={{ width: '100%', padding: '.85rem 1rem', borderRadius: 10, border: '1.5px solid #e4e8f2', fontSize: '.88rem', color: '#0f1724', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6, transition: 'border .15s' }}
              onFocus={e => e.target.style.borderColor = '#002280'}
              onBlur={e => e.target.style.borderColor = '#e4e8f2'}
            />
            <p style={{ fontSize: '.68rem', color: '#9ca3af', marginTop: 4, textAlign: 'right' }}>{body.length}/1000</p>
          </div>

          {/* ── Preview ── */}
          {(title || body) && (() => {
            const cfg = TYPE_CONFIG[type];
            return (
              <div style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: 12, padding: '1rem 1.1rem', display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                <span style={{ width: 20, height: 20, color: cfg.color, flexShrink: 0, marginTop: 2 }}>{TYPE_ICONS[type]}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '.82rem', fontWeight: 800, color: cfg.color, margin: '0 0 4px' }}>{title || 'Untitled'}</p>
                  <p style={{ fontSize: '.78rem', color: '#374151', margin: '0 0 6px', lineHeight: 1.5 }}>{body || '…'}</p>
                  <p style={{ fontSize: '.68rem', color: cfg.color, margin: 0, fontWeight: 700 }}>→ {previewAudience}</p>
                </div>
              </div>
            );
          })()}

          {/* ── Submit ── */}
          <button type="submit" disabled={posting || !title.trim() || !body.trim()}
            style={{
              padding: '.9rem 2rem', borderRadius: 12, border: 'none', fontSize: '.9rem', fontWeight: 800,
              color: '#fff', background: posting ? '#94a3b8' : '#002280',
              cursor: posting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '.6rem', justifyContent: 'center',
              transition: 'background .15s', alignSelf: 'flex-start',
            }}
            onMouseEnter={e => { if (!posting) e.currentTarget.style.background = '#001a66'; }}
            onMouseLeave={e => { if (!posting) e.currentTarget.style.background = '#002280'; }}>
            {posting ? (
              <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />Broadcasting…</>
            ) : (
              <><svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>Broadcast to {previewAudience}</>
            )}
          </button>
        </form>
      </div>

      {/* ── MANAGE PANEL ──────────────────────────────────── */}
      <div className="db-panel">
        <div className="db-panel-header">
          <div className="db-panel-header-left">
            <div className="db-panel-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
            </div>
            <div>
              <p className="db-panel-title">Manage Announcements</p>
              <p className="db-panel-sub">{announcements.length} total · {activeCount} active · {inactiveCount} hidden</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.4rem' }}>
            {['all', 'active', 'inactive'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '.3rem .75rem', borderRadius: 999, fontSize: '.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', transition: 'all .12s', background: filter === f ? '#002280' : '#f3f4f6', color: filter === f ? '#fff' : '#6b7280', border: 'none' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '.85rem' }}>Loading announcements…</div>
        ) : filtered.length === 0 ? (
          <div className="db-no-results">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6z" /><path d="M12 17V3" /><path d="M5 10l7-7 7 7" /></svg>
            <p>No announcements {filter !== 'all' ? `(${filter})` : ''}</p>
            <p style={{ fontSize: '.78rem', color: '#9ca3af' }}>Compose one above to notify students.</p>
          </div>
        ) : filtered.map((ann, i) => {
          const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info;
          return (
            <div key={ann.id}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.1rem 1.25rem', borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none', opacity: ann.is_active ? 1 : 0.55 }}
              onMouseEnter={e => e.currentTarget.style.background = '#f7f8fc'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>

              <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ width: 18, height: 18 }}>{TYPE_ICONS[ann.type] || TYPE_ICONS.info}</span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap', marginBottom: 4 }}>
                  <p style={{ fontSize: '.88rem', fontWeight: 800, color: '#0f1724', margin: 0 }}>{ann.title}</p>
                  <span style={{ fontSize: '.62rem', fontWeight: 800, padding: '.2rem .55rem', borderRadius: 999, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, textTransform: 'uppercase', letterSpacing: '.04em' }}>{cfg.label}</span>
                  {!ann.is_active && <span style={{ fontSize: '.62rem', fontWeight: 800, padding: '.2rem .55rem', borderRadius: 999, background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e4e8f2', textTransform: 'uppercase' }}>Hidden</span>}
                </div>
                <p style={{ fontSize: '.82rem', color: '#374151', margin: '0 0 5px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ann.body}</p>
                {/* Audience tag */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', fontSize: '.65rem', fontWeight: 700, color: '#6b7280', background: '#f3f4f6', border: '1px solid #e4e8f2', borderRadius: 999, padding: '.18rem .55rem' }}>
                  <svg style={{ width: 10, height: 10 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                  {audienceLabel(ann)}
                </span>
                <p style={{ fontSize: '.67rem', color: '#9ca3af', margin: '5px 0 0' }}>by <strong style={{ color: '#6b7280' }}>{ann.created_by || 'Admin'}</strong> · {timeAgo(ann.created_at)}</p>
              </div>

              <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
                <button onClick={() => handleToggle(ann)} title={ann.is_active ? 'Hide' : 'Show'}
                  style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid #e4e8f2', background: '#f7f8fc', color: ann.is_active ? '#10813f' : '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {ann.is_active
                    ? <svg style={{ width: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    : <svg style={{ width: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  }
                </button>
                <button onClick={() => handleDelete(ann.id)} title="Delete"
                  style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid #fecdd3', background: '#fff0f2', color: '#C8102E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
