import { useState, useEffect, useRef } from 'react';
import cdnLogo   from '../../assets/images/logo.png';
import bagongLogo from '../../assets/images/bagong-pilipinas-seeklogo.png';
import '../../styles/dashboard.css';
import { recordLogoutSession, recordSystemVisit } from '../../lib/auth';



const PAGEVIEW_KEY  = 'cdn_pageviews';
const ANALYTICS_KEY = 'cdn_analytics';

const getAnalytics = () => {
  try { return JSON.parse(localStorage.getItem(ANALYTICS_KEY)) || {}; }
  catch { return {}; }
};

const recordVisit = (id, label) => {
  const a = getAnalytics();
  a[id] = (a[id] || 0) + 1;
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(a));
  const views = (() => { try { return JSON.parse(localStorage.getItem(PAGEVIEW_KEY)) || []; } catch { return []; } })();
  views.unshift({ id, label, ts: Date.now() });
  localStorage.setItem(PAGEVIEW_KEY, JSON.stringify(views.slice(0, 200)));
};

const SERVICES = [
  {
    id: 'csc', label: 'Student Fines', sub: 'Check and settle your outstanding fines',
    url: 'https://student-fines-hub-vf9z.vercel.app/', color: '#002280', bg: '#eef1fb',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4M7 8h10M7 12h6"/></svg>,
  },
  {
    id: 'osas', label: 'OSAS Records', sub: 'View your conduct and violation records',
    url: 'https://osas-sys.duckdns.org/', color: '#C8102E', bg: '#fdf0f2',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  },
  {
    id: 'admission', label: 'Admissions', sub: 'Online enrollment and admission portal',
    url: 'https://ecnesis.duckdns.org/', color: '#C8960C', bg: '#fdf8ec',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  },
];

const timeAgo = (ts) => {
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60)    return d + 's ago';
  if (d < 3600)  return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const getDayDate = () =>
  new Date().toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });

/* ── NAV ITEMS ── */
const NAV = [
  { key: 'home',    label: 'Home',    icon: (active) => active
      ? <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
      : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { key: 'history', label: 'History', icon: (active) =>
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.5' : '2'}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { key: 'portal',  label: 'Portal',  fab: true,
    icon: () => <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> },
  { key: 'alerts',  label: 'Alerts',  icon: () =>
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> },
  { key: 'account', label: 'Account', icon: (active) =>
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.5' : '2'}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

export default function StudentDashboard({ user, onLogout }) {
  const [tab,          setTab]          = useState('home');
  const [analytics,    setAnalytics]    = useState(getAnalytics);
  const [recentVisits, setRecentVisits] = useState([]);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [chatOpen,     setChatOpen]     = useState(false);
  const [chatInput,    setChatInput]    = useState('');
  const [chatMessages, setChatMessages] = useState([
    { from: 'bot', text: 'Hi! I\'m the CDN Portal Assistant. How can I help you today?' },
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatOpen]);

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages(m => [...m, { from: 'user', text }]);
    setChatInput('');
    const lower = text.toLowerCase();
    let reply = 'I\'m not sure about that. Try asking about fines, OSAS, or admissions.';
    if (lower.includes('fine') || lower.includes('csc'))           reply = 'You can check your fines at the Student Fines portal. Tap the Student Fines card on the Home tab.';
    else if (lower.includes('osas') || lower.includes('viol'))     reply = 'OSAS handles conduct records. Tap the OSAS Records card on the Home tab.';
    else if (lower.includes('admiss') || lower.includes('enroll')) reply = 'For admissions, tap the Admissions card on the Home tab to access ECNESIS.';
    else if (lower.includes('login') || lower.includes('pass'))    reply = 'Use your student number as username and your last name (or registered password) to sign in.';
    else if (lower.includes('help') || lower.includes('how'))      reply = 'You can access all CDN services from the Home tab. Tap any service card to open it.';
    setTimeout(() => setChatMessages(m => [...m, { from: 'bot', text: reply }]), 600);
  };

  useEffect(() => {
    try { setRecentVisits(JSON.parse(localStorage.getItem(PAGEVIEW_KEY)) || []); }
    catch { setRecentVisits([]); }
  }, []);

  const handleOpen = (svc) => {
    // Write to localStorage (local history)
    recordVisit(svc.id, svc.label);
    setAnalytics(getAnalytics());
    const views = (() => { try { return JSON.parse(localStorage.getItem(PAGEVIEW_KEY)) || []; } catch { return []; } })();
    setRecentVisits(views);
    // Write to Supabase → triggers Activity tab realtime update in admin dashboard
    recordSystemVisit(svc.id, svc.label, user?.username ?? user?.studentNumber ?? null);
    window.open(svc.url, '_blank', 'noopener,noreferrer');
  };


  const handleLogout = async () => {
    const sessionId = localStorage.getItem('cdn_session');
    await recordLogoutSession(sessionId);
    localStorage.removeItem('cdn_user');
    localStorage.removeItem('cdn_session');
    onLogout();
  };


  const handleNav = (key) => {
    if (key === 'portal') { setTab('home'); return; }
    setTab(key);
  };

  const initial   = user?.name?.charAt(0).toUpperCase() ?? 'S';
  const firstName = user?.name?.split(' ')[0] ?? 'Student';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ══════════ TOPBAR ══════════ */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <img src={cdnLogo} alt="CDN" className="w-8 h-8 object-contain" />
            <div className="leading-tight">
              <p className="text-xs font-black text-[#002280]">CDN</p>
              <p className="text-[10px] font-semibold text-gray-400 -mt-0.5">Student Portal</p>
            </div>
          </div>

          {/* Date — shown on md+ */}
          <p className="hidden md:block text-xs font-medium text-gray-400 flex-1 text-center">{getDayDate()}</p>

          {/* Right: avatar */}
          <button
            onClick={() => setTab('account')}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#002280] to-[#0044cc] text-white font-black text-sm flex items-center justify-center shadow-md flex-shrink-0"
          >
            {initial}
          </button>
        </div>
      </header>

      {/* ══════════ BODY ══════════ */}
      <div className="flex flex-1 max-w-screen-xl mx-auto w-full">

        {/* ── SIDEBAR NAV (desktop only) ── */}
        <aside className="hidden md:flex flex-col w-52 flex-shrink-0 sticky top-14 h-[calc(100vh-56px)] bg-white border-r border-gray-100 py-6 px-3 gap-1 overflow-y-auto">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 mb-2">Navigation</p>
          {NAV.filter(n => !n.fab).map(n => (
            <button
              key={n.key}
              onClick={() => handleNav(n.key)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-all text-left w-full
                ${tab === n.key
                  ? 'bg-[#002280] text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
            >
              <span className="flex-shrink-0">{n.icon(tab === n.key)}</span>
              {n.label}
            </button>
          ))}

          {/* Sidebar sign out */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-[#C8102E] hover:bg-red-50 transition-colors w-full"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 px-4 md:px-8 py-6 pb-28 md:pb-10 flex flex-col gap-5">

          {/* ══ HOME TAB ══ */}
          {tab === 'home' && (
            <>
              {/* Welcome hero */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#002280] to-[#0044cc] shadow-lg shadow-[#002280]/20 p-6 md:p-8">
                <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-xs font-semibold mb-1">{getGreeting()}</p>
                    <h1 className="text-white text-2xl md:text-3xl font-black leading-tight">{firstName}!</h1>
                    <p className="text-white/60 text-sm mt-1 hidden md:block">Welcome to CDN Student Portal</p>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="bg-white/15 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                        {user?.course ?? 'CDN Student'}
                      </span>
                      {user?.yearLevel && (
                        <span className="bg-white/10 text-white/80 text-[10px] font-semibold px-3 py-1 rounded-full">
                          Year {user.yearLevel}
                        </span>
                      )}
                      <span className="bg-white/10 text-white/60 text-[10px] font-semibold px-3 py-1 rounded-full hidden md:inline-block">
                        AY 2026–2027
                      </span>
                    </div>
                  </div>
                  <img src={bagongLogo} alt="" className="w-16 h-16 md:w-24 md:h-24 object-contain opacity-60 flex-shrink-0" />
                </div>
              </div>

              {/* Section label */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">My Services</p>

              {/* 3 SERVICE CARDS — stacked on mobile, grid on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SERVICES.map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => handleOpen(svc)}
                    className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex md:flex-col items-center md:items-start gap-4 text-left hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all group"
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: svc.bg, color: svc.color }}>
                      <span className="w-7 h-7 [&>svg]:w-full [&>svg]:h-full">{svc.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0 md:w-full">
                      <p className="font-black text-gray-900 text-sm md:text-base">{svc.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">{svc.sub}</p>
                      {analytics[svc.id] > 0 && (
                        <p className="text-[10px] font-bold mt-2" style={{ color: svc.color }}>
                          {analytics[svc.id]} visit{analytics[svc.id] !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    {/* Arrow — right on mobile, bottom-right on desktop */}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 md:self-end ml-auto" style={{ background: svc.bg, color: svc.color }}>
                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </button>
                ))}
              </div>

              {/* Recent activity preview */}
              {recentVisits.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Activity</p>
                    <button onClick={() => setTab('history')} className="text-[10px] font-bold text-[#002280] hover:underline">See all</button>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {recentVisits.slice(0, 3).map((v, i) => {
                      const svc = SERVICES.find(s => s.id === v.id);
                      return (
                        <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < Math.min(recentVisits.length, 3) - 1 ? 'border-b border-gray-50' : ''}`}>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: svc?.color ?? '#9ca3af' }} />
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: svc?.bg ?? '#f3f4f6', color: svc?.color ?? '#6b7280' }}>
                            <span className="w-4 h-4 [&>svg]:w-full [&>svg]:h-full">{svc?.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{v.label}</p>
                          </div>
                          <span className="text-[10px] font-semibold text-gray-400 flex-shrink-0">{timeAgo(v.ts)}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* ══ HISTORY TAB ══ */}
          {tab === 'history' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-base font-black text-gray-900">Visit History</p>
                {recentVisits.length > 0 && (
                  <button
                    onClick={() => { localStorage.removeItem(PAGEVIEW_KEY); setRecentVisits([]); }}
                    className="text-[10px] font-bold text-[#C8102E] bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {recentVisits.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-3 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-gray-500">No visits yet</p>
                  <p className="text-xs text-gray-400">Your service visits will appear here.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {recentVisits.map((v, i) => {
                    const svc = SERVICES.find(s => s.id === v.id);
                    return (
                      <div key={i} className={`flex items-center gap-3 px-5 py-4 ${i < recentVisits.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50 transition-colors`}>
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: svc?.color ?? '#9ca3af' }} />
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: svc?.bg ?? '#f3f4f6', color: svc?.color ?? '#6b7280' }}>
                          <span className="w-5 h-5 [&>svg]:w-full [&>svg]:h-full">{svc?.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">{v.label}</p>
                          <p className="text-xs text-gray-400">{new Date(v.ts).toLocaleDateString('en-PH', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ color: svc?.color ?? '#6b7280', background: svc?.bg ?? '#f3f4f6' }}>
                          {timeAgo(v.ts)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ══ ACCOUNT TAB ══ */}
          {tab === 'account' && (
            <>
              {/* Profile hero */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#002280] to-[#0044cc] shadow-lg shadow-[#002280]/20 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5">
                <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center text-white text-4xl font-black shadow-lg flex-shrink-0">
                  {initial}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">{user?.name ?? 'Student'}</h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="bg-white/15 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Student</span>
                    {user?.course && <span className="bg-white/10 text-white/80 text-[10px] font-semibold px-3 py-1 rounded-full">{user.course}</span>}
                  </div>
                </div>
                <img src={bagongLogo} alt="" className="absolute bottom-4 right-5 w-10 h-10 object-contain opacity-20" />
              </div>

              {/* Info + Quick access — 2 col on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Student info */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 pt-4 pb-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Information</p>
                  </div>
                  {[
                    { label: 'Full Name',      value: user?.name ?? '—',            color: '#002280', bg: '#eef1fb',
                      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                    { label: 'Student Number', value: user?.studentNumber ?? '—',   color: '#7c3aed', bg: '#f5f0ff',
                      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
                    { label: 'Course',         value: user?.course ?? '—',          color: '#C8960C', bg: '#fdf8ec',
                      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
                    { label: 'Year Level',     value: user?.yearLevel ? `Year ${user.yearLevel}` : '—', color: '#10813f', bg: '#edf7f1',
                      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> },
                    { label: 'Status',         value: user?.enrollmentStatus ? user.enrollmentStatus.charAt(0).toUpperCase() + user.enrollmentStatus.slice(1) : 'Enrolled', color: '#0891b2', bg: '#ecf8fb',
                      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> },
                    { label: 'Academic Year',  value: 'AY 2026 – 2027',             color: '#374151', bg: '#f3f4f6',
                      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                  ].map((row, i, arr) => (
                    <div key={row.label} className={`flex items-center gap-3.5 px-5 py-3.5 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: row.bg, color: row.color }}>
                        <span className="w-[18px] h-[18px] [&>svg]:w-full [&>svg]:h-full">{row.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{row.label}</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick access + sign out */}
                <div className="flex flex-col gap-5">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 pt-4 pb-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quick Access</p>
                    </div>
                    {SERVICES.map((svc, i) => (
                      <button
                        key={svc.id}
                        onClick={() => handleOpen(svc)}
                        className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors ${i < SERVICES.length - 1 ? 'border-b border-gray-50' : ''}`}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: svc.bg, color: svc.color }}>
                          <span className="w-[18px] h-[18px] [&>svg]:w-full [&>svg]:h-full">{svc.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">{svc.label}</p>
                          <p className="text-xs text-gray-400">{analytics[svc.id] || 0} visits</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </button>
                    ))}
                  </div>

                  {/* Sign out */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setShowConfirm(true)}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-red-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-[18px] h-[18px] text-[#C8102E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#C8102E]">Sign Out</p>
                        <p className="text-xs text-gray-400">Return to the main site</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

        </main>
      </div>

      {/* ══════════ BOTTOM NAV (mobile only) ══════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-end h-16">
          {NAV.map(n => {
            if (n.fab) return (
              <button key={n.key} onClick={() => handleNav(n.key)} className="flex-1 flex flex-col items-center justify-end pb-3 -mt-5">
                <div className="w-14 h-14 rounded-2xl bg-[#002280] shadow-lg shadow-[#002280]/40 flex items-center justify-center">
                  {n.icon()}
                </div>
                <span className="text-[10px] font-semibold text-gray-400 mt-0.5">{n.label}</span>
              </button>
            );
            const active = tab === n.key;
            return (
              <button key={n.key} onClick={() => handleNav(n.key)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors ${active ? 'text-[#002280]' : 'text-gray-400 hover:text-[#002280]'}`}>
                {n.icon(active)}
                <span className={`text-[10px] ${active ? 'font-black' : 'font-semibold'}`}>{n.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ══════════ CHATBOT FAB — PC only ══════════ */}
      {!chatOpen && (
        <button className="db-chat-fab" onClick={() => setChatOpen(true)} aria-label="Open CDN Assistant">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            <path d="M8 10h8M8 14h5"/>
          </svg>
          <span className="db-chat-fab-label">Ask CDN</span>
        </button>
      )}

      {/* ══════════ CHATBOT MODAL ══════════ */}
      {chatOpen && (
        <div className="db-chat-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setChatOpen(false); }}>
          <div className="db-chat-panel" role="dialog" aria-label="CDN Portal Assistant">
            <div className="db-chat-header">
              <div className="db-chat-header-left">
                <div className="db-chat-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <div>
                  <p className="db-chat-title">CDN Assistant</p>
                  <p className="db-chat-status"><span className="db-chat-online" />Online</p>
                </div>
              </div>
              <button className="db-chat-close" onClick={() => setChatOpen(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="db-chat-prompts">
              {['Check fines', 'OSAS records', 'Admission info', 'Login help'].map(p => (
                <button key={p} className="db-chat-prompt" onClick={() => setChatInput(p)}>{p}</button>
              ))}
            </div>
            <div className="db-chat-messages">
              {chatMessages.map((msg, i) => (
                <div key={i} className={'db-chat-msg db-chat-msg--' + msg.from}>
                  {msg.from === 'bot' && (
                    <div className="db-chat-msg-avatar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                    </div>
                  )}
                  <div className="db-chat-bubble">{msg.text}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form className="db-chat-input-row" onSubmit={(e) => { e.preventDefault(); sendChat(); }}>
              <input type="text" className="db-chat-input"
                placeholder="Ask about fines, OSAS, admissions..."
                value={chatInput} onChange={(e) => setChatInput(e.target.value)} autoFocus />
              <button type="submit" className="db-chat-send" aria-label="Send">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ SIGN OUT MODAL ══════════ */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#C8102E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <h3 className="text-base font-black text-gray-900 text-center mb-1">Sign out?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">You'll be returned to the main site.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleLogout}
                className="flex-1 py-3 rounded-xl bg-[#C8102E] text-white text-sm font-bold hover:bg-[#a00c24] transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
