-- concern_submissions: Accountability module
-- Public concern and feedback management system.

CREATE TABLE IF NOT EXISTS concern_submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_no     TEXT UNIQUE NOT NULL DEFAULT (
    'CDN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
    LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0')
  ),
  category         TEXT NOT NULL DEFAULT 'other'
                   CHECK (category IN (
                     'academic_services','enrollment_services','laboratory_facilities',
                     'campus_maintenance','institutional_programs',
                     'administrative_services','other'
                   )),
  subject          TEXT NOT NULL,
  description      TEXT NOT NULL,
  office           TEXT,
  status           TEXT NOT NULL DEFAULT 'submitted'
                   CHECK (status IN (
                     'submitted','received','assigned','under_review',
                     'action_in_progress','resolved','closed',
                     'rejected','reopened'
                   )),
  priority         TEXT NOT NULL DEFAULT 'normal'
                   CHECK (priority IN ('low','normal','high','urgent')),
  is_anonymous     BOOLEAN NOT NULL DEFAULT FALSE,
  submitter_name   TEXT,
  submitter_email  TEXT,
  student_number   TEXT,
  assigned_to      TEXT,
  assigned_office  TEXT,
  resolution_note  TEXT,
  internal_notes   TEXT,
  target_deadline  DATE,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: anyone can submit and look up by reference
ALTER TABLE concern_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit concerns"
  ON concern_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can look up their concern"
  ON concern_submissions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage concerns"
  ON concern_submissions FOR ALL
  USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_concerns_status       ON concern_submissions (status);
CREATE INDEX IF NOT EXISTS idx_concerns_category     ON concern_submissions (category);
CREATE INDEX IF NOT EXISTS idx_concerns_reference_no ON concern_submissions (reference_no);
CREATE INDEX IF NOT EXISTS idx_concerns_created_at   ON concern_submissions (created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_concerns_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_concerns_updated_at
  BEFORE UPDATE ON concern_submissions
  FOR EACH ROW EXECUTE FUNCTION update_concerns_updated_at();
