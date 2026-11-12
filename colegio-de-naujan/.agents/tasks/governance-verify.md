# GovernancePage Rewrite — Verification

## Iteration
First iteration (`.agents/tasks/governance-review.json` did not exist). Completely rewrote `src/components/Dashboard/tabs/GovernancePage.jsx` from scratch per the task spec, following `.agents/tasks/governance-plan.md`.

## What changed
Single-file rewrite of the admin Governance page into three professional sub-tabs:

1. **Documents (Transparency)** — CMS-style publishing workflow.
   - 5-tile stat strip (Total / Draft / Submitted / Approved / Published).
   - Toolbar: title search, category dropdown, status-tab pills (All / Draft / Published / Archived), New Document.
   - Compact rows with category badge, status pipeline pills (draft→submitted→approved→published→archived, filled up to current), file-type chip, date, per-row checkbox.
   - Row actions: Publish Now (draft), Approve (submitted), Publish (approved), Archive (published), Download (file), Edit (all). Each mutation logs via `logActivity`.
   - Bulk select with Publish selected / Archive selected / Clear.
   - New Document modal (max-width 680, scrollable) keeps the existing drag-drop `uploadGovernanceFile` logic exactly as-is (onDrop/onDragOver/onDragLeave/pickFile/clearFile + picked-file card with progress bar).
   - Edit modal prefills from the doc, shows current file, allows re-upload, edits title/category/office/year/body/status.
   - Empty state with prompt + New Document action.

2. **Concerns (Accountability)** — helpdesk/ticketing inbox.
   - 4-tile summary bar (Total / Open / Overdue / Resolved this month); Overdue and Resolved-this-month computed client-side.
   - Toolbar: search, status, priority, category, sort (Newest/Priority/Status) selects + date-from/date-to + Refresh.
   - Inbox rows with color-coded left border by priority (urgent #C8102E, high #C8960C, normal #002280, low #10813f), category/priority/status badges, relative timestamp with full date on hover, red Overdue pill.
   - Slide-in right detail panel (max-width 680, full-height, scrollable body): header with badges + ref/category/time, description, submitter info (hidden when anonymous), 7-step status timeline with checked/unchecked circles + separate Rejected marker, quick-action bar (Mark Received / Assign / Under Review / In Progress / Resolve / Close / Reject), assignment form (office/person/deadline), internal notes (admin-only) + resolution note (submitter-visible) textareas, Save Changes via `updateConcernStatus`.
   - Empty state with Clear Filters action.

3. **Consultations (Participation)** — survey/consultation management.
   - 3-tile stat strip (Total / Active / Responses) from `getParticipationStats`.
   - List rows: title + date range, type badge, status badge, per-consultation response count (fetched via `getConsultationStats` into a counts map), actions: Manage Questions, Publish (draft), Close (published), View Responses.
   - Create modal: title, type, description, opens/closes datetime-local → `createConsultation`.
   - Question builder modal: lists existing questions (`getConsultationWithQuestions`), add-question form (text/type/options) → `addQuestion` using the real schema columns `question_text`/`question_type`/`options`/`sort_order`, with up/down reorder (preview-only, with a UI hint — no reorder lib function exists) and an honest limitation note.
   - View Responses modal: response count + per-question aggregated tallies via inline `supabase.from('consultation_responses').select('question_id,answer')` with a graceful fallback (count + question list only) if the query fails.

## Hard constraints — verified
- `import React from 'react'` — **0 occurrences** (grep confirmed).
- Named imports only: `import { useState, useEffect, useMemo, useRef, useCallback } from 'react';` — present. `useCallback` used for per-tab `showToast`; `useRef` for `fileInputRef` and `assignRef`; `useMemo` for filtered lists.
- `React.useRef` — **0 occurrences**.
- Single default export: `export default GovernancePage;` — present.
- `uploadGovernanceFile` drag-drop logic kept exactly as-is (called in create + edit, 2 call sites).
- `logActivity` retained on all mutations — **12 call sites** (document_created/updated/approved/published/archived, concern_updated, consultation_created/consultation_status_changed, question_added, plus bulk).
- Not committed or pushed — left in the working tree.

## Design requirements met
- Compact data-dense `sl-list-row`s; small icon+text action buttons via `sl-act-btn` / inline-styled `quickAct` pills.
- Priority colors applied to concern left borders and badges; status color coding consistent via shared `STATUS_COLORS`/`STATUS_BG`.
- Overdue items: red left border is priority-based; red Overdue pill added for past `target_deadline` and unresolved.
- Modals max-width 680px with scrollable body (`maxHeight:'92vh', overflowY:'auto'`).
- Empty states with one-line prompts + primary action buttons.
- Toast notifications (`sl-toast sl-toast--success/error`) for every mutation.
- Relative timestamps (`timeAgo`) with full `fmtTs` on hover.

## Build outcome
```
cd c:/Users/moren/Desktop/E-CDN/colegio-de-naujan && npm run build
> vite build
✓ 689 modules transformed.
✓ built in 1.16s
Exit Code: 0
```
Build is **clean** — no Vite/JSX errors, no "React is not defined", no unresolved imports. The only output advisories are a pre-existing chunk-size warning (>500 kB, unrelated to this change) and a benign `vite-reporter` plugin stderr line; both are informational and do not affect the build result.

## Schema notes used (for correctness)
- `concern_submissions.target_deadline` is `DATE` → date input value passed through directly; `internal_notes`, `assigned_to`, `assigned_office`, `resolution_note`, `resolved_at` confirmed present.
- `consultation_questions` columns: `question_text`, `question_type`, `options TEXT[]`, `sort_order` → `addQuestion` payload uses these names (not `question`/`type`) to avoid runtime insert errors.
- `consultation_responses` columns: `consultation_id`, `question_id`, `answer`, `is_anonymous` → aggregation query selects `question_id, answer`.

## Known limitation (documented in-UI)
Question reorder/delete of existing questions is preview-only because the governance lib exposes no `updateQuestion`/`reorderQuestion`/`deleteQuestion` function. New questions are persisted via `addQuestion`. A UI hint states this. Adding those lib functions is out of scope for this single-file rewrite.
