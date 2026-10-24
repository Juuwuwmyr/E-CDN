# Admin defects + redesign + landing page plan

## Context
React (Vite) + Supabase app in `colegio-de-naujan`. Admin dashboard routed via `Dashboard`/`StudentDashboard`; landing is `HomePage` + `Hero`.

## Defect fixes (admin)
1. `OverviewPage.jsx:77` — quote `Accessed` string in `logActivity('system_access', 'Accessed', ...)`.
2. `OverviewPage.jsx:73-78` — await/try-catch `recordSystemVisit` and `logActivity`.
3. `Dashboard.jsx:65` — case-insensitive role check (`user?.role?.toLowerCase() !== 'admin'`).
4. `SystemsPage.jsx:99` — render system label instead of raw `topSystem?.id`.
5. `AccountsPage.jsx:313` — add edit/toggle/delete for student rows; guard handlers on `u.id ?? u.student_number`.
6. Remove or wire `AdminPanel.jsx` (dead code) — delete or integrate.

## Redesign (admin)
- Modern clean: whitespace, rounded cards, consistent spacing, responsive grid.
- Targets: `DashboardShell`, `OverviewPage`, `AccountsPage`, `StudentsPage`, `SystemsPage`, `ActivityPage`, `AdminPanel`.
- Keep data flow unchanged; only presentation.

## Landing page redesign
- Hero with CTA, features section, login access.
- Targets: `HomePage.jsx`, `Hero.jsx`, `Header.jsx`, `Footer.jsx`.
- Modern clean styling; reuse existing variables.css.

## Validation
- `npm run lint` (oxlint) in `colegio-de-naujan`.
- `npm run build` (vite build).
- Manual smoke: admin login, tabs load, system click opens, accounts actions work.

## Risks
- Role case change may affect existing sessions; ensure DB roles normalized.
- Removing AdminPanel if referenced elsewhere (verified not imported).
