-- ============================================================
--  CDN E-Portal — Announcements Migration (FIXED / CLEAN)
--  Paste this ENTIRE block into Supabase SQL Editor and run it.
--  It safely drops any partial table and recreates everything.
-- ============================================================

-- Step 1: Drop existing partial table (if any) and its policies
DROP TABLE IF EXISTS public.announcements CASCADE;

-- Step 2: Create the announcements table with ALL columns
CREATE TABLE public.announcements (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text        NOT NULL,
  body                text        NOT NULL,
  type                text        NOT NULL DEFAULT ''info''
                      CHECK (type IN (''info'', ''warning'', ''urgent'', ''event'')),
  created_by          text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  is_active           boolean     NOT NULL DEFAULT true,
  target_courses      text[]      DEFAULT NULL,
  target_year_levels  text[]      DEFAULT NULL
);

-- Step 3: Performance index
CREATE INDEX idx_announcements_active
  ON public.announcements (is_active, created_at DESC);

-- Step 4: Enable Row Level Security
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Step 5a: Everyone (including anon) can READ active announcements
CREATE POLICY "Public read active announcements"
  ON public.announcements
  FOR SELECT
  USING (is_active = true);

-- Step 5b: Anon key can INSERT / UPDATE / DELETE (admin compose form)
CREATE POLICY "Anon full access announcements"
  ON public.announcements
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Step 6: Verify — you should see all columns listed below
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = ''public'' AND table_name = ''announcements''
ORDER BY ordinal_position;
