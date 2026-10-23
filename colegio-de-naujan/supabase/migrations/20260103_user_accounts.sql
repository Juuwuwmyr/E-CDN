-- Ensure portal_users has needed columns
ALTER TABLE portal_users
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();

-- Disable RLS for admin management
ALTER TABLE portal_users DISABLE ROW LEVEL SECURITY;

-- Also expose student_accounts for admin view
ALTER TABLE student_accounts DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_portal_users_role      ON portal_users (role);
CREATE INDEX IF NOT EXISTS idx_portal_users_is_active ON portal_users (is_active);