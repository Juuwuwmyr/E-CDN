# Admin GovernancePage rewrite into a three-tab institutional portal

The admin `GovernancePage` is rebuilt from scratch into a Documents / Concerns / Consultations portal that loads three stat summaries into a `db-stats-row` of `db-stat-card`s and switches between three sub-tab components. Documents gets a CMS publishing workflow with status pipeline pills, bulk publish/archive, and drag-drop upload that reuses the existing `uploadGovernanceFile` untouched. Concerns gets a helpdesk inbox with priority-colored left borders, a slide-in detail panel carrying a 7-step status timeline, quick-action status bar, assignment form, and admin/submitter notes. Consultations gets survey management with a five-type question builder, publish/close toggles, and a response-aggregation view that falls back to a count-only view when the inline Supabase tally query fails. The hard constraints all hold: named React-hook imports only (no `import React`, no `React.` anywhere), a single default `GovernancePage({ user })` export, `logActivity` on all 12 mutation sites, and `uploadGovernanceFile` preserved at both create and edit. Build is clean per the implementer's recorded evidence (exit 0, 689 modules, 1.16s) and was not re-run.

**Watch for:** bulk publish/archive short-circuits on the first failure and leaves the selection checked and the list unrefreshed even though some items may have already mutated. The consultation publish/close toggle has no in-flight guard, so a double-click can fire duplicate `updateConsultation` calls. Overdue concerns are flagged with a red pill but not the red left border the design requirements call for (the border is reserved for priority color). The top-level dashboard stat fetch silently swallows errors.

**Verdict**: APPROVED

## High-level view

The page is a thin shell (`GovernancePage`) that fetches the three cross-tab stat summaries into header cards and delegates the real work to one of three self-contained tab components, each owning its own data load, toast, and mutation handlers. Sub-tab state lives only in the shell; each tab re-fetches its own data on mount, so switching tabs always shows fresh rows. The export contract is unchanged — single default `GovernancePage({ user })`, named hooks only.

Documents is a publishing pipeline: rows show a horizontal strip of draft→submitted→approved→published→archived pills filled up to the document's current stage, and the action button changes per status (Publish Now on drafts, Approve on submitted, Publish on approved, Archive on published). New/Edit modals share one drag-drop upload zone whose `uploadGovernanceFile` call is left byte-for-byte as the prior logic, and the edit path preserves an existing `file_url` when no new file is picked. Bulk select drives a publish/archive bar, but its error handling is the weak spot.

Concerns is a ticketing inbox: each row carries a 4px left border in the submitter's priority color and a red Overdue pill when past `target_deadline` and unresolved. Clicking a row opens a right-anchored slide-in panel with the full description, submitter info (hidden when anonymous), the seven-step timeline as filled/empty circles, a quick-action status bar, an assignment form, and separate admin-only internal notes and submitter-visible resolution notes. The timeline reads the persisted `selected.status`, so it reflects saved truth rather than the pending quick-action selection — intentional, but worth knowing.

Consultations is survey management with three stat tiles, a create modal, a question builder that adds questions through the real `question_text` / `question_type` / `options` / `sort_order` schema columns, and a response view that aggregates answers via an inline `supabase.from('consultation_responses')` query with a graceful count-only fallback. Question reorder is preview-only and honestly labeled as such, because the governance lib exposes no update/reorder/delete question function. The publish/close status change is the one mutation path that skips the `saving` guard used everywhere else.

<details>
<summary>Issues (5)</summary>

1. **Bulk publish/archive partial failure** — `Promise.all` rejects on the first failure; `setSel(new Set())` and `load()` sit inside the `try` after the `await`, so a failed bulk op leaves checkboxes checked and the list unrefreshed even though some items already mutated. Use `Promise.allSettled` and clear/reload in `finally`.
2. **Consultation status toggle has no in-flight guard** — `handleStatusChange` sets no `saving` state and the Publish/Close buttons stay enabled during the request, so a double-click can fire duplicate `updateConsultation` calls before `load()` returns. Disable the button or track an in-flight id.
3. **Overdue uses a pill, not the red left border** — design requirements ask for a red left border on overdue rows, but the border is reserved for priority color; overdue is signaled only by a red pill. Decide whether to add an overdue red border or accept the pill-only approach.
4. **Resolution note is always rendered** — the spec says the resolution note textarea is shown when resolved, but it's unconditionally visible (labelled as submitter-visible). Either gate it on `status === 'resolved'` or accept the always-on behaviour.
5. **Top-level stat fetch swallows errors** — `GovernancePage`'s `Promise.all` for the four header stat cards has `.catch(() => {})`, so a failed stats call leaves the header cards silently showing 0 / `…` while the per-tab loads surface their own toasts, producing mismatched numbers between header and tab.

</details>

<details>
<summary>Details</summary>

### Sub-tab shell and the silent header stat load

`GovernancePage` mounts a single `Promise.all([getDocumentStats(), getConcernStats(), getParticipationStats()])` to populate four `db-stat-card` header tiles, then renders a segment switcher and the active tab. Each tab component owns its own `load()` and its own toast, so the header numbers and the tab numbers come from separate fetches. The header `Promise.all` is wrapped in `.catch(() => {})`, so if any stats call rejects the header tiles silently fall back to 0 / `…` with no toast, while the tab the user opens will show its own error toast on its independent fetch. The two can therefore disagree. Low impact for a summary strip, but worth a thought if the header is treated as authoritative.

### Documents publishing workflow and upload preservation

Rows are compact `sl-list-row`s: index, bulk checkbox, title with office/year subtitle, a blue category badge, the five-stage pipeline pills filled up to the current status, the published/created date with a full-timestamp hover title, a file-type chip, and a per-status action button (Publish Now, Approve, Publish, Archive) plus a download link and an edit pencil. `Publish Now` calls `publishDocument` directly, which sets `status:'published'` plus `approved_by`/`published_at`, skipping the intermediate stages — matching the plan's explicit decision that the lib supports a straight draft→published jump. The New and Edit modals share one drag-drop zone (`onDrop`/`onDragOver`/`onDragLeave`/`pickFile`/`clearFile` and the picked-file card with a progress bar) and call `uploadGovernanceFile(pickedFile, 'transparency', onProgress)` exactly as before; the edit path keeps the existing `file_url` when no new file is picked by seeding `form.file_url` from the document and only overwriting it when `pickedFile` is set. The Edit modal also exposes a Status dropdown beyond the spec's listed edit fields (title/category/body/office/year/re-upload), giving admins manual status control.

The bulk path is the concern. `bulkPublish` and `bulkArchive` do `Promise.all([...sel].map(...))` and then place `setSel(new Set())` and `load()` inside the `try` block *after* the `await`. When any single publish/archive rejects, control jumps to the `catch`, so the selection is never cleared and the list is never refreshed — yet the other in-flight publishes/archives still complete. The result is stale checkboxes over a partially-mutated list. `Promise.allSettled` plus a `finally` that always clears and reloads would fix it.

### Concerns helpdesk inbox and 7-step timeline

The toolbar carries search (subject or `reference_no`), status/priority/category selects, a from/to date range, and a sort select (newest/priority/status), all filtered and sorted client-side against the full `getAllConcerns({})` list. Rows get a 4px left border in the priority color (urgent `#C8102E`, high `#C8960C`, normal `#002280`, low `#10813f`), a priority badge, a status badge, a relative `timeAgo` timestamp with a full-date hover title, and a red Overdue pill when `isOverdue(c)` is true. `isOverdue` compares `target_deadline` against midnight today and excludes resolved/closed/rejected.

The slide-in detail panel (right-anchored, maxWidth 680, full-height scrollable body) shows the description, submitter info only when `!is_anonymous` (an explicit "Submitted anonymously" notice otherwise), and the seven-step timeline `submitted → received → assigned → under_review → action_in_progress → resolved → closed` as filled colored circles up to and including the current status and muted outlined circles after, plus a separate Rejected marker when applicable. The quick-action bar has seven small icon+text pills (Mark Received, Assign, Under Review, In Progress, Resolve, Close, Reject); Assign also scrolls the assignment form into view. The assignment form (office/person/date), admin-only internal notes, and the submitter-visible resolution note are all seeded from the selected concern, and Save calls `updateConcernStatus(selected.id, editForm)` with exactly the fields the lib accepts.

Two divergences from the spec sit here. The design requirements ask for a red left border on overdue rows, but the border is committed to priority color, so overdue is signalled only by the pill — a defensible reconciliation of two conflicting spec lines, but the red border isn't present. And the resolution note textarea is rendered unconditionally rather than only when resolved; the label clarifies submitter visibility, and pre-filling it before resolving is reasonable, but it's not the conditional rendering the spec describes. The timeline also reads the persisted `selected.status` rather than the pending `editForm.status`, so clicking a quick-action pill updates the button highlight and the pending save but not the timeline circles until Save lands — by design, since the timeline is meant to show saved truth.

### Consultations question builder and response aggregation

Three stat tiles (Total/Active/Responses) come from `getParticipationStats`; per-consultation response counts are fetched in parallel into a `counts` map on load, each wrapped in its own `.catch` so one failure doesn't break the others. Rows show the date range, a type badge, a status badge, the response count, and Manage Questions / Publish (draft) / Close (published) / View Responses actions.

The question builder lists existing questions via `getConsultationWithQuestions` and adds new ones with the real schema columns `question_text` / `question_type` / `options` / `sort_order` — not the generic `question`/`type` names the plan hedged on — so inserts should match the table. Up/down reorder buttons mutate a local copy and rewrite `sort_order` indices, but persisting a new order isn't possible without a lib function the module doesn't expose; the UI says so plainly. The response view fetches the question list and count, then runs an inline `supabase.from('consultation_responses').select('question_id,answer')` to tally per question, rendering each answer with a count and a percentage bar; if that query throws it degrades to the count plus the question list with a toast.

`handleStatusChange` is the one mutation that skips the `saving` guard the other paths use — it sets no in-flight state and the Publish/Close buttons aren't disabled during the request, so a fast double-click fires two `updateConsultation` calls before `load()` returns. The end state is idempotent-ish (same status written twice), but it's an inconsistency with the rest of the tab and a wasted write.

</details>

<details>
<summary>File map</summary>

- `src/components/Dashboard/tabs/GovernancePage.jsx` — full from-scratch rewrite: `GovernancePage` shell (header stat cards + segment switcher) plus `TransparencyTab`, `AccountabilityTab`, `ParticipationTab`. Named React-hook imports only, single default export, `logActivity` on 12 mutation sites, `uploadGovernanceFile` preserved at create and edit.

Full diff: `git diff -- src/components/Dashboard/tabs/GovernancePage.jsx` (working tree, uncommitted).

</details>
