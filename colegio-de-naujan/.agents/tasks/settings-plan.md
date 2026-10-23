# Implementation Plan: Settings Page with System Logs

## Overview
Add a Settings page accessible from the profile dropdown menu, featuring four tabs (Account, Security, Notifications, System Logs) and a comprehensive activity logging system to track user actions across the portal.

---

## Design Decisions

### 1. **Activity Logger Module (localStorage-based)**
**Rationale**: The system needs persistent, queryable activity logs without backend dependency. localStorage provides immediate availability for CSV exports and filtering. A 500-entry cap with FIFO eviction prevents unbounded growth. Sample logs on first load provide realistic demo data for testing the UI.

### 2. **Settings as a Tab (not a separate route)**
**Rationale**: Consistent with OverviewPage, ActivityPage, and SystemsPage which are all tab-based. This integrates naturally with the existing `TAB_PAGES` map in Dashboard.jsx and reuses the onTabChange routing mechanism. The user's request ("hide in mobile") implies desktop-only visibility through CSS, not route structure.

### 3. **Settings accessible only from profile dropdown**
**Rationale**: The user explicitly said "don't add any new nav items; settings is accessed only from the profile dropdown." This keeps the navigation clean and makes Settings a secondary utility, not a primary feature tab. DashboardShell's dropdown buttons must emit callbacks to trigger tab changes.

### 4. **Settings page uses HeroBanner like HistoryPage**
**Rationale**: HistoryPage demonstrates this pattern already — it wraps content in DashboardShell and displays HeroBanner at the top. Consistency across all page types.

### 5. **Four independent tabs within SettingsPage**
**Rationale**: Account and Security are user-facing; Notifications contains toggles (UI only, no persistence); System Logs are admin-focused. Each is a distinct logical section with different layouts and interactions.

### 6. **System Logs tab includes filtering, CSV export, pagination**
**Rationale**: Logs become unusable without these. Date range, action, status, and text search enable targeted investigation. CSV export supports compliance/audit workflows. Pagination keeps the DOM performant.

---

## Implementation Steps

### Step 1: Create Activity Logger Module
**What**: Build the localStorage-based logging system with CRUD, filtering, and CSV support. Initialize with 60+ realistic sample logs on first load (login, logout, profile_update, settings_change, file_download, system_access, password_change, export_data actions across 7-day window with success/warning/failed statuses).

**Files**:
- `src/lib/activityLogger.js` (new)

**Verify**: 
```bash
# No build-step verification needed (plain JS utility).
# Manually verify in browser DevTools: open Console and run:
#   const { getActivityLogs } = await import('./src/lib/activityLogger.js');
#   console.log(getActivityLogs().slice(0, 5));
# Should return array of log objects with id, timestamp, action, details, userId, ipAddress, status.
```

---

### Step 2: Modify DashboardShell to Support Dropdown Tab Navigation
**What**: Add `onDropdownItem` prop to DashboardShell. When a dropdown item is clicked, call this callback with the item's label, allowing Dashboard.jsx to route to Settings via onTabChange.

**Files**:
- `src/components/Dashboard/DashboardShell.jsx` (modify profile dropdown button onClick)

**Verify**: 
```bash
# After completing Steps 3-5, manually click profile dropdown "Settings" button.
# Should navigate to ?tab=settings (verified in Step 5).
```

---

### Step 3: Add Settings to Constants
**What**: Add a `tab: 'settings'` property to the Settings item in DROPDOWN_ITEMS array so Dashboard.jsx can route to it. This property is used by Dashboard.jsx to call onTabChange('settings').

**Files**:
- `src/components/Dashboard/constants.jsx` (modify DROPDOWN_ITEMS)

**Verify**: 
```bash
# Inspect the DROPDOWN_ITEMS export; confirm Settings object has tab: 'settings'.
```

---

### Step 4: Update Dashboard.jsx to Wire Settings Navigation
**What**: 
- Import SettingsPage and add to TAB_PAGES
- Pass onDropdownItem prop to DashboardShell that routes 'Settings' to the settings tab
- Handle the 'Settings' dropdown label and call onTabChange('settings')

**Files**:
- `src/components/Dashboard/Dashboard.jsx` (modify)

**Verify**: 
```bash
# After completing step, manually click profile dropdown "Settings" button.
# URL should change to ?tab=settings and SettingsPage should render.
```

---

### Step 5: Create SettingsPage Component
**What**: Build the Settings page with four tabs (Account, Security, Notifications, System Logs). Each tab is a separate section. Use HeroBanner exactly as HistoryPage does. Import and call activityLogger functions for logging user actions.

**Account Tab**:
- Read-only profile display: name, role, email, student number (from user prop)
- Info card layout matching the eGovPH style

**Security Tab**:
- Change password form: current password, new password, confirm password (form only, no API call, show success toast on submit)
- 2FA section: placeholder toggle, no functionality

**Notifications Tab**:
- Three toggles: email notifications, system alerts, activity summaries
- No persistence; UI-only for now

**System Logs Tab**:
- Import getActivityLogs, getLogStats from activityLogger.js
- Stat cards at top: Total Logs, Today count, Failed Actions count
- Filter bar: date range (from/to), action type dropdown, status dropdown, text search
- Log table: columns for Timestamp, User, Action, IP, Status
- Status badge color-coding: success=green #dcfce7, warning=amber #fef9c3, failed=red #fee2e2
- Export CSV button: builds CSV from filtered logs, triggers download
- Pagination: 20 rows per page
- Call logActivity() when user submits Account or Security forms

**Files**:
- `src/components/Dashboard/SettingsPage.jsx` (new)

**Verify**: 
```bash
npm run build
# Should compile without errors.
# Manually navigate to ?tab=settings.
# All four tabs should render without JS errors.
# Stat cards should show counts from sample logs.
# Table should display 20 rows per page.
# Click Export CSV button; file should download as CDN_ActivityLogs_YYYYMMDD_HHMMSS.csv
# Filter bar inputs should filter the table in real-time.
```

---

### Step 6: Add CSS Styles for Settings & Logs
**What**: Append comprehensive CSS to dashboard.css for Settings page styling. Include:
- Tab switcher: `.db-settings-tabs`, `.db-settings-tab`, `.db-settings-tab--active`
- Form sections: `.db-settings-section`, `.db-settings-section-title`
- Form fields: `.db-settings-field`, `.db-settings-label`, `.db-settings-value`, `.db-settings-input`
- Buttons: `.db-settings-btn`, `.db-settings-toggle`
- Log table: `.db-log-table`, `.db-log-th`, `.db-log-td`
- Status badges: `.db-log-badge`, `.db-log-badge--success`, `.db-log-badge--warning`, `.db-log-badge--failed`
- Filter bar: `.db-log-filters`, `.db-log-filter-group`
- Stat cards: `.db-log-stats`, `.db-log-stat-card`, `.db-log-stat-num`, `.db-log-stat-label`
- Responsive: stack table columns at 680px, stack filter bar at 900px

**Files**:
- `src/styles/dashboard.css` (append)

**Verify**: 
```bash
npm run build
# Should compile without errors.
# Manually navigate to ?tab=settings and inspect styles.
# Tab switcher should have no border-bottom gap between tabs.
# Stat cards should render in a 3-column grid.
# Log table should be responsive and align properly on desktop.
# Status badges should display correct background and text colors.
```

---

## Files Summary

### New Files
1. **src/lib/activityLogger.js** — Activity logging utility with localStorage backend
2. **src/components/Dashboard/SettingsPage.jsx** — Settings page with 4 tabs

### Modified Files
3. **src/components/Dashboard/DashboardShell.jsx** — Add onDropdownItem prop and callback routing
4. **src/components/Dashboard/constants.jsx** — Add tab property to Settings in DROPDOWN_ITEMS
5. **src/components/Dashboard/Dashboard.jsx** — Import SettingsPage, add to TAB_PAGES, wire dropdown navigation
6. **src/styles/dashboard.css** — Append Settings and log table styles

---

## Verification Checklist

- [ ] `npm run build` succeeds
- [ ] Manual: Click profile dropdown → click "Settings" → URL becomes `?tab=settings`
- [ ] Manual: Settings page renders with HeroBanner at top
- [ ] Manual: All four tabs (Account, Security, Notifications, System Logs) are clickable
- [ ] Manual: Account tab shows read-only profile info from user prop
- [ ] Manual: Security tab displays change password form and 2FA toggle (no actual submission)
- [ ] Manual: Notifications tab shows three toggles
- [ ] Manual: System Logs tab shows stat cards with correct counts from sample logs
- [ ] Manual: Log table displays 20 rows per page with pagination
- [ ] Manual: Filter inputs (date range, action, status, search) filter the table in real-time
- [ ] Manual: Export CSV button downloads a file named `CDN_ActivityLogs_YYYYMMDD_HHMMSS.csv`
- [ ] Manual: CSV file contains correct headers and filtered data
- [ ] Manual: Account or Security form submission calls logActivity() and logs are persisted
- [ ] Manual: Desktop layout is responsive and matches eGovPH design
- [ ] Manual: Mobile view respects Settings should not display (CSS media query or nav item hidden)

---

## Notes

- **No Backend API**: All logs are stored in localStorage. This is intentional per the task constraints (form only, no actual API calls).
- **Sample Data**: 60+ realistic logs seeded on first load provide demo data for testing pagination, filtering, and CSV export.
- **User Prop**: SettingsPage receives the user object from Dashboard, providing name, role, email, studentNumber for display.
- **CSS Color Scheme**: Navy #002280, periwinkle #EEF2FF, slate #64748B match existing eGovPH design.
- **Toast**: Success toasts on form submission should use existing toast library if available, or a simple alert() for MVP.
