import { supabase } from './supabase';

/* ── Fetch all portal users (admin/staff) ── */
export async function getPortalUsers() {
  const { data, error } = await supabase
    .from('portal_users')
    .select('id,username,full_name,role,is_active,created_at')
    .order('full_name', { ascending: true });
  if (error) throw error;
  return data || [];
}

/* ── Fetch all student accounts ── */
export async function getStudentAccounts() {
  const { data, error } = await supabase
    .from('student_accounts')
    .select('student_number,created_at')
    .order('student_number', { ascending: true });
  if (error) throw error;
  return data || [];
}

/* ── Create portal user ── */
export async function createPortalUser({ username, full_name, role, password }) {
  const { data, error } = await supabase
    .from('portal_users')
    .insert({ username, full_name, role, password, is_active: true })
    .select('id,username,full_name,role,is_active,created_at')
    .single();
  if (error) throw error;
  return data;
}

/* ── Update portal user ── */
export async function updatePortalUser(id, updates) {
  const { data, error } = await supabase
    .from('portal_users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id,username,full_name,role,is_active,created_at')
    .single();
  if (error) throw error;
  return data;
}

/* ── Toggle active status ── */
export async function toggleUserActive(id, is_active) {
  return updatePortalUser(id, { is_active });
}

/* ── Delete portal user ── */
export async function deletePortalUser(id) {
  const { error } = await supabase.from('portal_users').delete().eq('id', id);
  if (error) throw error;
}

/* ── Reset student account password ── */
export async function resetStudentPassword(student_number, newPassword) {
  const { error } = await supabase
    .from('student_accounts')
    .upsert({ student_number, password: newPassword }, { onConflict: 'student_number' });
  if (error) throw error;
}

/* ── Avatar color from string ── */
export function accountAvatarColor(str) {
  let h = 0;
  for (const c of (str || '')) h = c.charCodeAt(0) + ((h << 5) - h);
  const colors = ['#002280','#7c3aed','#10813f','#C8102E','#C8960C','#0891b2'];
  return colors[Math.abs(h) % colors.length];
}