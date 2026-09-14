-- ============================================================
--  CDN E-Portal  —  Supabase Database Schema
--  Run this in your Supabase SQL Editor
-- ============================================================

-- ── 1. STUDENTS table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.students (
  id                BIGSERIAL PRIMARY KEY,
  student_number    TEXT        NOT NULL UNIQUE,
  last_name         TEXT        NOT NULL,
  first_name        TEXT        NOT NULL,
  middle_name       TEXT,
  full_name         TEXT GENERATED ALWAYS AS (
                      last_name || ', ' || first_name ||
                      CASE WHEN middle_name IS NOT NULL AND middle_name <> ''
                           THEN ' ' || LEFT(middle_name, 1) || '.'
                           ELSE '' END
                    ) STORED,
  course            TEXT        NOT NULL,
  year_level        INTEGER     NOT NULL CHECK (year_level BETWEEN 1 AND 5),
  section           TEXT,
  gender            TEXT,
  email             TEXT,
  contact_number    TEXT,
  address           TEXT,
  enrollment_status TEXT        NOT NULL DEFAULT 'enrolled'
                                CHECK (enrollment_status IN ('enrolled','irregular','graduated','dropped','loa')),
  academic_year     TEXT        NOT NULL DEFAULT '2026-2027',
  semester          TEXT        NOT NULL DEFAULT '1st' CHECK (semester IN ('1st','2nd','Summer')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. PORTAL USERS table (staff + admin accounts) ─────────
CREATE TABLE IF NOT EXISTS public.portal_users (
  id           BIGSERIAL PRIMARY KEY,
  username     TEXT        NOT NULL UNIQUE,
  password     TEXT        NOT NULL,  -- store hashed in production
  full_name    TEXT        NOT NULL,
  role         TEXT        NOT NULL DEFAULT 'staff'
                           CHECK (role IN ('admin','staff','faculty')),
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. PORTAL SESSIONS table ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.portal_sessions (
  id             BIGSERIAL PRIMARY KEY,
  user_type      TEXT        NOT NULL CHECK (user_type IN ('student','staff')),
  user_id        TEXT        NOT NULL,   -- student_number or portal_users.username
  full_name      TEXT,
  role           TEXT,
  login_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logout_at      TIMESTAMPTZ,
  ip_address     TEXT,
  user_agent     TEXT
);

-- ── 4. SYSTEM VISITS table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_visits (
  id           BIGSERIAL PRIMARY KEY,
  system_id    TEXT        NOT NULL,
  system_label TEXT        NOT NULL,
  user_id      TEXT,
  visited_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. INDEXES ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_students_student_number ON public.students(student_number);
CREATE INDEX IF NOT EXISTS idx_students_last_name      ON public.students(last_name);
CREATE INDEX IF NOT EXISTS idx_students_course         ON public.students(course);
CREATE INDEX IF NOT EXISTS idx_students_year_level     ON public.students(year_level);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_user_id ON public.portal_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_system_visits_system_id ON public.system_visits(system_id);
CREATE INDEX IF NOT EXISTS idx_system_visits_visited_at ON public.system_visits(visited_at);

-- ── 6. UPDATED_AT trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER portal_users_updated_at
  BEFORE UPDATE ON public.portal_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 7. ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE public.students      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_visits ENABLE ROW LEVEL SECURITY;

-- Allow anon read on students (for login validation via anon key)
CREATE POLICY "allow_anon_read_students"
  ON public.students FOR SELECT
  USING (true);

-- Allow anon read on portal_users (for login validation)
CREATE POLICY "allow_anon_read_portal_users"
  ON public.portal_users FOR SELECT
  USING (true);

-- Allow anon insert on portal_sessions (for login tracking)
CREATE POLICY "allow_anon_insert_sessions"
  ON public.portal_sessions FOR INSERT
  WITH CHECK (true);

-- Allow anon update on portal_sessions (for logout tracking)
CREATE POLICY "allow_anon_update_sessions"
  ON public.portal_sessions FOR UPDATE
  USING (true);

-- Allow anon insert on system_visits
CREATE POLICY "allow_anon_insert_visits"
  ON public.system_visits FOR INSERT
  WITH CHECK (true);

-- Allow anon read on system_visits
CREATE POLICY "allow_anon_read_visits"
  ON public.system_visits FOR SELECT
  USING (true);

-- ── 8. DEFAULT ADMIN/STAFF USERS ────────────────────────────
-- ⚠️  Change passwords before deploying to production!
INSERT INTO public.portal_users (username, password, full_name, role)
VALUES
  ('admin', 'bsis2026',  'Administrator', 'admin'),
  ('bsis',  'cdn2026',   'BSIS Student',  'staff')
ON CONFLICT (username) DO NOTHING;

-- ── 9. STUDENT ACCOUNTS (custom passwords set during registration) ──
CREATE TABLE IF NOT EXISTS public.student_accounts (
  id             BIGSERIAL PRIMARY KEY,
  student_number TEXT        NOT NULL UNIQUE REFERENCES public.students(student_number),
  password       TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_accounts_sn ON public.student_accounts(student_number);

ALTER TABLE public.student_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_anon_read_student_accounts"
  ON public.student_accounts FOR SELECT USING (true);

CREATE POLICY "allow_anon_insert_student_accounts"
  ON public.student_accounts FOR INSERT WITH CHECK (true);
