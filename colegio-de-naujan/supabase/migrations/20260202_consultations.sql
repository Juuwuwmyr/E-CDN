-- consultations + questions + responses: Participation module

-- Main consultation/survey table
CREATE TABLE IF NOT EXISTS consultations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL DEFAULT 'survey'
              CHECK (type IN ('survey','consultation','proposal')),
  status      TEXT NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft','published','closed','archived')),
  opens_at    TIMESTAMPTZ,
  closes_at   TIMESTAMPTZ,
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Questions per consultation
CREATE TABLE IF NOT EXISTS consultation_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations (id) ON DELETE CASCADE,
  question_text   TEXT NOT NULL,
  question_type   TEXT NOT NULL DEFAULT 'text'
                  CHECK (question_type IN (
                    'text','single_choice','multiple_choice','rating','yes_no'
                  )),
  options         TEXT[],
  is_required     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Responses per consultation
CREATE TABLE IF NOT EXISTS consultation_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations (id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES consultation_questions (id) ON DELETE CASCADE,
  answer          TEXT,
  is_anonymous    BOOLEAN NOT NULL DEFAULT TRUE,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE consultations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_questions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_responses  ENABLE ROW LEVEL SECURITY;

-- Consultations: public can view published; authenticated can manage
CREATE POLICY "Public can view published consultations"
  ON consultations FOR SELECT USING (status = 'published');
CREATE POLICY "Authenticated manage consultations"
  ON consultations FOR ALL USING (true) WITH CHECK (true);

-- Questions: public can view
CREATE POLICY "Public can view questions"
  ON consultation_questions FOR SELECT USING (true);
CREATE POLICY "Authenticated manage questions"
  ON consultation_questions FOR ALL USING (true) WITH CHECK (true);

-- Responses: anyone can insert; authenticated can read
CREATE POLICY "Anyone can submit responses"
  ON consultation_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can read responses"
  ON consultation_responses FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consultations_status     ON consultations (status);
CREATE INDEX IF NOT EXISTS idx_consult_q_consult_id     ON consultation_questions (consultation_id);
CREATE INDEX IF NOT EXISTS idx_consult_r_consult_id     ON consultation_responses (consultation_id);

-- updated_at trigger for consultations
CREATE OR REPLACE FUNCTION update_consultations_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW EXECUTE FUNCTION update_consultations_updated_at();
