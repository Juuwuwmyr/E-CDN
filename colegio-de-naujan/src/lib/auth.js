import { supabase } from './supabase';

/* ──────────────────────────────────────────────────────────
   validateLogin
   Checks:
   1. portal_users table  — for admin / staff accounts
   2. students table      — using student_number as username
                            and last_name (uppercase) as password
   Returns: { ok, user, error }
────────────────────────────────────────────────────────── */
export async function validateLogin(username, password) {
  const u = username.trim();
  const p = password.trim();

  if (!u || !p) {
    return { ok: false, user: null, error: 'Username and password are required.' };
  }

  // ── 1. Check portal_users (admin / staff) ──────────────
  const { data: staffData, error: staffError } = await supabase
    .from('portal_users')
    .select('*')
    .eq('username', u)
    .eq('is_active', true)
    .single();

  if (staffData && !staffError) {
    // Simple plaintext check (replace with bcrypt in production)
    if (staffData.password === p) {
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
  }

  // ── 2. Check students — student_number + custom password OR LASTNAME ──
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('student_number', u)
    .single();

  if (studentData && !studentError) {
    // Check custom registered password first
    const { data: acct } = await supabase
      .from('student_accounts')
      .select('password')
      .eq('student_number', u)
      .single();

    const passwordMatch = acct
      ? acct.password === p
      : studentData.last_name.toUpperCase() === p.toUpperCase();

    if (passwordMatch) {
      if (studentData.enrollment_status === 'dropped' || studentData.enrollment_status === 'loa') {
        return {
          ok: false,
          user: null,
          error: `Your account is currently ${studentData.enrollment_status}. Contact the registrar.`,
        };
      }
      return {
        ok: true,
        user: {
          username:         studentData.student_number,
          name:             `${studentData.first_name} ${studentData.last_name}`,
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
    return { ok: false, user: null, error: 'Incorrect password. Try your last name or registered password.' };
  }

  return { ok: false, user: null, error: 'Invalid username or password.' };
}

/* ──────────────────────────────────────────────────────────
   recordLoginSession  — logs a login event
   Tries with 'course' column first; if that column doesn't
   exist yet, retries without it so login always works.
────────────────────────────────────────────────────────── */
export async function recordLoginSession(user) {
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
      login_at:   new Date().toISOString(),
    })
    .select('id')
    .single();

  if (!error) return data?.id ?? null;

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
        login_at:   new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error2) console.error('recordLoginSession retry error:', error2);
    return data2?.id ?? null;
  }

  console.error('Session record error:', error);
  return null;
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
      { event: 'INSERT', schema: 'public', table: 'system_visits' },
      () => onChange()
    )
    .subscribe();

  return channel;
}

/* ──────────────────────────────────────────────────────────
   recordLogoutSession  — marks logout time
────────────────────────────────────────────────────────── */
export async function recordLogoutSession(sessionId) {
  if (!sessionId) return;
  const { error } = await supabase
    .from('portal_sessions')
    .update({ logout_at: new Date().toISOString() })
    .eq('id', sessionId);
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
  if (!sessionId) return;
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
export async function renewSession(sessionId) {
  if (!sessionId) return;
  const { error } = await supabase
    .from('portal_sessions')
    .update({ logout_at: null })
    .eq('id', sessionId);
  if (error) console.error('renewSession error:', error);
}

/* ──────────────────────────────────────────────────────────
   recordSystemVisit  — logs a system click to Supabase
────────────────────────────────────────────────────────── */
export async function recordSystemVisit(systemId, systemLabel, userId = null) {
  console.log('[recordSystemVisit] Inserting:', { systemId, systemLabel, userId });
  try {
    const { data, error } = await supabase
      .from('system_visits')
      .insert({
        system_id:    systemId,
        system_label: systemLabel,
        user_id:      userId,
        visited_at:   new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[recordSystemVisit] INSERT error:', error);
    } else {
      console.log('[recordSystemVisit] SUCCESS — inserted id:', data?.id);
    }
  } catch (e) {
    console.error('[recordSystemVisit] Exception:', e);
  }
}

/* ──────────────────────────────────────────────────────────
   getSystemVisitStats  — per-system visit counts from DB
────────────────────────────────────────────────────────── */
export async function getSystemVisitStats() {
  const { data, error } = await supabase
    .from('system_visits')
    .select('system_id, system_label');

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

  // Total system clicks
  const { count: totalClicks } = await supabase
    .from('system_visits')
    .select('*', { count: 'exact', head: true });

  // Unique days that had at least one session (approx via all login_at dates)
  const { data: sessionDates } = await supabase
    .from('portal_sessions')
    .select('login_at');

  const uniqueDays = new Set(
    (sessionDates || []).map(r => r.login_at?.slice(0, 10))
  ).size;

  return {
    totalSessions: totalSessions || 0,
    todaySessions: todaySessions || 0,
    totalClicks:   totalClicks   || 0,
    uniqueDays,
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
  const sn = studentNumber.trim();
  const pw = password.trim();

  if (!sn || !pw) return { ok: false, error: 'All fields are required.' };
  if (pw.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

  // 1. Check student exists in enrollment list
  const { data: student, error: lookupErr } = await supabase
    .from('students')
    .select('*')
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

  // 3. Create account
  const { error: insertErr } = await supabase
    .from('student_accounts')
    .insert({ student_number: sn, password: pw });

  if (insertErr) {
    return { ok: false, error: 'Registration failed. Please try again.' };
  }

  return {
    ok: true,
    user: {
      username:      student.student_number,
      name:          `${student.first_name} ${student.last_name}`,
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
