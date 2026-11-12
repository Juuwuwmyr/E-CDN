-- governance_documents: Transparency module
-- Stores published institutional documents, reports, and public records.

CREATE TABLE IF NOT EXISTS governance_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  body             TEXT,
  category         TEXT NOT NULL DEFAULT 'other'
                   CHECK (category IN (
                     'academic_programs','enrollment_stats','budget_reports',
                     'accomplishments','projects','partnerships',
                     'announcements','official_documents','historical_records','other'
                   )),
  academic_year    TEXT,
  status           TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','submitted','approved','published','archived')),
  file_url         TEXT,
  photo_urls       TEXT[],
  responsible_office TEXT,
  created_by       TEXT,
  approved_by      TEXT,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE governance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published documents"
  ON governance_documents FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authenticated users can manage documents"
  ON governance_documents FOR ALL
  USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gov_docs_status       ON governance_documents (status);
CREATE INDEX IF NOT EXISTS idx_gov_docs_category     ON governance_documents (category);
CREATE INDEX IF NOT EXISTS idx_gov_docs_academic_year ON governance_documents (academic_year);
CREATE INDEX IF NOT EXISTS idx_gov_docs_published_at ON governance_documents (published_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_gov_docs_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gov_docs_updated_at
  BEFORE UPDATE ON governance_documents
  FOR EACH ROW EXECUTE FUNCTION update_gov_docs_updated_at();
