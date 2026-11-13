# Archive page replacement across Announcements, Accounts, and SystemApps

Three pages (AnnouncementsPage, AccountsPage, SystemAppsManager) were updated so that clicking the Archive header button replaces the entire main content area with a dedicated archive view rather than simply filtering the existing list. Each archive view has its own section header, a row count, a full-width table (or list), per-row Restore and Permanently Delete actions, and an empty state. Normal view is restored via a Back button in the header.

**Watch for:** (confirmed) AnnouncementsPage archives every inactive announcement regardless of whether it was manually hidden or truly archived — there is no separate archived flag, so the archive view is semantically a "hidden items" view. (confirmed) AccountsPage's header Archive button shares `userListFilter` state with the left-pane Active/Archived pill filter, creating two code paths into archive mode that produce different UIs. (confirmed) SystemAppsManager's Status dropdown still includes "Archived" as an option, giving users a second, non-obvious entry point into the archive view.

**Verdict**: APPROVED

---

## High-level view

Each file wraps its main content in a conditional — `statusFilter === 'archived'` (Announcements, SystemApps) or `userListFilter === 'archived'` (Accounts) — that branches to a dedicated archive sub-component, correctly bypassing the stats bar and split-pane/table. The Back button toggles the same state variable back. Toast notifications fire from parent-level `showToast` on every mutation. `window.confirm` gates all permanent deletes. All three files use only named imports.

For Announcements, the archived criterion is `!a.is_active`. Both the Hide action in the detail pane and the Archive action set `is_active = false` with no additional marker, so the archive view shows all inactive announcements — not just those explicitly archived. SystemApps avoids this by writing `badge = 'Archived'` as a distinct marker, keeping inactive-but-not-archived apps out of the archive view. Accounts follows the same pattern as Announcements.

AccountsPage has two independent controls for the same `userListFilter` state: the page-level Archive button and the Active/Archived pill filter inside the left pane. When set from the header, the split-pane is replaced entirely; when set from the pill, only the left list filters and the right pane stays. Same state value, different resulting UIs.

SystemAppsManager's Status dropdown contains an "Archived" option that sets `statusFilter = 'archived'`, which is the same value the archive header button sets. A user selecting it from the dropdown enters the archive view without touching the Archive button, then must use the Archive button's "← Back" label to exit — a confusing mismatch.

<details>
<summary>Issues (3)</summary>

1. **Announcements: archive and hide are indistinguishable** — `AnnouncementsArchivePage` filters on `!a.is_active`, which captures items toggled hidden via the Hide button as well as items archived from the detail pane. Add a separate `is_archived` boolean column, or remove the Archive action from the detail pane and treat Hide as the only archival mechanism, to prevent user confusion about what is in the archive.

2. **AccountsPage: dual entry points produce different UIs for the same state** — `userListFilter === 'archived'` can be reached from both the page header button (replaces the split-pane entirely with `AccountsArchivePage`) and the Active/Archived pill inside the left pane (filters the left list but leaves the right pane visible). Remove the "Archived" option from the left-pane pill filter, or separate the two into independent state variables so each path always produces the intended UI.

3. **SystemAppsManager: Status dropdown is a hidden second entry point** — The toolbar's Status dropdown includes "Archived" and writes `statusFilter = 'archived'`, triggering the archive view. The dropdown is then invisible in archive mode and the only exit is the Archive button's "← Back" label. Remove "Archived" from the Status dropdown and rely solely on the Archive header button for this transition.

</details>

<details>
<summary>Details</summary>

### Full content replacement confirmed in all three files

**AnnouncementsPage:**
```jsx
{statusFilter === 'archived' ? (
  <AnnouncementsArchivePage ... />
) : (
  <>  {/* stats bar + split-pane */}  </>
)}
```

**AccountsPage:**
```jsx
{userListFilter === 'archived' ? (
  <AccountsArchivePage ... />
) : (
  <>  {/* stats cards + split-pane */}  </>
)}
```

**SystemAppsManager:**
```jsx
{statusFilter === 'archived' ? (
  <SystemAppsArchiveView ... />
) : (
  <>  {/* toolbar + table */}  </>
)}
```

All confirmed: stats bar, split-pane, toolbar, and main table are inside the `else` branch and are hidden when archive mode is active.

### Archived item detection logic

| File | Archive criterion | Mechanism |
|------|-------------------|-----------|
| Announcements | `!a.is_active` | `is_active = false` — shared by Hide and Archive actions |
| Accounts | `u.is_active === false` | `is_active = false` — set only by Archive action |
| SystemApps | `a.badge === 'Archived'` | Distinct badge value written alongside `is_active = false` |

SystemApps is the most precise because the badge acts as a dedicated marker. Announcements and Accounts both conflate "inactive" with "archived"; inactive items that were never explicitly archived will appear in the archive view.

### Restore and Delete handlers

In `AnnouncementsArchivePage`, restore passes `ann.id` to `onRestore` while delete passes the full `ann` object to `onDelete`. The parent handlers match these signatures — `handleArchiveRestore(id)` and `handleArchiveDelete(ann)`. AccountsPage and SystemApps follow the same pattern. `window.confirm` is called before every permanent delete across all three files.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|------|-------------|
| `src/components/Dashboard/tabs/AnnouncementsPage.jsx` | Archive header button; `statusFilter === 'archived'` branch replacing stats+split-pane; `AnnouncementsArchivePage` sub-component; archive/restore handlers |
| `src/components/Dashboard/tabs/AccountsPage.jsx` | Archive header button; `userListFilter === 'archived'` branch replacing stats+split-pane; `AccountsArchivePage` sub-component; archive/restore handlers |
| `src/components/Dashboard/SystemAppsManager.jsx` | Archive header button; `statusFilter === 'archived'` branch replacing toolbar+table; `SystemAppsArchiveView` sub-component; `handleArchive`/`handleRestore` handlers |

Full diff: `git diff main -- src/components/Dashboard/tabs/AnnouncementsPage.jsx src/components/Dashboard/tabs/AccountsPage.jsx src/components/Dashboard/SystemAppsManager.jsx`

</details>
