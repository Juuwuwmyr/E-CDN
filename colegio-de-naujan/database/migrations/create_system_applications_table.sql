-- Migration: Create system_applications table
-- Description: Stores system applications/services that appear on the portal dashboard
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS system_applications (
  id VARCHAR(50) PRIMARY KEY,  -- Unique identifier (e.g., 'csc', 'osas', 'admission')
  label VARCHAR(100) NOT NULL,  -- Display name (e.g., 'CSC Services')
  sub VARCHAR(255),  -- Subtitle/description (e.g., 'Fines Management System')
  url TEXT NOT NULL,  -- Application URL
  category VARCHAR(50) DEFAULT 'academics',  -- Category (academics, admin, finance, etc.)
  color VARCHAR(7) DEFAULT '#002280',  -- Primary color (hex)
  bg VARCHAR(7) DEFAULT '#eef1fb',  -- Background color (hex)
  badge VARCHAR(20),  -- Optional badge text (e.g., 'New', 'Beta')
  is_active BOOLEAN DEFAULT true,  -- Whether to show on portal
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_system_applications_active ON system_applications(is_active);
CREATE INDEX IF NOT EXISTS idx_system_applications_category ON system_applications(category);

-- Enable Row Level Security
ALTER TABLE system_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active applications
CREATE POLICY "Anyone can view active applications"
  ON system_applications
  FOR SELECT
  USING (is_active = true);

-- Policy: Authenticated users can read all applications (including inactive ones)
CREATE POLICY "Authenticated users can view all applications"
  ON system_applications
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only authenticated users can insert/update/delete
-- (You might want to restrict this to admin role only in production)
CREATE POLICY "Authenticated users can manage applications"
  ON system_applications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default system applications (migrate existing data)
INSERT INTO system_applications (id, label, sub, url, category, color, bg, badge, is_active) VALUES
  ('csc', 'CSC Services', 'Fines Management System', 'https://student-fines-hub-vf9z.vercel.app/', 'admin', '#002280', '#eef1fb', NULL, true),
  ('osas', 'OSAS Services', 'Violation Tracking System', 'https://osas-sys.duckdns.org/', 'admin', '#C8102E', '#fdf0f2', NULL, true),
  ('admission', 'Admission Services', 'Admissions Office Portal', 'https://ecnesis.duckdns.org/', 'academics', '#C8960C', '#fdf8ec', 'New', true)
ON CONFLICT (id) DO NOTHING;

-- Create a function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_system_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS system_applications_updated_at_trigger ON system_applications;
CREATE TRIGGER system_applications_updated_at_trigger
  BEFORE UPDATE ON system_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_system_applications_updated_at();

-- Grant permissions
GRANT SELECT ON system_applications TO anon;
GRANT ALL ON system_applications TO authenticated;

COMMENT ON TABLE system_applications IS 'System applications/services displayed on the CDN portal dashboard';
COMMENT ON COLUMN system_applications.id IS 'Unique identifier (lowercase, no spaces)';
COMMENT ON COLUMN system_applications.label IS 'Display name shown to users';
COMMENT ON COLUMN system_applications.sub IS 'Subtitle or description';
COMMENT ON COLUMN system_applications.url IS 'Full URL to the application';
COMMENT ON COLUMN system_applications.category IS 'Category for grouping (academics, admin, finance, health, library, schedule, reports, more)';
COMMENT ON COLUMN system_applications.color IS 'Primary color in hex format';
COMMENT ON COLUMN system_applications.bg IS 'Background color in hex format';
COMMENT ON COLUMN system_applications.badge IS 'Optional badge text (e.g., New, Beta, Updated)';
COMMENT ON COLUMN system_applications.is_active IS 'Whether the application is visible on the portal';
