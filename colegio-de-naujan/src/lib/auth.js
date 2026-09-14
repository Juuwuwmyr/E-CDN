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

  // ── 2. Check students — student_number + LASTNAME ──────
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('student_number', u)
    .single();

  if (studentData && !studentError) {
    // Password = student's LAST NAME (uppercase, trimmed)
    if (studentData.last_name.toUpperCase() === p.toUpperCase()) {
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
          username:      studentData.student_number,
          name:          `${studentData.first_name} ${studentData.last_name}`,
          role:          'Student',
          userType:      'student',
          course:        studentData.course,
          yearLevel:     studentData.year_level,
          section:       studentData.section,
          studentNumber: studentData.student_number,
          enrollmentStatus: studentData.enrollment_status,
        },
        error: null,
      };
    }
    // Student number found but wrong password
    return { ok: false, user: null, error: 'Invalid credentials. Use your last name as password.' };
  }

  return { ok: false, user: null, error: 'Invalid username or password.' };
}

/* ──────────────────────────────────────────────────────────
   recordLoginSession  — logs a login event
────────────────────────────────────────────────────────── */
export async function recordLoginSession(user) {
  const { data, error } = await supabase
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

  if (error) console.error('Session record error:', error);
  return data?.id ?? null;
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
   recordSystemVisit  — logs a system click
────────────────────────────────────────────────────────── */
export async function recordSystemVisit(systemId, systemLabel, userId = null) {
  const { error } = await supabase
    .from('system_visits')
    .insert({
      system_id:    systemId,
      system_label: systemLabel,
      user_id:      userId,
      visited_at:   new Date().toISOString(),
    });
  if (error) console.error('System visit record error:', error);
}

/* ──────────────────────────────────────────────────────────
   getSystemVisitStats  — returns per-system visit counts
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
