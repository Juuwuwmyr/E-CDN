/**
 * announcements.js
 * ─────────────────────────────────────────────────────────
 * CRUD helpers for the `announcements` table in Supabase.
 *
 * Audience targeting:
 *   target_courses      = null  → all courses
 *                         ['BSIS','BPA'] → specific courses
 *   target_year_levels  = null  → all year levels
 *                         ['1','2'] → specific year levels (stored as text[])
 */
import { supabase } from './supabase';

/* ── Fetch announcements visible to a specific student ──── */
export async function fetchAnnouncements({ course = null, yearLevel = null } = {}) {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const all = data ?? [];

  // Client-side filter: if announcement has targets, student must match
  return all.filter(ann => {
    const courseMatch =
      !ann.target_courses ||
      ann.target_courses.length === 0 ||
      (course && ann.target_courses.map(c => c.toUpperCase()).includes(course.toUpperCase()));

    const yearMatch =
      !ann.target_year_levels ||
      ann.target_year_levels.length === 0 ||
      (yearLevel != null && ann.target_year_levels.includes(String(yearLevel)));

    return courseMatch && yearMatch;
  });
}

/* ── Fetch ALL announcements for admin (incl. inactive) ── */
export async function fetchAllAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/* ── Create a new announcement ─────────────────────────── */
export async function createAnnouncement({
  title,
  body,
  type = 'info',
  createdBy,
  targetCourses = null,       // null = all, or ['BSIS','BPA',…]
  targetYearLevels = null,    // null = all, or ['1','2',…]
}) {
  const { data, error } = await supabase
    .from('announcements')
    .insert([{
      title,
      body,
      type,
      created_by:          createdBy,
      is_active:           true,
      target_courses:      targetCourses?.length     ? targetCourses     : null,
      target_year_levels:  targetYearLevels?.length  ? targetYearLevels  : null,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ── Soft-delete (deactivate) an announcement ──────────── */
export async function deactivateAnnouncement(id) {
  const { error } = await supabase
    .from('announcements')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

/* ── Hard-delete an announcement ──────────────────────── */
export async function deleteAnnouncement(id) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/* ── Re-activate a deactivated announcement ────────────── */
export async function reactivateAnnouncement(id) {
  const { error } = await supabase
    .from('announcements')
    .update({ is_active: true })
    .eq('id', id);
  if (error) throw error;
}
