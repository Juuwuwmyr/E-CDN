# Implementation Plan — Full-Page Archive Views

## Project context
- Build: `npm run build` (Vite)
- Lint: `npm run lint` (oxlint)
- No test framework — verification is a clean `npm run build` with zero errors.
- Named imports only. No `import React from 'react'`.
- Reference pattern: GovernancePage uses `subTab === 'archive'` to conditionally render `<ArchiveTab>` **instead of** the stats bar + sub-tab content. Same approach applies to all three files.

---

## FILE 1 — AnnouncementsPage.jsx

### Current state
- `statusFilter` state: `'all' | 'active' | 'hidden' | 'archived'`
- Archive button (line ≈330) toggles `statusFilter` between `'archived'` and `'all'`; it currently just filters the left-pane list
- When `statusFilter === 'archived'` the button already shows `'← Back'`
- `reactivateAnnouncement(id)` and `deleteAnnouncement(id)` are already imported
- Archived items = `announcements.filter(a => !a.is_active)`

### Structural change
In the return JSX of `AnnouncementsPage`, the top-level `<div>` currently contains:
1. PAGE HEADER
2. STATS BAR (`<div className="db-stats-row">`)
3. SPLIT-PANE (`<div style={{ display:'flex'... }}>`)

Add a conditional branch **after the PAGE HEADER** and **before the STATS BAR**:

```jsx
{statusFilter === 'archived' ? (
  <AnnouncementsArchivePage
    announcements={announcements}
    onRestore={...}
    onDelete={...}
    showToast={showToast}
    onLoad={load}
  />
) : (
  <>
    {/* STATS BAR */}
    {/* SPLIT-PANE */}
  </>
)}
```

The PAGE HEADER stays visible in both states so the Archive / ← Back button is always present.

### Back button
Already correct: clicking the button when `statusFilter === 'archived'` sets it back to `'all'`, which exits the archive view. No extra logic needed.

### AnnouncementsArchivePage inline component (new, defined below `AnnouncementsPage`)

```jsx
function AnnouncementsArchivePage({ announcements, onRestore, onDelete, showToast, onLoad }) {
  // derived: archived items sorted newest-first
  const archived = announcements
    .filter(a => !a.is_active)
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

  return (
    <div className="db-panel" style={{ padding: '1.5rem' }}>
      {/* Page header row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
        <div>
          <p style={{ margin:0, fontSize:'.95rem', fontWeight:800, color:'#0f1724' }}>Archived Announcements</p>
          <p style={{ margin:'2px 0 0', fontSize:'.72rem', color:'#94a3b8' }}>
            {archived.length} archived announcement{archived.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Count badge */}
      <span className="sl-count" style={{ marginBottom:'0.75rem', display:'block' }}>
        <strong>{archived.length}</strong> archived announcements
      </span>

      {/* Empty state */}
      {archived.length === 0 ? (
        <div className="db-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width:44, height:44, color:'#d1d5db' }}>
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
              <div key={ann.id} className="sl-list-row" style={{ alignItems:'center' }}>
                <span className="sl-list-num">{i + 1}</span>
                {/* Type badge */}
                <span style={{
                  fontSize:'.62rem', fontWeight:700, padding:'.15rem .5rem', borderRadius:999,
                  background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`,
                  flexShrink:0,
                }}>
                  {cfg.label}
                </span>
                <div className="sl-list-info" style={{ flex:2 }}>
                  <p className="sl-list-name">{ann.title}</p>
                  <p className="sl-list-sn">
                    {audienceLabel(ann)} · Archived {timeAgo(ann.updated_at || ann.created_at)}
                  </p>
                </div>
                {/* Row actions */}
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button
                    className="sl-btn sl-btn--ghost"
                    style={{ padding:'5px 12px', fontSize:'.76rem' }}
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
```

### Handler wiring
- `onRestore(id)` → calls `reactivateAnnouncement(id)`, then `setAnnouncements(prev => prev.map(x => x.id === id ? { ...x, is_active: true } : x))`, shows toast.
- `onDelete(ann)` → calls `window.confirm(...)`, then `deleteAnnouncement(ann.id)`, then `setAnnouncements(prev => prev.filter(x => x.id !== ann.id))`, shows toast.
  - Both handlers are **new** callbacks defined inside `AnnouncementsPage` using `useCallback`. They follow the same pattern as the existing `handlePermanentDelete` and `handleToggle` handlers.
  - Pass them directly as `onRestore` / `onDelete` props to `<AnnouncementsArchivePage>`.

### Edge cases
- `selectedId` and `composeOpen`: when entering archive view the split-pane is hidden entirely, so no de-selection is needed. When returning (Back button sets `statusFilter='all'`), the existing `selectedId` and `composeOpen` state remain—this is fine; the user is returned to their last detail/compose position.
- The left-pane filter dropdown also has an `'archived'` option; it still works as before for filtering within the split-pane when `statusFilter !== 'archived'`. No change needed.

---

## FILE 2 — AccountsPage.jsx

### Current state
- `userListFilter` state: `'active' | 'archived'`
- Archive button (line ≈674) toggles `userListFilter` between `'archived'` and `'active'`; also calls `setSelectedUser(null)`.
- Archived items = portal users where `u.is_active === false`
- `toggleUserActive(id, true)` already imported (restores user)
- `deletePortalUser(id)` already imported (permanent delete)
- `accountAvatarColor(username)` already imported

### Structural change
In the return JSX of `AccountsPage`, the layout is:
1. PAGE HEADER (with Archive button)
2. Stats (`<div className="db-stats-row">`)
3. Split pane (`<div style={{ display:'flex'... }}>`)

Add a conditional branch **after the PAGE HEADER** and **before Stats**:

```jsx
{userListFilter === 'archived' ? (
  <AccountsArchivePage
    portalUsers={portalUsers}
    onRestore={handleArchiveRestore}
    onDelete={handleArchiveDelete}
    showToast={showToast}
    onLoad={fetchAll}
  />
) : (
  <>
    {/* Stats row */}
    {/* Split pane */}
  </>
)}
```

The PAGE HEADER stays visible in both states.

### Back button
Already correct: the Archive button sets `userListFilter` to `'active'` when it's currently `'archived'`. No extra logic needed. It also calls `setSelectedUser(null)` on every click, which is correct.

### AccountsArchivePage inline component (new, defined below `AccountsPage`)

```jsx
function AccountsArchivePage({ portalUsers, onRestore, onDelete }) {
  const archived = portalUsers.filter(u => u.is_active === false);

  return (
    <div className="db-panel" style={{ padding:'1.5rem' }}>
      {/* Header row — Back button lives in the PAGE HEADER above, not here */}
      <div style={{ marginBottom:'1rem' }}>
        <p style={{ margin:0, fontSize:'.95rem', fontWeight:800, color:'#0f1724' }}>Archived Accounts</p>
        <p style={{ margin:'2px 0 0', fontSize:'.72rem', color:'#94a3b8' }}>
          {archived.length} archived account{archived.length !== 1 ? 's' : ''}
        </p>
      </div>

      <span className="sl-count" style={{ marginBottom:'.75rem', display:'block' }}>
        <strong>{archived.length}</strong> archived accounts
      </span>

      {archived.length === 0 ? (
        <div className="db-empty-state">
          {/* archive box SVG */}
          <p>No archived accounts</p>
          <span>Accounts you archive will appear here.</span>
        </div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.84rem' }}>
            <thead>
              <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                {['#','Name','Username','Role','Date Archived','Actions'].map(h => (
                  <th key={h} style={{
                    padding:'10px 12px', textAlign:'left', fontSize:'.72rem',
                    fontWeight:700, color:'#6b7280', textTransform:'uppercase',
                    letterSpacing:'.04em', whiteSpace:'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {archived.map((u, i) => {
                const color = accountAvatarColor(u.username);
                const rm    = ROLE_META[u.role] || ROLE_META.student;
                return (
                  <tr key={u.id} style={{ borderBottom:'1px solid #f3f4f6', background:'#fff' }}>
                    <td style={{ padding:'12px', color:'#9ca3af', fontWeight:600 }}>{i + 1}</td>
                    <td style={{ padding:'12px', minWidth:160 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <div style={{
                          width:32, height:32, borderRadius:'50%', background:color, color:'#fff',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'.82rem', fontWeight:700, flexShrink:0,
                        }}>
                          {(u.full_name || u.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight:700, color:'#0f1724' }}>{u.full_name || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px', color:'#64748b' }}>{u.username}</td>
                    <td style={{ padding:'12px' }}>
                      <span className="sl-dept-badge" style={{ color:rm.color, background:rm.bg, fontSize:'.72rem', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>
                        {rm.label}
                      </span>
                    </td>
                    <td style={{ padding:'12px', color:'#9ca3af', fontSize:'.78rem', whiteSpace:'nowrap' }}>
                      {u.updated_at ? new Date(u.updated_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'}
                    </td>
                    <td style={{ padding:'12px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button
                          className="sl-btn sl-btn--ghost"
                          style={{ padding:'5px 12px', fontSize:'.76rem' }}
                          onClick={() => onRestore(u.id)}
                        >
                          ↩ Restore
                        </button>
                        <button
                          className="sl-act-btn"
                          title="Permanently delete"
                          onClick={() => onDelete(u)}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

### Handler wiring
Add two `useCallback` handlers in `AccountsPage`:

```js
const handleArchiveRestore = useCallback(async (id) => {
  try {
    await toggleUserActive(id, true);
    showToast('Account restored.');
    fetchAll();
  } catch (e) { showToast(e.message || 'Restore failed.', 'error'); }
}, [showToast, fetchAll]);

const handleArchiveDelete = useCallback(async (u) => {
  if (!window.confirm(`Permanently delete account "${u.username}"? This cannot be undone.`)) return;
  try {
    await deletePortalUser(u.id);
    showToast(`Account "${u.username}" permanently deleted.`);
    fetchAll();
  } catch (e) { showToast(e.message || 'Delete failed.', 'error'); }
}, [showToast, fetchAll]);
```

### Edge cases
- `setSelectedUser(null)` is already called by the Archive button handler, so no stale detail pane data leaks into the archive view.
- The left-pane Active / Archived filter buttons (`userListFilter`) also control which users appear in the left list when NOT in archive-view mode — that logic is unchanged. When `userListFilter === 'archived'` the entire stats + split-pane block is hidden by the conditional, so there's no duplication.
- `subTab` is left as-is; the archive view is portal-users-only (the page header Archive button is only shown when `subTab === 'portal'` — verify during implementation; if it's shown for `'student'` too, add a guard so the full-page replace only triggers for the portal sub-tab).

---

## FILE 3 — SystemAppsManager.jsx

### Current state
- `statusFilter` state: `'' | 'active' | 'inactive' | 'archived'`
- Archive button in the panel header toggles `statusFilter` between `'archived'` and `''`
- When `statusFilter === 'archived'` the button already shows `'← Back'`
- `handleRestore(app)` and `handleDelete(app)` already exist and handle confirm + toast internally
- Archived items = `apps.filter(a => a.badge === 'Archived')`
- The whole component is wrapped in a `<div className="db-panel">` — the archive view goes **inside** that panel

### Structural change
Inside the `db-panel` `<div>`, the layout is currently:
1. Panel header (`<div className="db-panel-header">`) — contains Archive button
2. Toolbar (search / filters / Add button)
3. Table

Wrap items 2 and 3 in a conditional:

```jsx
{/* Panel header stays always */}
<div className="db-panel-header">...</div>

{statusFilter === 'archived' ? (
  <SystemAppsArchiveView
    apps={apps}
    onRestore={handleRestore}
    onDelete={handleDelete}
  />
) : (
  <>
    {/* Toolbar */}
    {/* Table */}
  </>
)}
```

### Back button
Already correct: when `statusFilter === 'archived'` the button sets it back to `''`. No extra logic needed.

### SystemAppsArchiveView inline component (new, defined below `SystemAppsManager`)

```jsx
function SystemAppsArchiveView({ apps, onRestore, onDelete }) {
  const archived = apps.filter(a => a.badge === 'Archived');

  return (
    <div style={{ padding:'1.25rem 0' }}>
      {/* Section header */}
      <div style={{ marginBottom:'1rem', paddingBottom:'.75rem', borderBottom:'1px solid #f3f4f6' }}>
        <p style={{ margin:0, fontSize:'.92rem', fontWeight:800, color:'#0f1724' }}>Archived Applications</p>
        <p style={{ margin:'2px 0 0', fontSize:'.72rem', color:'#94a3b8' }}>
          {archived.length} archived application{archived.length !== 1 ? 's' : ''}
        </p>
      </div>

      <span style={{ fontSize:'.78rem', color:'#94a3b8', fontWeight:600, marginBottom:'.75rem', display:'block' }}>
        <strong style={{ color:'#374151' }}>{archived.length}</strong> archived applications
      </span>

      {archived.length === 0 ? (
        <div className="db-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width:44, height:44, color:'#d1d5db' }}>
            <polyline points="21 8 21 21 3 21 3 8"/>
            <rect x="1" y="3" width="22" height="5"/>
            <line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
          <p>No archived applications</p>
          <span>Applications you archive will appear here.</span>
        </div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.84rem' }}>
            <thead>
              <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                {['#','Application','Category','URL','Date Archived','Actions'].map(h => (
                  <th key={h} style={{
                    padding:'10px 12px', textAlign:'left', fontSize:'.72rem',
                    fontWeight:700, color:'#6b7280', textTransform:'uppercase',
                    letterSpacing:'.04em', whiteSpace:'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {archived.map((app, i) => (
                <tr key={app.id} style={{ borderBottom:'1px solid #f3f4f6', background:'#fff' }}>
                  <td style={{ padding:'12px', color:'#9ca3af', fontWeight:600 }}>{i + 1}</td>
                  <td style={{ padding:'12px', minWidth:180 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{
                        width:28, height:28, borderRadius:6, background:app.bg, color:app.color,
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                      }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:14, height:14 }}>
                          <rect x="2" y="3" width="20" height="14" rx="2"/>
                          <path d="M8 21h8M12 17v4"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontWeight:700, color:'#111827' }}>{app.label}</div>
                        {app.sub && <div style={{ fontSize:'.72rem', color:'#9ca3af' }}>{app.sub}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px' }}>
                    <span style={{
                      background:app.bg, color:app.color,
                      fontSize:'.68rem', fontWeight:700, padding:'3px 8px', borderRadius:4,
                      textTransform:'uppercase', letterSpacing:'.04em',
                    }}>
                      {catLabel(app.category)}
                    </span>
                  </td>
                  <td style={{ padding:'12px', maxWidth:200 }}>
                    <span style={{
                      fontSize:'.76rem', color:'#6b7280', fontFamily:'monospace',
                      display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:180,
                    }} title={app.url}>
                      {truncateUrl(app.url)}
                    </span>
                  </td>
                  <td style={{ padding:'12px', color:'#9ca3af', fontSize:'.78rem', whiteSpace:'nowrap' }}>
                    {app.updated_at ? new Date(app.updated_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'}
                  </td>
                  <td style={{ padding:'12px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button
                        onClick={() => onRestore(app)}
                        className="sl-btn sl-btn--ghost"
                        style={{ padding:'5px 12px', fontSize:'.76rem' }}
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
```

### Handler wiring
`handleRestore` and `handleDelete` already exist in `SystemAppsManager` with toast + confirm logic. Pass them directly as `onRestore` / `onDelete` to `<SystemAppsArchiveView>`. Note: `handleDelete` already calls `window.confirm` internally — do NOT double-wrap it.

### Edge cases
- `catLabel` and `truncateUrl` are defined at module-level in `SystemAppsManager.jsx` and are accessible to the new `SystemAppsArchiveView` component since it's defined in the same file.
- The existing archived-filter branch in `filtered` (the `useMemo`) is no longer needed for the archive view, but leave it in place — it doesn't break anything and is still used by the status-filter dropdown when in normal view.

---

## Order of implementation

- [ ] 1. **AnnouncementsPage.jsx** — Lowest risk. File has clean separation between page header and body. Add `handleArchiveRestore` + `handleArchiveDelete` callbacks, add the `statusFilter === 'archived'` conditional branch, and define the `AnnouncementsArchivePage` function at the bottom of the file.
      Files: `src/components/Dashboard/tabs/AnnouncementsPage.jsx`
      Verify: `npm run build` — zero errors, zero warnings.

- [ ] 2. **AccountsPage.jsx** — Medium risk (split-pane + RightPane sub-component). Add `handleArchiveRestore` + `handleArchiveDelete` callbacks, wrap the stats + split-pane in the `userListFilter === 'archived'` conditional, and define `AccountsArchivePage` at the bottom.
      Files: `src/components/Dashboard/tabs/AccountsPage.jsx`
      Verify: `npm run build` — zero errors.

- [ ] 3. **SystemAppsManager.jsx** — Cleanest: toolbar + table are already in one block inside `db-panel`. Wrap that block in `statusFilter === 'archived'` conditional and define `SystemAppsArchiveView` at the bottom.
      Files: `src/components/Dashboard/SystemAppsManager.jsx`
      Verify: `npm run build` — zero errors.
