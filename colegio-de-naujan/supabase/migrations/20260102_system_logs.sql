-- system_logs: tracks all portal activity
CREATE TABLE IF NOT EXISTS system_logs (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id       TEXT,
  user_name     TEXT,
  action        TEXT NOT NULL,
  details       TEXT,
  ip_address    TEXT,
  status        TEXT NOT NULL DEFAULT 'success'
                CHECK (status IN ('success','warning','failed')),
  module        TEXT
);

-- Disable RLS for admin-only table
ALTER TABLE system_logs DISABLE ROW LEVEL SECURITY;

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at  ON system_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id     ON system_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action      ON system_logs (action);
CREATE INDEX IF NOT EXISTS idx_system_logs_status      ON system_logs (status);