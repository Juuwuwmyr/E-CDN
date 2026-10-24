-- ============================================================
--  CDN E-Portal — Announcements Feature Migration
--  Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Create the announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  body        text NOT NULL,
  type        text NOT NULL DEFAULT 'info'
              CHECK (type IN ('info', 'warning', 'urgent', 'event')),
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  is_active   boolean NOT NULL DEFAULT true
);

-- 2. Index for fast active-announcement queries (used by student portal)
CREATE INDEX IF NOT EXISTS idx_announcements_active
  ON public.announcements (is_active, created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 4a. Everyone can READ active announcements (students use custom auth, not Supabase Auth)
CREATE POLICY "Public read active announcements"
  ON public.announcements
  FOR SELECT
  USING (is_active = true);

-- 4b. Anon key can INSERT / UPDATE / DELETE (for admin compose form)
CREATE POLICY "Anon full access announcements"
  ON public.announcements
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Verify table columns
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'announcements'
ORDER BY ordinal_position;
