# CDN E-Portal — Supabase Setup Guide

## Step 1 — Create a Supabase Project
1. Go to https://supabase.com and sign in
2. Click **New Project**
3. Name it `cdn-eportal`, set a strong DB password, choose a region near you
4. Wait for it to provision (~1 min)

## Step 2 — Run the Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Paste the contents of `schema.sql` and click **Run**

## Step 3 — Seed the Students
1. In SQL Editor, open another **New Query**
2. Paste the contents of `seed_students.sql` and click **Run**
3. You should see a result table showing student counts per course/year

## Step 4 — Get your API Keys
1. Go to **Settings → API**
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`
3. Open `.env` in the project root and paste them:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

## Step 5 — Run the App
```bash
npm install
npm run dev
```

---

## How Login Works

| User Type | Username | Password |
|-----------|----------|----------|
| Admin/Staff | `admin` or `bsis` | their password in `portal_users` table |
| Student | Student Number (e.g. `2025-0617`) | Their **LAST NAME** in ALL CAPS (e.g. `ABELA`) |

Students are validated against the `students` table using their student number + last name.

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `students` | 245 enrolled students from the Excel enrollment data |
| `portal_users` | Admin and staff accounts |
| `portal_sessions` | Login/logout tracking per user |
| `system_visits` | Tracks every click on CSC, OSAS, Admissions |

---

## Student Count by Course
- **BPA**: Year 1–4
- **BSIS**: Year 2–4
- **BTVTED-WFT**: Year 2–4
- **BTVTED-CHS**: Year 2–4

Total: **245 students**
