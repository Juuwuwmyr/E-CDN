-- ============================================================
--  CDN E-Portal — Announcements Audience Targeting Migration
--  Run this in Supabase SQL Editor AFTER the first migration.
-- ============================================================

-- Add audience targeting columns to the announcements table
-- target_courses    = NULL means "ALL courses"
--                    array of course codes, e.g. '{"BSIS","BPA"}'
-- target_year_levels = NULL means "ALL year levels"
--                    array of integers as text, e.g. '{"1","2"}'

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS target_courses     text[]  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS target_year_levels text[]  DEFAULT NULL;

-- Update existing rows to target ALL (NULL = everyone)
UPDATE public.announcements
  SET target_courses = NULL, target_year_levels = NULL
  WHERE target_courses IS NULL AND target_year_levels IS NULL;

-- Verify
SELECT id, title, target_courses, target_year_levels
FROM public.announcements
ORDER BY created_at DESC
LIMIT 5;
