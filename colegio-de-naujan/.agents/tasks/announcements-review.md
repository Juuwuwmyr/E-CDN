# Professional institutional announcements management system

The `AnnouncementsPage` is fully rewritten into a split-pane workspace: a 340 px inbox-style list on the left with search, type, and status filters, and a right pane that cycles through empty state → detail view → compose/edit form. A four-card stats bar sits above. The module is a single default export, uses only named React hook imports (no `import React`), pulls all lib helpers from `../../../lib/announcements`, adds an inline `updateAnnouncement` using `{ supabase }` from `../../../lib/supabase`, and ships no external library dependencies. Build is clean: exit 0, 689 modules, 1.56 s, one pre-existing chunk-size advisory only.

**Watch for:** The inline validation message fires only when at least one field has been touched — a user who opens the form and immediately hits Submit gets only the toast, not the in-form cue (confirmed). `publish_at` is intentionally omitted per the plan (no DB column, no backend scheduler). The `urgent` SVG icon is a reused info circle, not a distinct glyph.

**Verdict**: APPROVED

## High-level view

The split-pane layout and all three right-pane modes (empty, detail, compose/edit) are present and correctly gated. `paneMode` derives purely from `composeOpen` and `selected`, so there is no ambiguous state where both panes compete.

The edit path uses `supabase.from('announcements').update(…).eq('id', id)` — not `createAnnouncement` — as required. The payload sends `null` for empty `target_courses`/`target_year_levels` arrays, matching the create convention.

The stats bar counts derive from the full `announcements` array before filtering, so the four header cards always reflect true totals regardless of active filters.

The mobile layer is JS-driven via `matchMedia`. All paths that open detail or compose set `mobileShowDetail: true`; `handleCancel` restores it to `!!selectedId`, so canceling a new draft on mobile returns to the list correctly.

<details>
<summary>Issues (2)</summary>

1. **Validation feedback absent on first Submit** — the inline message in `ComposePane` renders only when `!valid && (title || body)`. A user who opens a fresh form and immediately clicks "Post Announcement" sees only the toast error; the in-form cue never appears. Add a `submitted` boolean to `ComposePane` and gate the message on `!valid && (submitted || title || body)`.
2. **`urgent` and `info` share the same SVG icon** — both use the circle-with-exclamation glyph. A distinct icon (alert-octagon, siren) would make urgent announcements visually distinguishable in the list dots and type selector. Cosmetic, but inconsistent with the type color differentiation effort.

</details>

<details>
<summary>Details</summary>

### Validation message gap — confirmed

`ComposePane` renders the validation message on `!valid && (title || body)`. This means a completely untouched form shows no inline message even after Submit is clicked; the submit handler's `showToast('Title and message body are required.', 'error')` is the only feedback path. Adding a `submitted` state bit (set to `true` in `onSubmit` before the guard check, reset in `onCancel`) and changing the condition to `!valid && (submitted || title || body)` closes the gap without restructuring the form.

### Inline update path — confirmed correct

`updateAnnouncement(id, { title, body, type, target_courses, target_year_levels })` calls `supabase.from('announcements').update(updates).eq('id', id)` and throws on error. Empty course/year arrays are coerced to `null` via `const tCourses = targetCourses.length ? targetCourses : null` before the call, matching the `createAnnouncement` convention and the plan's explicit requirement. `id`, `created_by`, `created_at`, and `is_active` are excluded from the payload.

### Toggle state management — confirmed correct

`handleToggle` places the `setAnnouncements` flip *after* the `await` inside the `try` block. The state update only executes on success; a failure lands in `catch` where only the toast fires. No rollback is needed.

### Selected row remains visible across filter changes

`selected` is derived from the full `announcements` array, not `filtered`. Applying a filter that would hide the selected row still leaves the detail pane open and populated. This is the correct behavior for an email-inbox metaphor — the list updates but the open item stays readable.

</details>

<details>
<summary>File map</summary>

| File | Change |
|---|---|
| `src/components/Dashboard/tabs/AnnouncementsPage.jsx` | Full rewrite — split-pane institutional announcements manager (983 insertions, 334 deletions) |

Full diff: `git show d17ec6062a6f25de2956077ea5af601021e404dd`

</details>
