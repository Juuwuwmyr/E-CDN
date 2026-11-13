import { supabase } from './supabase';
import bcrypt from 'bcryptjs';
import { sanitizeLoginInput, validatePasswordPolicy } from './security';

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

/* ── Create portal user (password is bcrypt-hashed before insert) ── */
export async function createPortalUser({ username, full_name, role, password }) {
  const safeUsername = sanitizeLoginInput(username);
  if (!safeUsername) {
    throw new Error('Username may only contain letters, numbers, dots, dashes and underscores (max 32 characters).');
  }
  if (typeof full_name !== 'string' || !full_name.trim()) {
    throw new Error('Full name is required.');
  }
  const pwCheck = validatePasswordPolicy(password);
  if (!pwCheck.ok) throw new Error(pwCheck.error);

  const hashed = bcrypt.hashSync(password, 10);

  const { data, error } = await supabase
    .from('portal_users')
    .insert({ username: safeUsername, full_name: full_name.trim(), role, password: hashed, is_active: true })
    .select('id,username,full_name,role,is_active,created_at')
    .single();
  if (error) throw error;
  return data;
}

/* ── Update portal user (hashes password when one is provided) ── */
export async function updatePortalUser(id, updates) {
  const safeUpdates = { ...updates };
  if (updates.password !== undefined) {
    const pwCheck = validatePasswordPolicy(updates.password);
    if (!pwCheck.ok) throw new Error(pwCheck.error);
    safeUpdates.password = bcrypt.hashSync(updates.password, 10);
  }
  if (updates.username !== undefined) {
    const safeUsername = sanitizeLoginInput(updates.username);
    if (!safeUsername) {
      throw new Error('Username may only contain letters, numbers, dots, dashes and underscores (max 32 characters).');
    }
    safeUpdates.username = safeUsername;
  }
  if (updates.full_name !== undefined) {
    if (typeof updates.full_name !== 'string' || !updates.full_name.trim()) {
      throw new Error('Full name is required.');
    }
    safeUpdates.full_name = updates.full_name.trim();
  }

  const { data, error } = await supabase
    .from('portal_users')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
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

/* ── Reset student account password (bcrypt-hashed before upsert) ── */
export async function resetStudentPassword(student_number, newPassword) {
  const pwCheck = validatePasswordPolicy(newPassword);
  if (!pwCheck.ok) throw new Error(pwCheck.error);

  const hashed = bcrypt.hashSync(newPassword, 10);
  const { error } = await supabase
    .from('student_accounts')
    .upsert({ student_number, password: hashed }, { onConflict: 'student_number' });
  if (error) throw error;
}

/* ── Avatar color from string ── */
export function accountAvatarColor(str) {
  let h = 0;
  for (const c of (str || '')) h = c.charCodeAt(0) + ((h << 5) - h);
  const colors = ['#002280','#7c3aed','#10813f','#C8102E','#C8960C','#0891b2'];
  return colors[Math.abs(h) % colors.length];
}