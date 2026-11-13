import { supabase } from './supabase';
import bcrypt from 'bcryptjs';
import {
  sanitizeLoginInput,
  sanitizeStudentNumber,
  validatePasswordInput,
  validatePasswordPolicy,
  generateSessionToken,
  isNumericId,
} from './security';

/* ══════════════════════════════════════════════════════════
   RATE LIMITING
   Authoritative state lives in the DB (login_attempts table +
   SECURITY DEFINER RPCs) so it survives page reloads, private
   windows, and storage clearing. The sessionStorage functions
   below are only a fast local mirror / offline fallback for
   when the RPCs haven't been deployed yet.
══════════════════════════════════════════════════════════ */
const RL_WINDOW_MS = 5 * 60 * 1000;   // 5 minutes
const RL_MAX_ATTEMPTS = 5;
const RL_LOCK_MS = 15 * 60 * 1000;    // 15 minutes

function formatLockMessage(waitSeconds) {
  const mins = Math.max(1, Math.ceil((waitSeconds || 60) / 60));
  return `Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`;
}

/* DB-backed lock check (authoritative). Returns { locked, error }. */
async function checkServerLock(username) {
  try {
    const { data, error } = await supabase.rpc('login_check_lock', {
      p_username: username.toLowerCase(),
    });
    if (!error && data?.locked) {
      return { locked: true, error: formatLockMessage(data.wait_seconds) };
    }
  } catch (_) { /* RPC missing — fall through to local check */ }
  return { locked: false };
}

/* DB-backed failure recording (authoritative). */
async function recordFailedAttempt(username) {
  try {
    await supabase.rpc('login_record_failure', {
      p_username: username.toLowerCase(),
    });
  } catch (_) { /* RPC missing — local fallback below still applies */ }
  recordFailedAttemptLocal(username);
}

/* ── Local fallback (sessionStorage) ──────────────────────── */
function checkRateLimitLocal(username) {
  const key = `cdn_rl_${username.toLowerCase()}`;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return { ok: true };
    const state = JSON.parse(raw);
    const now = Date.now();
    if (state.lockUntil && now < state.lockUntil) {
      return { ok: false, error: formatLockMessage(state.lockUntil - now) };
    }
    if (state.lockUntil && now >= state.lockUntil) {
      sessionStorage.removeItem(key);
    }
  } catch (_) {}
  return { ok: true };
}

function recordFailedAttemptLocal(username) {
  const key = `cdn_rl_${username.toLowerCase()}`;
  try {
    const raw = sessionStorage.getItem(key);
    const now = Date.now();
    let state = raw ? JSON.parse(raw) : { count: 0, firstAttempt: now, lockUntil: null };
    if (now - state.firstAttempt > RL_WINDOW_MS) {
      state = { count: 0, firstAttempt: now, lockUntil: null };
    }
    state.count += 1;
    if (state.count >= RL_MAX_ATTEMPTS) {
      state.lockUntil = now + RL_LOCK_MS;
    }
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch (_) {}
}

function clearLocalRateLimit(username) {
  try { sessionStorage.removeItem('cdn_rl_' + username.toLowerCase()); } catch (_) {}
}

/* ──────────────────────────────────────────────────────────
   validateLogin
   Checks:
   1. portal_users table  — for admin / staff accounts
   2. students table      — using student_number as username
                            and last_name (uppercase) as password
   Returns: { ok, user, error }
────────────────────────────────────────────────────────── */
export async function validateLogin(username, password) {
  // Allowlist validation — malformed input fails closed before any query.
  const u = sanitizeLoginInput(username);
  if (!u) {
    return { ok: false, user: null, error: 'Invalid username format.' };
  }
  // Passwords pass through untouched; only presence + max length are checked.
  const pwCheck = validatePasswordInput(password);
  if (!pwCheck.ok) {
    return { ok: false, user: null, error: pwCheck.error };
  }
  const p = pwCheck.value;

  // ── Rate limit: DB-backed (authoritative) ────────────────
  const serverLock = await checkServerLock(u);
  if (serverLock.locked) {
    return { ok: false, user: null, error: serverLock.error };
  }
  // Local pre-check (fast path / fallback when RPC not deployed)
  const rl = checkRateLimitLocal(u);
  if (!rl.ok) {
    return { ok: false, user: null, error: rl.error };
  }

  // Records exactly ONE failed attempt per login attempt, even when
  // the credential check falls through multiple account lookups.
  let failureRecorded = false;
  const failLogin = async (message) => {
    if (!failureRecorded) {
      failureRecorded = true;
      await recordFailedAttempt(u);
    }
    return { ok: false, user: null, error: message };
  };

  // ── 1. Check portal_users (admin / staff) ──────────────
  const { data: staffData, error: staffError } = await supabase
    .from('portal_users')
    .select('username, password, full_name, role, is_active')
    .eq('username', u)
    .single();

  if (staffData && !staffError) {
    if (staffData.is_active === false) {
      return { ok: false, user: null, error: 'This account has been deactivated. Contact the administrator.' };
    }

    const isBcrypt = staffData.password?.startsWith('$2');
    const passwordOk = isBcrypt
      ? bcrypt.compareSync(p, staffData.password)
      : staffData.password === p; // legacy plaintext row

    if (passwordOk) {
      if (!isBcrypt) {
        // Auto-upgrade legacy plaintext to bcrypt (best effort).
        try {
          const hashed = bcrypt.hashSync(p, 10);
          const { error } = await supabase
            .from('portal_users')
            .update({ password: hashed })
            .eq('username', u);
          if (error) console.warn('[auth] legacy hash upgrade failed:', error.message);
        } catch (_) {}
      }
      clearLocalRateLimit(u);
      return {
        ok: true,
        user: {
          username:  staffData.username,
          name:      staffData.full_name,
          role:      staffData.role.charAt(0).toUpperCase() + staffData.role.slice(1),
          userType:  'staff',
        },
        error: null,
      };
    }
    // Fall through to the students check — the id could also be a
    // student number (preserves original login behavior).
  }

  // ── 2. Check students — student_number + custom password OR LASTNAME ──
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .select('student_number, full_name, course, year_level, section, enrollment_status')
    .eq('student_number', u)
    .single();

  if (studentData && !studentError) {
    // Check custom registered password first
    const { data: acct } = await supabase
      .from('student_accounts')
      .select('password')
      .eq('student_number', u)
      .single();

    // full_name is stored as "LAST, FIRST" or "LAST FIRST" — derive last name for fallback
    const fullName = studentData.full_name || '';
    const derivedLastName = fullName.includes(',')
      ? fullName.split(',')[0].trim()
      : fullName.split(' ')[0].trim();

    let passwordMatch = false;
    if (acct) {
      const isBcrypt = acct.password?.startsWith('$2');
      passwordMatch = isBcrypt
        ? bcrypt.compareSync(p, acct.password)
        : acct.password === p; // legacy plaintext row
      if (passwordMatch && !isBcrypt) {
        // Auto-upgrade legacy plaintext to bcrypt (best effort).
        try {
          const hashed = bcrypt.hashSync(p, 10);
          const { error } = await supabase
            .from('student_accounts')
            .update({ password: hashed })
            .eq('student_number', u);
          if (error) console.warn('[auth] legacy student hash upgrade failed:', error.message);
        } catch (_) {}
      }
    } else {
      passwordMatch = derivedLastName.toUpperCase() === p.toUpperCase();
    }

    if (passwordMatch) {
      if (studentData.enrollment_status === 'dropped' || studentData.enrollment_status === 'loa') {
        return {
          ok: false,
          user: null,
          error: `Your account is currently ${studentData.enrollment_status}. Contact the registrar.`,
        };
      }
      clearLocalRateLimit(u);
      return {
        ok: true,
        user: {
          username:         studentData.student_number,
          name:             fullName,
          role:             'Student',
          userType:         'student',
          course:           studentData.course,
          yearLevel:        studentData.year_level,
          section:          studentData.section,
          studentNumber:    studentData.student_number,
          enrollmentStatus: studentData.enrollment_status,
        },
        error: null,
      };
    }
    return failLogin('Invalid username or password.');
  }

  return failLogin('Invalid username or password.');
}

/* ──────────────────────────────────────────────────────────
   recordLoginSession  — logs a login event
   Tries with 'course' column first; if that column doesn't
   exist yet, retries without it so login always works.
────────────────────────────────────────────────────────── */
export async function recordLoginSession(user) {
  const token = generateSessionToken();
  const courseValue = user.course || user.role || null;

  // First attempt: include course column
  const { data, error } = await supabase
    .from('portal_sessions')
    .insert({
      user_type:  user.userType,
      user_id:    user.username,
      full_name:  user.name,
      role:       user.role,
      course:     courseValue,
      session_token: token,
      login_at:   new Date().toISOString(),
    })
    .select('id')
    .single();

  if (!error) return { id: data?.id ?? null, token };

  // If error mentions 'course' column not existing, retry without it
  console.warn('recordLoginSession first attempt error:', error.message);
  if (error.message?.includes('course') || error.code === '42703') {
    const { data: data2, error: error2 } = await supabase
      .from('portal_sessions')
      .insert({
        user_type:  user.userType,
        user_id:    user.username,
        full_name:  user.name,
        role:       user.role,
        session_token: token,
        login_at:   new Date().toISOString(),
      })
      .select('id')
      .single();
    if (!error2) return { id: data2?.id ?? null, token };

    // Session-token column missing too (migration not applied) —
    // log in without a persisted session rather than storing a
    // session that can never validate.
    if (error2.message?.includes('session_token') || error2.code === '42703') {
      const { data: data3, error: error3 } = await supabase
        .from('portal_sessions')
        .insert({
          user_type:  user.userType,
          user_id:    user.username,
          full_name:  user.name,
          role:       user.role,
          login_at:   new Date().toISOString(),
        })
        .select('id')
        .single();
      if (error3) console.error('recordLoginSession retry error:', error3);
      return { id: data3?.id ?? null, token: null };
    }

    console.error('recordLoginSession retry error:', error2);
    return { id: null, token: null };
  }

  if (error.message?.includes('session_token') || error.code === '42703') {
    // Token column missing (migration not applied) — fall back to a
    // token-less session so login still works, but validation on
    // reload will require a fresh login (fail closed).
    const { data: data3, error: error3 } = await supabase
      .from('portal_sessions')
      .insert({
        user_type:  user.userType,
        user_id:    user.username,
        full_name:  user.name,
        role:       user.role,
        course:     courseValue,
        login_at:   new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error3) console.error('recordLoginSession fallback error:', error3);
    return { id: data3?.id ?? null, token: null };
  }

  console.error('Session record error:', error);
  return { id: null, token: null };
}

/* ──────────────────────────────────────────────────────────
   getActiveSessions  — fetch all active sessions (logout_at IS NULL)
   Falls back to querying without 'course' column if missing.
────────────────────────────────────────────────────────── */
export async function getActiveSessions() {
  // Try with course column
  const { data, error } = await supabase
    .from('portal_sessions')
    .select('id, user_id, full_name, role, course, login_at, user_type')
    .is('logout_at', null)
    .order('login_at', { ascending: false });

  if (!error) return data || [];

  console.warn('getActiveSessions (with course) error:', error.message);

  // Fallback: query without course column
  const { data: data2, error: error2 } = await supabase
    .from('portal_sessions')
    .select('id, user_id, full_name, role, login_at, user_type')
    .is('logout_at', null)
    .order('login_at', { ascending: false });

  if (error2) {
    console.error('getActiveSessions fallback error:', error2);
    return [];
  }
  // Map role → course so resolveDept can still group by dept
  return (data2 || []).map(row => ({ ...row, course: row.course ?? row.role }));
}

/* ──────────────────────────────────────────────────────────
   subscribeToActiveSessions
   Subscribes to INSERT and UPDATE on portal_sessions via
   Supabase Realtime and calls onChange() whenever anything
   changes so the admin dashboard refreshes instantly.
   Returns the channel so the caller can unsubscribe.
────────────────────────────────────────────────────────── */
export function subscribeToActiveSessions(onChange) {
  const channel = supabase
    .channel('portal_sessions_realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'portal_sessions' },
      () => onChange()
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'portal_sessions' },
      () => onChange()
    )
    .subscribe();

  return channel;
}

/* ──────────────────────────────────────────────────────────
   subscribeToSystemVisits
   Subscribes to INSERT on system_visits so the Services page
   can show live visitor counts without a page refresh.
────────────────────────────────────────────────────────── */
export function subscribeToSystemVisits(onChange) {
  const channel = supabase
    .channel('system_visits_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'system_visit_stats' },
      () => onChange()
    )
    .subscribe();

  return channel;
}

/* ──────────────────────────────────────────────────────────
   recordLogoutSession  — marks logout time
────────────────────────────────────────────────────────── */
export async function recordLogoutSession(sessionId) {
  if (!isNumericId(sessionId)) return;
  const { error } = await supabase
    .from('portal_sessions')
    .update({ logout_at: new Date().toISOString() })
    .eq('id', Number(sessionId));
  if (error) console.error('Logout record error:', error);
}

/* ──────────────────────────────────────────────────────────
   markSessionLogoutBeacon
   Called on browser/tab close (beforeunload).
   Uses navigator.sendBeacon so it fires even as the page
   is closing — async fetch would be cancelled by the browser.
   Falls back to a regular fetch if sendBeacon isn't available.
────────────────────────────────────────────────────────── */
export function markSessionLogoutBeacon(sessionId) {
  if (!isNumericId(sessionId)) return;
  const url  = import.meta.env.VITE_SUPABASE_URL + '/rest/v1/portal_sessions?id=eq.' + sessionId;
  const body = JSON.stringify({ logout_at: new Date().toISOString() });
  const headers = {
    'Content-Type':  'application/json',
    'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + import.meta.env.VITE_SUPABASE_ANON_KEY,
    'Prefer':        'return=minimal',
  };

  // sendBeacon is the only reliable way to send data on page unload
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    // sendBeacon doesn't support custom headers directly — use fetch keepalive instead
  }
  // fetch with keepalive: browser keeps request alive even after page closes
  try {
    fetch(url, {
      method:    'PATCH',
      headers,
      body,
      keepalive: true,   // ← key: browser keeps this request alive on tab close
    }).catch(() => {});  // silence errors on close
  } catch (_) {}
}

/* ──────────────────────────────────────────────────────────
   renewSession
   Called when the app loads and finds an existing cdn_session
   in localStorage (browser was closed without logout).
   Clears the logout_at so the admin sees them as Online again.
────────────────────────────────────────────────────────── */
export async function renewSession(sessionId, token) {
  if (!isNumericId(sessionId) || !token) return;
  const { error } = await supabase
    .from('portal_sessions')
    .update({ logout_at: null })
    .eq('id', Number(sessionId))
    .eq('session_token', token);
  if (error) console.error('renewSession error:', error);
}

/* ──────────────────────────────────────────────────────────
   recordSystemVisit  — logs a system click to Supabase
   Uses direct upsert to system_visit_stats (daily aggregation)
────────────────────────────────────────────────────────── */
export async function recordSystemVisit(systemId, systemLabel, userId = null) {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Try upsert into aggregated stats table
    const { error: upsertError } = await supabase
      .from('system_visit_stats')
      .upsert(
        {
          system_id:    systemId,
          system_label: systemLabel,
          visit_date:   today,
          visit_count:  1,
        },
        {
          onConflict:    'system_id,visit_date',
          ignoreDuplicates: false,
        }
      );

    if (upsertError) {
      // If upsert fails (e.g. table doesn't exist yet), try incrementing manually
      const { data: existing } = await supabase
        .from('system_visit_stats')
        .select('visit_count')
        .eq('system_id', systemId)
        .eq('visit_date', today)
        .single();

      if (existing) {
        await supabase
          .from('system_visit_stats')
          .update({ visit_count: existing.visit_count + 1, system_label: systemLabel })
          .eq('system_id', systemId)
          .eq('visit_date', today);
      } else {
        await supabase
          .from('system_visit_stats')
          .insert({ system_id: systemId, system_label: systemLabel, visit_date: today, visit_count: 1 });
      }
    }
  } catch (e) {
    console.error('[recordSystemVisit] Exception:', e);
  }
}

/* ──────────────────────────────────────────────────────────
   getSystemVisitStats  — per-system visit counts from DB
────────────────────────────────────────────────────────── */
export async function getSystemVisitStats() {
  // Try aggregated stats table first (efficient, no bloat)
  const { data: aggData, error: aggError } = await supabase
    .from('system_visit_stats')
    .select('system_id, visit_count');

  if (!aggError && aggData && aggData.length > 0) {
    return aggData.reduce((acc, row) => {
      acc[row.system_id] = (acc[row.system_id] || 0) + (row.visit_count || 1);
      return acc;
    }, {});
  }

  // Fallback: raw system_visits table
  const { data, error } = await supabase
    .from('system_visits')
    .select('system_id');

  if (error || !data) return {};

  return data.reduce((acc, row) => {
    acc[row.system_id] = (acc[row.system_id] || 0) + 1;
    return acc;
  }, {});
}

/* ──────────────────────────────────────────────────────────
   getRecentSystemVisits  — last N system visit rows
────────────────────────────────────────────────────────── */
export async function getRecentSystemVisits(limit = 20) {
  // Try aggregated stats table — ordered by most recently updated date
  const { data: aggData, error: aggError } = await supabase
    .from('system_visit_stats')
    .select('system_id, system_label, visit_date, visit_count')
    .order('visit_date', { ascending: false })
    .limit(limit);

  if (!aggError && aggData && aggData.length > 0) {
    // Shape it to match the expected format for the Live Feed
    return aggData.map((row, i) => ({
      id:           `agg_${row.system_id}_${row.visit_date}`,
      system_id:    row.system_id,
      system_label: row.system_label || row.system_id,
      user_id:      `${row.visit_count} visit${row.visit_count !== 1 ? 's' : ''} today`,
      visited_at:   row.visit_date + 'T12:00:00.000Z',
    }));
  }

  // Fallback: raw system_visits
  const { data, error } = await supabase
    .from('system_visits')
    .select('id, system_id, system_label, user_id, visited_at')
    .order('visited_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getRecentSystemVisits error:', error);
    return [];
  }
  return data || [];
}

/* ──────────────────────────────────────────────────────────
   getPortalMetrics  — aggregate counts for the Activity tab
────────────────────────────────────────────────────────── */
export async function getPortalMetrics() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  // Total login sessions ever
  const { count: totalSessions } = await supabase
    .from('portal_sessions')
    .select('*', { count: 'exact', head: true });

  // Sessions that started today
  const { count: todaySessions } = await supabase
    .from('portal_sessions')
    .select('*', { count: 'exact', head: true })
    .gte('login_at', todayISO);

  // Total system clicks — use aggregated table (sum of all visit_counts)
  const { data: aggClicks } = await supabase
    .from('system_visit_stats')
    .select('visit_count');

  const totalClicks = aggClicks && aggClicks.length > 0
    ? aggClicks.reduce((sum, r) => sum + (r.visit_count || 0), 0)
    : 0;

  // Per-department session counts
  const { data: courseSessions } = await supabase
    .from('portal_sessions')
    .select('course');

  const deptSessions = {};
  (courseSessions || []).forEach(r => {
    const c = (r.course || '').toUpperCase();
    if (c.includes('BSIS'))       deptSessions['BSIS']        = (deptSessions['BSIS']        || 0) + 1;
    else if (c.includes('WFT'))   deptSessions['BTVTED-WFT']  = (deptSessions['BTVTED-WFT']  || 0) + 1;
    else if (c.includes('CHS'))   deptSessions['BTVTED-CHS']  = (deptSessions['BTVTED-CHS']  || 0) + 1;
    else if (c.includes('BPA'))   deptSessions['BPA']         = (deptSessions['BPA']         || 0) + 1;
  });

  return {
    totalSessions: totalSessions || 0,
    todaySessions: todaySessions || 0,
    totalClicks:   totalClicks   || 0,
    deptSessions,
  };
}

/* ──────────────────────────────────────────────────────────
   validateStudentNumber  — check if a student number exists
────────────────────────────────────────────────────────── */
export async function validateStudentNumber(studentNumber) {
  const { data, error } = await supabase
    .from('students')
    .select('student_number, full_name, course, year_level, enrollment_status')
    .eq('student_number', studentNumber.trim())
    .single();

  if (error || !data) return null;
  return data;
}

/* ──────────────────────────────────────────────────────────
   registerStudent
   Validates student number exists in students table,
   then sets a custom password for them in student_accounts.
   Returns: { ok, user, error }
────────────────────────────────────────────────────────── */
export async function registerStudent(studentNumber, password) {
  const sn = sanitizeStudentNumber(studentNumber);
  if (!sn) return { ok: false, error: 'Invalid student number format.' };

  const pwCheck = validatePasswordPolicy(password);
  if (!pwCheck.ok) return { ok: false, error: pwCheck.error };
  const pw = password;

  // 1. Check student exists in enrollment list
  const { data: student, error: lookupErr } = await supabase
    .from('students')
    .select('student_number, full_name, course, year_level, section, enrollment_status')
    .eq('student_number', sn)
    .single();

  if (lookupErr || !student) {
    return { ok: false, error: 'Student number not found in the enrollment list. Contact the registrar.' };
  }

  if (student.enrollment_status === 'dropped' || student.enrollment_status === 'loa') {
    return { ok: false, error: `Your enrollment status is "${student.enrollment_status}". Contact the registrar.` };
  }

  // 2. Check if already registered
  const { data: existing } = await supabase
    .from('student_accounts')
    .select('student_number')
    .eq('student_number', sn)
    .single();

  if (existing) {
    return { ok: false, error: 'This student number is already registered. Please sign in.' };
  }

  // 3. Hash password before storing (cost factor 10)
  const hashedPassword = bcrypt.hashSync(pw, 10);

  // 4. Create account with hashed password
  const { error: insertErr } = await supabase
    .from('student_accounts')
    .insert({ student_number: sn, password: hashedPassword });

  if (insertErr) {
    return { ok: false, error: 'Registration failed. Please try again.' };
  }

  return {
    ok: true,
    user: {
      username:      student.student_number,
      name:          student.full_name || student.student_number,
      role:          'Student',
      userType:      'student',
      course:        student.course,
      yearLevel:     student.year_level,
      studentNumber: student.student_number,
      enrollmentStatus: student.enrollment_status,
    },
    error: null,
  };
}

/* ──────────────────────────────────────────────────────────
   getSystemApplications  — fetch all active system apps from DB
────────────────────────────────────────────────────────── */
export async function getSystemApplications(includeInactive = false) {
  let query = supabase
    .from('system_applications')
    .select('*')
    .order('created_at', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('getSystemApplications error:', error);
    return [];
  }
  return data || [];
}

/* ──────────────────────────────────────────────────────────
   subscribeToSystemApplications
   Subscribes to changes on system_applications table
   so the dashboard updates when apps are added/edited/deleted
────────────────────────────────────────────────────────── */
export function subscribeToSystemApplications(onChange) {
  const channel = supabase
    .channel('system_applications_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'system_applications' },
      () => onChange()
    )
    .subscribe();

  return channel;
}

/* ──────────────────────────────────────────────────────────
   validateSession  — verifies a session id + token pair against
   the DB. Both must match. Returns the DB row so callers can
   refresh the cached user identity from the server instead of
   trusting localStorage alone.

   Grace window: the beforeunload beacon marks logout_at whenever
   the page unloads (URL edit, refresh, tab close). A logout_at
   set within the last 30 seconds is therefore treated as a
   navigation artifact, not a real logout — the caller renews the
   session immediately after. An explicit logout still invalidates
   the session: the local token is deleted and, after the grace
   window, a stale token can no longer renew.
────────────────────────────────────────────────────────── */
const SESSION_LOGOUT_GRACE_MS = 30 * 1000;

export async function validateSession(sessionId, token) {
  if (!isNumericId(sessionId) || !token) return { valid: false };
  const { data, error } = await supabase
    .from('portal_sessions')
    .select('id, user_id, role, user_type, full_name, logout_at')
    .eq('id', Number(sessionId))
    .eq('session_token', token)
    .maybeSingle();

  if (error || !data) return { valid: false };

  // Only an OLD logout_at (> grace window) invalidates the session.
  if (data.logout_at) {
    const age = Date.now() - new Date(data.logout_at).getTime();
    if (age > SESSION_LOGOUT_GRACE_MS) return { valid: false };
  }

  return { valid: true, session: data };
}
