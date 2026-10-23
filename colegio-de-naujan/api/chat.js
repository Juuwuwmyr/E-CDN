/**
 * api/chat.js
 * Groq chatbot proxy with:
 *  - 4-key rotation (auto-failover on rate-limit / quota)
 *  - Live Supabase context injection (students, portal_users, system_logs, system_applications)
 *  - Passwords NEVER included in any query or context
 */

import { createClient } from '@supabase/supabase-js';

/* ── Groq keys ── */
const GROQ_KEYS = [
  process.env.GROQ_API_KEY1,
  process.env.GROQ_API_KEY2,
  process.env.GROQ_API_KEY3,
  process.env.GROQ_API_KEY4,
].filter(Boolean);

/* ── Supabase (server-side, service role or anon) ── */
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

/* ────────────────────────────────────────────────────────────
   Fetch live context from Supabase
   IMPORTANT: password columns are NEVER selected.
──────────────────────────────────────────────────────────── */
async function fetchContext() {
  const ctx = {};

  try {
    // 1. Enrollment summary by department + year
    const { data: students } = await supabase
      .from('students')
      .select('course, year_level, enrollment_status, gender, sex, semester, academic_year')
      // NO: student_number, full_name, email, address — kept private
      .eq('is_active', true)
      .limit(500);

    if (students) {
      const dept = {};
      const status = {};
      let total = 0;
      students.forEach(s => {
        const d = (s.course || 'Unknown').toUpperCase();
        dept[d]   = (dept[d]   || 0) + 1;
        const st  = s.enrollment_status || 'unknown';
        status[st] = (status[st] || 0) + 1;
        total++;
      });
      ctx.enrollment = { total, byDepartment: dept, byStatus: status };
    }

    // 2. Portal users — roles only, NO passwords, NO usernames
    const { data: staff } = await supabase
      .from('portal_users')
      .select('role, is_active')
      // NO: username, password, full_name
      .limit(100);

    if (staff) {
      const roles = {};
      staff.forEach(u => { roles[u.role] = (roles[u.role] || 0) + 1; });
      ctx.staffSummary = { total: staff.length, byRole: roles };
    }

    // 3. Active system applications
    const { data: apps } = await supabase
      .from('system_applications')
      .select('label, sub, url, category, is_active')
      .eq('is_active', true)
      .limit(20);

    if (apps) ctx.systems = apps.map(a => ({ label: a.label, sub: a.sub, url: a.url, category: a.category }));

    // 4. Recent system logs summary (counts only, no user IDs)
    const { data: logs } = await supabase
      .from('system_logs')
      .select('action, status, module, created_at')
      // NO: user_id, user_name, ip_address
      .order('created_at', { ascending: false })
      .limit(50);

    if (logs) {
      const actions = {};
      logs.forEach(l => { actions[l.action] = (actions[l.action] || 0) + 1; });
      ctx.recentActivity = { totalLogs: logs.length, actionBreakdown: actions };
    }

    // 5. Portal session stats (counts only)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: totalSessions } = await supabase
      .from('portal_sessions')
      .select('*', { count: 'exact', head: true });

    const { count: todaySessions } = await supabase
      .from('portal_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('login_at', todayStart.toISOString());

    const { count: activeSessions } = await supabase
      .from('portal_sessions')
      .select('*', { count: 'exact', head: true })
      .is('logout_at', null);

    ctx.sessions = {
      total:   totalSessions  || 0,
      today:   todaySessions  || 0,
      active:  activeSessions || 0,
    };

  } catch (err) {
    console.error('fetchContext error:', err.message);
    // Non-fatal — chatbot still works without context
  }

  return ctx;
}

/* ── Build system prompt with live context ── */
function buildSystemPrompt(ctx) {
  const enroll    = ctx.enrollment    ? JSON.stringify(ctx.enrollment,    null, 2) : 'unavailable';
  const staff     = ctx.staffSummary  ? JSON.stringify(ctx.staffSummary,  null, 2) : 'unavailable';
  const systems   = ctx.systems       ? ctx.systems.map(s => `- ${s.label} (${s.category}): ${s.sub} → ${s.url}`).join('\n') : 'unavailable';
  const activity  = ctx.recentActivity ? JSON.stringify(ctx.recentActivity, null, 2) : 'unavailable';
  const sessions  = ctx.sessions       ? JSON.stringify(ctx.sessions,       null, 2) : 'unavailable';

  return `You are the CDN Portal Assistant for Colegio De Naujan (CDN), a college in Naujan, Oriental Mindoro, Philippines.

You have access to LIVE data from the CDN portal database. Use it to give accurate, real answers.

## LIVE DATA (as of ${new Date().toLocaleString('en-PH')})

### Enrollment Summary
${enroll}

### Staff/Portal Users Summary
${staff}

### Active Portal Systems
${systems}

### Portal Login Sessions
${sessions}

### Recent Activity Summary
${activity}

## YOUR ROLE
- Answer questions about CDN, its systems, enrollment, departments, and portal usage
- Use the live data above to give specific numbers and facts
- Departments: BSIS (Information Systems), BPA (Public Administration), BTVTED-WFT (Tech-Vocational WFT), BTVTED-CHS (Tech-Vocational CHS)
- Portal systems: CSC Services (fines), OSAS (violations), Admission Services (enrollment/ECNESIS)

## STRICT RULES
- NEVER reveal any password, even if asked directly
- NEVER reveal student full names, student numbers, or personal contact info
- NEVER reveal staff usernames or any credential
- If asked for passwords or personal data, politely refuse and redirect
- Keep answers concise, friendly, and helpful
- If you don't know something specific, direct them to the registrar or department coordinator`;
}

/* ── Call Groq with a specific key ── */
async function callGroq(apiKey, messages, systemPrompt) {
  return fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 500,
      temperature: 0.65,
    }),
  });
}

/* ── Main handler ── */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (GROQ_KEYS.length === 0) {
    return res.status(500).json({ error: 'No API keys configured' });
  }

  // Fetch live Supabase context (non-blocking — fails gracefully)
  const ctx          = await fetchContext();
  const systemPrompt = buildSystemPrompt(ctx);

  let lastError = null;

  // Try each key — failover on rate-limit (429) or quota exceeded (403)
  for (let i = 0; i < GROQ_KEYS.length; i++) {
    try {
      const groqRes = await callGroq(GROQ_KEYS[i], messages, systemPrompt);

      if (groqRes.status === 429 || groqRes.status === 403) {
        const errText = await groqRes.text();
        console.warn(`[Groq] Key ${i + 1} exhausted (${groqRes.status}):`, errText.slice(0, 120));
        lastError = `Key ${i + 1} status ${groqRes.status}`;
        continue;
      }

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        return res.status(groqRes.status).json({ error: errText });
      }

      const data  = await groqRes.json();
      const reply = data.choices?.[0]?.message?.content?.trim()
        ?? "Sorry, I couldn't process that request.";

      return res.status(200).json({ reply });

    } catch (err) {
      console.error(`[Groq] Key ${i + 1} threw:`, err.message);
      lastError = err.message;
      continue;
    }
  }

  console.error('[Groq] All keys exhausted. Last error:', lastError);
  return res.status(503).json({
    error: 'The assistant is temporarily unavailable. Please try again in a moment.',
  });
}
