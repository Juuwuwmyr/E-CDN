# AnnouncementsPage — Professional Institutional Rewrite (Plan)

Rewrite `src/components/Dashboard/tabs/AnnouncementsPage.jsx` into a real, every-day institutional announcements management system: a stats bar + a two-pane (inbox-style list / detail-or-compose) workspace. Single file, single default export, no external libraries, inline styles + existing `sl-*`/`db-*` classes only.

Target file (only file modified):
- `src/components/Dashboard/tabs/AnnouncementsPage.jsx`

---

## Design decisions & gaps (resolved, do not re-decide)

1. **Scheduled publish (`publish_at`) is OMITTED.** The `announcements` table columns are exactly `id, title, body, type, created_by, is_active, target_courses, target_year_levels, created_at` — there is no `publish_at` or metadata column, and no scheduler backend exists. A scheduled-publish field that silently does nothing would be the toy behavior the user explicitly rejected, so it is left out. (If scheduling is wanted later, it needs a DB column + a cron/edge function — out of scope for this frontend rewrite.)
2. **The `db-hero` banner is REMOVED.** It is `display:none` on desktop (≥900px in dashboard.css) and reads as a marketing banner, not an institutional tool. The professional stats bar + split-pane replaces it.
3. **Inline `updateAnnouncement(id, updates)` is added at module scope** using the `supabase` client (named export) from `../../../lib/supabase`, table `announcements`, because `announcements.js` has no update helper. Update payload columns: `title, body, type, target_courses, target_year_levels` (null when empty, matching `createAnnouncement`).
4. **Props:** `Dashboard.jsx` mounts `<AnnouncementsPage user={user} onLogout={handleLogout} />`. Keep the signature `export default function AnnouncementsPage({ user })` — the extra `onLogout` prop is simply ignored. `created_by` uses `user?.username || user?.name || 'Admin'` (unchanged).
5. **Mobile (<768px) is JS-driven**, not a CSS media query, because inline styles cannot express the show/hide toggle + back-button logic. A `matchMedia('(max-width: 767px)')` listener sets `isMobile`; a `mobileShowDetail` boolean toggles which pane is full-screen; a Back button resets it.

Confirmed lib signatures (from `src/lib/announcements.js`):
- `fetchAllAnnouncements()` → `Promise<Array>` all rows, ordered `created_at desc`.
- `createAnnouncement({ title, body, type='info', createdBy, targetCourses=null, targetYearLevels=null })` → `Promise<row>` (uses `.select().single()`; nulls empty target arrays; sets `is_active:true`).
- `deactivateAnnouncement(id)` / `reactivateAnnouncement(id)` / `deleteAnnouncement(id)` → throw on error.

Confirmed CSS classes exist in `src/styles/dashboard.css`: `db-panel`, `db-panel-header`, `db-panel-header-left`, `db-panel-icon`, `db-panel-icon--blue`, `db-panel-title`, `db-panel-sub`, `db-stats-row`, `db-stat-card`, `db-stat-icon`, `db-stat-body`, `db-stat-value`, `db-stat-label`, `db-empty-state`, `db-no-results`, `sl-toolbar`, `sl-search-wrap`, `sl-search`, `sl-select`, `sl-btn`, `sl-btn--primary`, `sl-btn--ghost`, `sl-list`, `sl-list-row`, `sl-list-num`, `sl-list-info`, `sl-list-name`, `sl-list-sn`, `sl-count`, `sl-loading`, `sl-modal-backdrop`, `sl-modal`, `sl-modal-header`, `sl-modal-close`, `sl-modal-actions`, `sl-toast`, `sl-toast--success`, `sl-toast--error`, `sl-act-btn`, `sl-act-btn--edit`, `sl-act-btn--toggle`, `sl-act-btn--del`. Anything not listed here (e.g. a per-type list dot) uses inline styles.

---

## Implementation Plan

- [ ] 1. Rewrite the full desktop `AnnouncementsPage` component (imports, constants/helpers, inline `updateAnnouncement`, state, derived values, handlers, stats bar, two-pane layout, left inbox list, right empty/detail/compose views with the full form + live preview + action bar, toasts). Desktop-complete and buildable.
      - **Imports** (named React hooks only — NO `import React from 'react'`):
        ```js
        import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
        import {
          fetchAllAnnouncements, createAnnouncement,
          deactivateAnnouncement, reactivateAnnouncement, deleteAnnouncement,
        } from '../../../lib/announcements';
        import { supabase } from '../../../lib/supabase';
        ```
      - **Keep from the existing file** (module scope): `COURSES = ['BSIS','BPA','BTVTED-CHS','BTVTED-WFT']`, `YEAR_LEVELS = ['1','2','3','4']`, `YEAR_LABELS`, `TYPE_CONFIG` (info `#002280`/bg `#eef1fb`/border `#c7d3f7`; warning `#b45309`/`#fdf8ec`/`#fcd34d`; urgent `#C8102E`/`#fff0f2`/`#fecdd3`; event `#10813f`/`#edf7f1`/`#86efac`), `TYPE_ICONS` (the 4 inline SVGs), `timeAgo(ts)`, `audienceLabel(ann)` (returns "All Students" / "BSIS, BPA · 1st Year, 2nd Year" etc.), and `toggle(arr,val)`.
      - **Add module-scope inline update** (uses the imported `supabase`):
        ```js
        async function updateAnnouncement(id, updates) {
          const { error } = await supabase.from('announcements').update(updates).eq('id', id);
          if (error) throw error;
        }
        ```
      - **Component state** (`AnnouncementsPage({ user })`):
        - `announcements` (array, all), `loading` (bool)
        - `search` (string), `typeFilter` (`'all'|'info'|'warning'|'urgent'|'event'`), `statusFilter` (`'all'|'active'|'hidden'`)
        - `selectedId` (id|null), `editingId` (id|null — null = composing new)
        - `title`, `body`, `type` (`'info'` default), `targetCourses` ([]), `targetYearLevels` ([])
        - `saving` (bool — post/update in progress)
        - `toast` (`{msg,type}|null`) with a `toastTimer` `useRef` to clear the previous timeout; auto-clear after 4s
      - **Derived (`useMemo`):**
        - `filtered` — `announcements` filtered by `search` (case-insensitive on `title` + `body`), `typeFilter` (skip if `'all'`), `statusFilter` (`'active'`→`is_active`, `'hidden'`→`!is_active`), then sorted by `created_at desc` (re-sort to be safe).
        - `selected` — `announcements.find(a => a.id === selectedId)`.
        - `previewAudience` — from form state: courses join (or "All Courses") + " · " + years mapped via `YEAR_LABELS` (or "All Year Levels").
        - stats: `total = announcements.length`, `activeNow` = count `is_active`, `hidden` = count `!is_active`, `sentThisWeek` = count where `new Date(created_at).getTime() >= Date.now() - 7*24*3600*1000`.
      - **Right-pane mode** derived: `'compose'` when `editingId !== null || composing` flag is set; else `'detail'` when `selected`; else `'empty'`. Use an explicit `composeOpen` boolean to enter compose mode (set true by New/Edit, false by Cancel/submit), and `editingId` to distinguish edit vs. new.
      - **Handlers (`useCallback`):**
        - `load()` → `setLoading(true)`; `setAnnouncements(await fetchAllAnnouncements())`; catch → toast error; finally `setLoading(false)`. Run in `useEffect([])`.
        - `showToast(msg, type)` → clear prior timeout via ref, set toast, set new 4s timeout to clear.
        - `handleSelect(id)` → `setSelectedId(id)`, `setComposeOpen(false)`, `setEditingId(null)`.
        - `handleNew()` → reset form (`title''`, `body''`, `type'info'`, `targetCourses[]`, `targetYearLevels[]`), `setEditingId(null)`, `setSelectedId(null)`, `setComposeOpen(true)`.
        - `handleEdit(ann)` → prefill form from `ann` (`title`, `body`, `type`, `targetCourses` = `ann.target_courses ?? []`, `targetYearLevels` = `ann.target_year_levels ?? []`), `setEditingId(ann.id)`, `setSelectedId(ann.id)`, `setComposeOpen(true)`.
        - `handleCancel()` → `setComposeOpen(false)`, `setEditingId(null)`, reset form to empty.
        - `handleSubmit()` (form `onSubmit`) → guard: `title.trim()` and `body.trim()` required (else toast error). `setSaving(true)`. Build payload: `target_courses: targetCourses.length ? targetCourses : null`, `target_year_levels: targetYearLevels.length ? targetYearLevels : null`. If `editingId`: `await updateAnnouncement(editingId, { title, body, type, target_courses, target_year_levels })` → toast "Announcement updated", keep `selectedId`, `setComposeOpen(false)`, `setEditingId(null)`. Else: `const row = await createAnnouncement({ title:title.trim(), body:body.trim(), type, createdBy: user?.username || user?.name || 'Admin', targetCourses, targetYearLevels })` → toast "Announcement posted", `setSelectedId(row.id)`, `setComposeOpen(false)`, `setEditingId(null)`. Then `await load()` to refresh the list; catch → toast error; finally `setSaving(false)`.
        - `handleToggle(ann)` → if `ann.is_active` `await deactivateAnnouncement(ann.id)` else `await reactivateAnnouncement(ann.id)`; optimistically update `announcements` (flip `is_active`); toast `ann.is_active ? "Announcement hidden" : "Announcement re-activated"`; catch → toast error.
        - `handleDelete(ann)` → `if (!window.confirm('Permanently delete this announcement? This cannot be undone.')) return;` → `await deleteAnnouncement(ann.id)`; remove from `announcements`; if `selectedId === ann.id` clear selection + close compose; toast "Announcement deleted"; catch → toast error.
      - **JSX structure (desktop):**
        - Root: `<div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>`.
        - **Stats bar**: `<div className="db-stats-row">` with 4 `<div className="db-stat-card">` each containing `<div className="db-stat-icon">` (inline-colored SVG) + `<div className="db-stat-body">` with `<span className="db-stat-value">` and `<span className="db-stat-label">`. Cards: Total Announcements / Active Now / Hidden / Sent This Week.
        - **Split-pane container**: `<div style={{ display:'flex', gap:'1.25rem', alignItems:'flex-start' }}>` (mobile overrides added in item 2).
          - **Left pane** `db-panel`, inline `style={{ width:340, display:'flex', flexDirection:'column', flexShrink:0 }}`:
            - Header row: title "Announcements" (`db-panel-title`-style) + `sl-btn sl-btn--primary` "New Announcement" button (calls `handleNew`).
            - Filter sub-bar: `sl-search-wrap` + `sl-search` (search input, bound to `search`); two `sl-select` (type filter, status filter).
            - `sl-count` line: `"{filtered.length} of {announcements.length}"`.
            - Scrollable list wrapper `style={{ overflowY:'auto', flex:1 }}`:
              - `loading` → a "Loading…" row (or `sl-card sl-card--skeleton` skeleton if present; a plain centered "Loading announcements…" is fine).
              - `filtered.length === 0` → `db-no-results` with inbox icon + "No announcements match your filters".
              - else → `sl-list` of `sl-list-row` per `ann`: a colored priority dot (`span` circle, `background: TYPE_CONFIG[ann.type].color`, 8px), `sl-list-info` containing `sl-list-name` (title, truncated `white-space:nowrap; overflow:hidden; text-overflow:ellipsis`), an audience chip (small inline pill using `audienceLabel(ann)`), and a relative time (`timeAgo(ann.created_at)`) with `title={new Date(ann.created_at).toLocaleString()}` for the full-date tooltip. Selected row highlighted: `style={{ background: a.id===selectedId ? '#eef1fb' : undefined }}`. Inactive rows: `opacity: ann.is_active ? 1 : 0.5` and a small gray "Hidden" badge.
          - **Right pane** `db-panel`, inline `style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}`:
            - **Empty state** (no selection, not composing): centered `db-empty-state` — inbox icon + "Select an announcement or compose new".
            - **Detail view** (`selected && !composeOpen`): full title, type badge (TYPE_CONFIG color/bg/border), audience label, "Posted by {created_by}" + full timestamp (`title` tooltip), body in a `whiteSpace:'pre-wrap'` block (preserves line breaks), hidden indicator if inactive, and an action bar with three `sl-act-btn`-style buttons: **Edit** (`sl-act-btn--edit`, calls `handleEdit(selected)`), **Toggle** (`sl-act-btn--toggle`, calls `handleToggle(selected)`, label "Hide"/"Show"), **Delete** (`sl-act-btn--del`, calls `handleDelete(selected)`).
            - **Compose/Edit form** (`composeOpen`): a `<form onSubmit={handleSubmit}>` containing:
              - Title input (`maxLength=120`) with `{title.length}/120` counter; disable submit when `!title.trim()`.
              - Body textarea (`rows=6`, `maxLength=1000`, `whiteSpace` preserve) with `{body.length}/1000` counter; disable submit when `!body.trim()`.
              - Inline validation message when either is empty (e.g. "Title and message are required").
              - **Type selector**: 4 radio-style buttons (Info/Warning/Urgent/Event), each a clickable card styled with that type's `color`/`bg`/`border`; the selected one gets a stronger border + filled look. Updates `type`.
              - **Course multi-select**: label "Course" + a row of pill-toggle buttons, one per `COURSES` (toggle membership via `toggle(targetCourses, c)`). Empty array = "All Courses" (show that hint).
              - **Year Level multi-select**: label "Year Level" + pill-toggle buttons, one per `YEAR_LEVELS` labeled via `YEAR_LABELS` (toggle via `toggle(targetYearLevels, y)`). Empty = "All Year Levels".
              - **Live preview panel** (always visible): a card using the current type's `bg`/`border` + `TYPE_ICONS[type]`, showing `title || 'Untitled announcement'`, `body || 'Announcement body will appear here…'` (`whiteSpace:'pre-wrap'`), and `→ {previewAudience}`.
              - Actions: `sl-btn sl-btn--primary` submit button labeled "Post Announcement" (new) or "Update Announcement" (edit), disabled while `saving` or when title/body empty (show spinner text "Posting…"/"Updating…"); `sl-btn sl-btn--ghost` "Cancel" button (calls `handleCancel`).
      - **Toast**: at root bottom, render `toast && <div className={'sl-toast sl-toast--' + (toast.type === 'error' ? 'error' : 'success')}>{toast.msg}</div>`.
      - **Keep** the existing `<style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>` block for the submit spinner.
      - Files: `src/components/Dashboard/tabs/AnnouncementsPage.jsx`
      - Verify: `cd c:\Users\moren\Desktop\E-CDN\colegio-de-naujan && npm run build` — build exits 0 with no parse/compile errors. (Open the Announcements tab in the running app to confirm the two-pane layout, stats bar, list, and compose form render; select a row → detail shows; New → compose shows; Edit pre-fills; Toggle/Delete work; Post/Update work.)

- [ ] 2. Add mobile responsive behavior below 768px.
      - Add `isMobile` state set from `matchMedia('(max-width: 767px)')` in a `useEffect` with a `change` listener and proper cleanup.
      - Add `mobileShowDetail` boolean: set `true` when a row is selected (`handleSelect`) or New/Edit is opened (`handleNew`/`handleEdit`); set `false` by a Back button and by `handleCancel`/successful submit when returning to the list.
      - Apply inline styles that switch on mobile:
        - Split-pane container: `flexDirection: isMobile ? 'column' : 'row'`.
        - Left pane: `width: isMobile ? '100%' : 340`, `display: isMobile && mobileShowDetail ? 'none' : 'flex'`.
        - Right pane: `flex: 1`, `display: isMobile && !mobileShowDetail ? 'none' : 'flex'`.
        - When `isMobile && mobileShowDetail`, render a Back button (e.g. `sl-btn sl-btn--ghost`) at the top of the right pane that calls a handler setting `mobileShowDetail(false)` and, if not composing, clears selection so the list reappears.
      - Files: `src/components/Dashboard/tabs/AnnouncementsPage.jsx`
      - Verify: `cd c:\Users\moren\Desktop\E-CDN\colegio-de-naujan && npm run build` — build exits 0. Then (browser DevTools, viewport <768px) confirm: list shows full-width by default, tapping a row opens the detail/compose full-screen with a Back button, Back returns to the list.

- [ ] 3. Final production build gate — fix every error until clean.
      - Run the exact build command from the project root and resolve all errors (unused imports, missing hooks, JSX typos, bad supabase payload shape, etc.).
      - Files: `src/components/Dashboard/tabs/AnnouncementsPage.jsx`
      - Verify: `cd c:\Users\moren\Desktop\E-CDN\colegio-de-naujan && npm run build` — exits 0 with no errors and no warnings that block the build. This is the hard gate; do not finish until it is green.

---

## Notes for the implementer

- The announcement table is `announcements`. For the inline update, send only content columns (`title, body, type, target_courses, target_year_levels`); do NOT send `id`, `created_by`, `created_at`, or `is_active` (active state is changed only via the separate Toggle action).
- `target_courses` / `target_year_levels` MUST be `null` (not `[]`) when nothing is selected — the DB schema and `createAnnouncement` expect null for "all"; sending `[]` would target nobody. Replicate the `arr.length ? arr : null` pattern in the update payload.
- Keep `created_by` exactly `user?.username || user?.name || 'Admin'` on create; do not change it on edit.
- Use existing `sl-*`/`db-*` classes wherever the spec lists them; use inline styles only for the parts no class covers (priority dot, type radio buttons, pill toggles, split-pane widths, preview card colors, mobile show/hide).
- No external libraries. No `import React from 'react'`. Named hooks only.
