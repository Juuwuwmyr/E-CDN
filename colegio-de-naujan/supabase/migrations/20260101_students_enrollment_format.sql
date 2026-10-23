-- Migration: align students table with enrollment data format
-- Safe version: skips ALTER COLUMN TYPE (columns already correct types)
-- Run this in Supabase SQL editor

-- Add missing columns if they don't exist
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS sex          VARCHAR(1),
  ADD COLUMN IF NOT EXISTS remarks      TEXT,
  ADD COLUMN IF NOT EXISTS semester     VARCHAR(50) DEFAULT 'First Sem, AY 2026-2027',
  ADD COLUMN IF NOT EXISTS is_active    BOOLEAN DEFAULT TRUE;

-- Add section if missing
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS section VARCHAR(10);

-- Make sure student_number has a unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'students_student_number_key'
      AND conrelid = 'students'::regclass
  ) THEN
    ALTER TABLE students ADD CONSTRAINT students_student_number_key UNIQUE (student_number);
  END IF;
END $$;

-- Indexes for fast search/filter
CREATE INDEX IF NOT EXISTS idx_students_last_name  ON students (last_name);
CREATE INDEX IF NOT EXISTS idx_students_course     ON students (course);
CREATE INDEX IF NOT EXISTS idx_students_year_level ON students (year_level);