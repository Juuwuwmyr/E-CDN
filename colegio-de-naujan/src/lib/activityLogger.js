/**
 * activityLogger.js
 * Writes activity logs to Supabase system_logs table.
 * Falls back to localStorage when Supabase is unavailable.
 */
import { supabase } from './supabase';

const LOCAL_KEY  = 'cdn_activity_logs_local';
const MAX_LOCAL  = 200;

/* ── Write a log entry ────────────────────────────────────── */
export async function logActivity(action, details = '', userId = 'Anonymous', status = 'success', module = 'Portal') {
  const entry = {
    user_id:    userId,
    action,
    details:    String(details),
    status,
    module,
    ip_address: null,
  };

  // Try Supabase first
  try {
    const { error } = await supabase.from('system_logs').insert(entry);
    if (error) throw error;
  } catch (_) {
    // Fallback: localStorage
    const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    local.unshift({ ...entry, id: Date.now(), created_at: new Date().toISOString() });
    if (local.length > MAX_LOCAL) local.splice(MAX_LOCAL);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
  }
}

/* ── Fetch logs from Supabase ─────────────────────────────── */
export async function getActivityLogs({ limit = 200, action = null, status = null, search = null } = {}) {
  try {
    let q = supabase
      .from('system_logs')
      .select('id,created_at,user_id,user_name,action,details,ip_address,status,module')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (action && action !== 'all') q = q.eq('action', action);
    if (status && status !== 'all') q = q.eq('status', status);
    if (search) q = q.or(`user_id.ilike.%${search}%,action.ilike.%${search}%,details.ilike.%${search}%`);

    const { data, error } = await q;
    if (error) throw error;

    // Also merge localStorage fallback entries
    const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return [...local, ...(data || [])].sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    ).slice(0, limit);
  } catch (_) {
    // Full fallback: localStorage only
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  }
}

/* ── Stats ────────────────────────────────────────────────── */
export async function getLogStats() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalRes, todayRes, failedRes] = await Promise.all([
      supabase.from('system_logs').select('*', { count: 'exact', head: true }),
      supabase.from('system_logs').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
      supabase.from('system_logs').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    ]);

    return {
      total:       totalRes.count  || 0,
      todayCount:  todayRes.count  || 0,
      failedCount: failedRes.count || 0,
    };
  } catch (_) {
    const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    const today = new Date().setHours(0, 0, 0, 0);
    return {
      total:       local.length,
      todayCount:  local.filter(l => new Date(l.created_at) >= today).length,
      failedCount: local.filter(l => l.status === 'failed').length,
    };
  }
}

/* ── Export CSV ───────────────────────────────────────────── */
export function exportLogsCSV(logs) {
  const headers = ['Timestamp', 'User', 'Action', 'Details', 'Status', 'Module'];
  const rows = logs.map(l => [
    new Date(l.created_at).toLocaleString('en-PH'),
    l.user_id || '',
    l.action || '',
    l.details || '',
    l.status || '',
    l.module  || '',
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: `CDN_SystemLogs_${new Date().toISOString().slice(0,10)}.csv`,
  });
  a.click();
}