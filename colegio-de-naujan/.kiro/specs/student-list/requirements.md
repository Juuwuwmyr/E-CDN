# Requirements Document

## Introduction

The Student List feature adds an admin-only "Students" tab to the CDN E-Portal Dashboard. It lets administrators view all enrolled students in a filterable card/table layout, search by name or student number, and bulk-import student records from an Excel or CSV file directly into the Supabase `students` table. The feature integrates with the existing tab-routing system, sidebar navigation, and Supabase data layer already in place.

## Glossary

- **Dashboard**: The CDN E-Portal admin/student dashboard located at `/dashboard`.
- **StudentList_Page**: The new admin-only page added as the "Students" tab in the Dashboard.
- **Import_Parser**: The client-side module that reads an uploaded Excel (.xlsx) or CSV (.csv) file and converts rows into student records.
- **Students_Table**: The existing Supabase table named `students`, with columns `student_number`, `first_name`, `last_name`, `course`, `year_level`, `section`, `enrollment_status`, and optionally `image_url`.
- **Student_Card**: A UI element that displays one student's avatar/photo, full name, student number, department label, and year level.
- **Department**: A grouping derived from the `course` column — BSIS, BTVTED-WFT, BTVTED-CHS, or BPA.
- **Admin**: A portal user whose `role` is `'Admin'`.
- **Avatar_Fallback**: A colored circle showing the student's initials, displayed when no `image_url` is available.
- **Upsert**: An insert-or-update operation that creates a record if the `student_number` does not exist, or updates it if it does.

---

## Requirements

### Requirement 1: Student List Navigation Tab

**User Story:** As an Admin, I want a "Students" tab in the dashboard sidebar, so that I can access the student list without leaving the dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL render a "Students" navigation item inside the "Admin" nav group in `NAV_GROUPS`, positioned after the existing "Systems" item.
2. THE Dashboard SHALL render a "Students" item in `NAV_ITEMS` (mobile bottom-nav) with `role: 'Admin'`, positioned after the existing "Systems" item.
3. WHEN a non-Admin user is authenticated, THE Dashboard SHALL NOT display the "Students" navigation item.
4. WHEN the "Students" navigation item is selected, THE Dashboard SHALL navigate to `?tab=students` and render the StudentList_Page.
5. THE Dashboard SHALL guard the `students` tab so that WHEN a non-Admin user navigates to `?tab=students` directly, THE Dashboard SHALL redirect the user to the `overview` tab.

---

### Requirement 2: Student List Display

**User Story:** As an Admin, I want to see all enrolled students displayed as cards, so that I can quickly scan the student roster.

#### Acceptance Criteria

1. WHEN the StudentList_Page mounts, THE StudentList_Page SHALL fetch all records from the Students_Table ordered by `last_name` ascending.
2. WHILE the StudentList_Page is loading data, THE StudentList_Page SHALL display a loading indicator in place of the student grid.
3. WHEN data has loaded and students exist, THE StudentList_Page SHALL render one Student_Card per student in a responsive grid layout.
4. THE Student_Card SHALL display the student's full name (first_name + last_name), student number, Department label, and year level label (e.g., "1st Year").
5. WHEN a student record has a non-empty `image_url`, THE Student_Card SHALL display that image as the student's profile photo.
6. WHEN a student record has no `image_url` or the image fails to load, THE Student_Card SHALL display an Avatar_Fallback using the student's initials and a deterministic background color derived from the student number.
7. WHEN the Students_Table contains no records, THE StudentList_Page SHALL display an empty-state message indicating no students are found.
8. IF an error occurs while fetching student records, THEN THE StudentList_Page SHALL display an inline error message and a "Retry" button.

---

### Requirement 3: Search and Filter

**User Story:** As an Admin, I want to search and filter the student list, so that I can quickly find specific students or groups.

#### Acceptance Criteria

1. THE StudentList_Page SHALL provide a text search input that filters Student_Cards by matching the entered query against `first_name`, `last_name`, or `student_number` (case-insensitive).
2. THE StudentList_Page SHALL provide a department filter dropdown with options: All Departments, BSIS, BTVTED-WFT, BTVTED-CHS, BPA.
3. THE StudentList_Page SHALL provide a year level filter dropdown with options: All Years, 1st Year, 2nd Year, 3rd Year, 4th Year.
4. WHEN a search query is entered, THE StudentList_Page SHALL update the displayed Student_Cards to show only matching students within 300 ms of the last keystroke.
5. WHEN a department filter is selected, THE StudentList_Page SHALL display only Student_Cards whose Department matches the selected value.
6. WHEN a year level filter is selected, THE StudentList_Page SHALL display only Student_Cards whose year level matches the selected value.
7. WHEN multiple filters and a search query are active simultaneously, THE StudentList_Page SHALL apply all conditions with AND logic so only students satisfying all active criteria are shown.
8. WHEN filters or a search query are active and produce no results, THE StudentList_Page SHALL display a "No students match your filters" message and a "Clear Filters" button.
9. WHEN the "Clear Filters" button is activated, THE StudentList_Page SHALL reset all filters and the search query to their default (unfiltered) state.
10. THE StudentList_Page SHALL display the count of currently visible students (e.g., "Showing 42 students").

---

### Requirement 4: Bulk Import from Excel/CSV

**User Story:** As an Admin, I want to import students in bulk from an Excel or CSV file, so that I can populate the student roster without manual data entry.

#### Acceptance Criteria

1. THE StudentList_Page SHALL provide an "Import Students" button visible to Admin users.
2. WHEN the "Import Students" button is activated, THE StudentList_Page SHALL open a file picker restricted to `.xlsx` and `.csv` file types.
3. WHEN a valid `.xlsx` or `.csv` file is selected, THE Import_Parser SHALL parse the file and extract rows using the following required columns: `student_number`, `first_name`, `last_name`, `course`, `year_level`; and the following optional columns: `section`, `image_url`.
4. WHEN the selected file is missing one or more required columns, THE Import_Parser SHALL display a descriptive error message listing the missing column names and SHALL NOT attempt to upsert any records.
5. WHEN the selected file contains rows with an empty `student_number`, `first_name`, or `last_name`, THE Import_Parser SHALL skip those rows and include their row numbers in a post-import warning summary.
6. WHEN parsing is complete and valid rows exist, THE StudentList_Page SHALL display a confirmation preview showing the count of records to be imported and a summary of the first five rows before committing.
7. WHEN the Admin confirms the import, THE StudentList_Page SHALL upsert all valid parsed rows into the Students_Table using `student_number` as the conflict key, updating existing records and inserting new ones.
8. WHEN the upsert operation completes successfully, THE StudentList_Page SHALL display a success notification showing the total number of records imported or updated, and SHALL refresh the student list.
9. IF the upsert operation returns an error from Supabase, THEN THE StudentList_Page SHALL display an error notification with the error detail and SHALL leave the student list unchanged.
10. WHILE an import operation is in progress, THE StudentList_Page SHALL disable the "Import Students" button and display a progress indicator.

---

### Requirement 5: Student Count Summary

**User Story:** As an Admin, I want to see department and total enrollment counts at the top of the Students page, so that I can get a quick overview of the student population.

#### Acceptance Criteria

1. THE StudentList_Page SHALL display summary stat cards at the top showing: Total Students, and a per-department count for each of the four departments (BSIS, BTVTED-WFT, BTVTED-CHS, BPA).
2. WHEN the Students_Table data is refreshed (after import or page load), THE StudentList_Page SHALL recalculate and update the summary stat card values.
3. WHILE the StudentList_Page is loading data, THE StudentList_Page SHALL display placeholder values in the stat cards.

---

### Requirement 6: Import File Format Specification

**User Story:** As an Admin, I want clear guidance on the required import file format, so that I can prepare a valid file for bulk import.

#### Acceptance Criteria

1. THE StudentList_Page SHALL display a "Download Template" link that provides a downloadable CSV template file with the required and optional column headers pre-filled.
2. THE Import_Parser SHALL accept column headers in a case-insensitive manner (e.g., `Student_Number` and `student_number` are both valid).
3. THE Import_Parser SHALL trim leading and trailing whitespace from all parsed cell values before processing.
4. FOR ALL valid CSV files that are exported and re-imported without modification, THE Import_Parser SHALL produce an equivalent set of records (round-trip property).
