-- ============================================================
-- 20261113_security_hardening.sql
-- Run this in the Supabase SQL Editor (or `supabase db push`).
--
--  1. DB-backed login rate limiting
--     - login_attempts table, RLS enabled with NO policies
--     - only the SECURITY DEFINER functions below can touch it
--     - lock state lives in the database, so clearing browser
--       storage / opening a private window does NOT reset it
--  2. session_token column on portal_sessions
--     - sessions are only valid when id AND token match
-- ============================================================

-- ── 1. LOGIN ATTEMPTS (rate limiting) ──────────────────────
CREATE TABLE IF NOT EXISTS public.login_attempts (
  username      TEXT        PRIMARY KEY,
  fail_count    INT         NOT NULL DEFAULT 0,
  first_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lock_until    TIMESTAMPTZ
);

-- No anon/authenticated access to the raw table. The functions
-- below are SECURITY DEFINER (run as the table owner, bypass RLS),
-- so clients can only increment failures or read lock state —
-- they can never clear or forge entries.
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.login_attempts FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_login_attempts_lock ON public.login_attempts (lock_until);

-- ── login_check_lock(username) ──────────────────────────────
-- Returns the current lock state without changing anything:
--   { locked: bool, wait_seconds: int, remaining_attempts: int }
CREATE OR REPLACE FUNCTION public.login_check_lock(p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row public.login_attempts%ROWTYPE;
BEGIN
  IF p_username IS NULL OR p_username = '' THEN
    RETURN jsonb_build_object('locked', FALSE, 'wait_seconds', 0, 'remaining_attempts', 5);
  END IF;

  SELECT * INTO v_row FROM public.login_attempts WHERE username = p_username;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('locked', FALSE, 'wait_seconds', 0, 'remaining_attempts', 5);
  END IF;

  -- Active lock?
  IF v_row.lock_until IS NOT NULL AND v_row.lock_until > NOW() THEN
    RETURN jsonb_build_object(
      'locked', TRUE,
      'wait_seconds', CEIL(EXTRACT(EPOCH FROM (v_row.lock_until - NOW())))::INT,
      'remaining_attempts', 0
    );
  END IF;

  -- Attempts older than the 5-minute window: stale, treat as fresh.
  IF v_row.first_attempt < NOW() - INTERVAL '5 minutes' THEN
    DELETE FROM public.login_attempts WHERE username = p_username;
    RETURN jsonb_build_object('locked', FALSE, 'wait_seconds', 0, 'remaining_attempts', 5);
  END IF;

  RETURN jsonb_build_object(
    'locked', FALSE,
    'wait_seconds', 0,
    'remaining_attempts', GREATEST(0, 5 - v_row.fail_count)
  );
END;
$$;

-- ── login_record_failure(username) ──────────────────────────
-- Records one failed attempt. Locks the username for 15 minutes
-- after 5 failures inside a 5-minute window. Locks and windows
-- expire automatically — there is deliberately NO "reset" RPC an
-- attacker could call to clear their own lock.
CREATE OR REPLACE FUNCTION public.login_record_failure(p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row   public.login_attempts%ROWTYPE;
  v_count INT;
  v_first TIMESTAMPTZ;
  v_lock  TIMESTAMPTZ;
BEGIN
  IF p_username IS NULL OR p_username = '' THEN
    RETURN jsonb_build_object('locked', FALSE, 'wait_seconds', 0, 'remaining_attempts', 5);
  END IF;

  SELECT * INTO v_row FROM public.login_attempts WHERE username = p_username;

  IF FOUND AND v_row.first_attempt >= NOW() - INTERVAL '5 minutes' THEN
    v_count := v_row.fail_count + 1;
    v_first := v_row.first_attempt;
    v_lock  := v_row.lock_until;
  ELSE
    v_count := 1;
    v_first := NOW();
    v_lock  := NULL;
  END IF;

  -- Lock after the 5th failure; never extend an already-active lock.
  IF v_count >= 5 AND (v_lock IS NULL OR v_lock <= NOW()) THEN
    v_lock := NOW() + INTERVAL '15 minutes';
  END IF;

  INSERT INTO public.login_attempts (username, fail_count, first_attempt, lock_until)
  VALUES (p_username, v_count, v_first, v_lock)
  ON CONFLICT (username) DO UPDATE
    SET fail_count    = EXCLUDED.fail_count,
        first_attempt = EXCLUDED.first_attempt,
        lock_until    = EXCLUDED.lock_until;

  RETURN jsonb_build_object(
    'locked',             (v_lock IS NOT NULL AND v_lock > NOW()),
    'wait_seconds',       CASE WHEN v_lock IS NOT NULL AND v_lock > NOW()
                               THEN CEIL(EXTRACT(EPOCH FROM (v_lock - NOW())))::INT
                               ELSE 0 END,
    'remaining_attempts', GREATEST(0, 5 - v_count)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.login_check_lock(TEXT)     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_record_failure(TEXT) TO anon, authenticated;

-- ── 2. SESSION TOKENS ───────────────────────────────────────
ALTER TABLE public.portal_sessions
  ADD COLUMN IF NOT EXISTS session_token TEXT;

CREATE INDEX IF NOT EXISTS idx_portal_sessions_token
  ON public.portal_sessions (session_token);

-- Note: existing active sessions have NULL tokens and will fail
-- validation — users are forced to sign in once after this change.
-- That is intentional: it invalidates any sessions that predate
-- token-based validation.
