/**
 * Shared Dashboard constants — single source of truth.
 * Import from here; never duplicate in individual pages.
 */

// ── Deployed systems ──────────────────────────────────────
export const SYSTEMS = [
  {
    id: 'csc',
    label: 'CSC Services',
    sub: 'Fines Management System',
    url: 'https://student-fines-hub-vf9z.vercel.app/',
    color: '#002280',
    bg: '#eef1fb',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4M7 8h10M7 12h6" />
      </svg>
    ),
  },
  {
    id: 'osas',
    label: 'OSAS Services',
    sub: 'Violation Tracking System',
    url: 'https://osas-sys.duckdns.org/',
    color: '#C8102E',
    bg: '#fdf0f2',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'admission',
    label: 'Admission Services',
    sub: 'Admissions Office Portal',
    url: 'https://ecnesis.duckdns.org/',
    color: '#C8960C',
    bg: '#fdf8ec',
    badge: 'New',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
];

// ── Hero banner slides ────────────────────────────────────
export const BANNERS = [
  {
    id: 0,
    tag: 'NEW SYSTEM',
    title: 'Admissions Portal',
    sub: 'Apply online — faster, paperless enrollment for AY 2026-2027.',
    cta: 'Apply Now',
    url: 'https://ecnesis.duckdns.org/',
    bg: 'linear-gradient(125deg,#002280 0%,#0044cc 100%)',
    accent: '#FFD700',
  },
  {
    id: 1,
    tag: 'CSC SERVICES',
    title: 'Fines Management',
    sub: 'View and settle your outstanding student fines online, anytime.',
    cta: 'Check Fines',
    url: 'https://student-fines-hub-vf9z.vercel.app/',
    bg: 'linear-gradient(125deg,#7c3aed 0%,#5b21b6 100%)',
    accent: '#fbbf24',
  },
  {
    id: 2,
    tag: 'OSAS',
    title: 'Violation Tracking',
    sub: 'Monitor and resolve student conduct records through OSAS.',
    cta: 'View Records',
    url: 'https://osas-sys.duckdns.org/',
    bg: 'linear-gradient(125deg,#C8102E 0%,#9b0921 100%)',
    accent: '#fde68a',
  },
];

// ── Sidebar nav groups (desktop only) ────────────────────
export const NAV_GROUPS = [
  {
    group: 'Portal',
    items: [
      {
        label: 'Home',
        tab: 'overview',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
      },
      {
        label: 'Activity',
        tab: 'activity',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        ),
      },
      {
        label: 'History',
        route: '/dashboard/history',
        activeKey: 'history',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      },
    ],
  },
  {
    group: 'Admin',
    role: 'Admin',
    items: [
      {
        label: 'Systems',
        tab: 'admin',
        role: 'Admin',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M17.5 14v6M14.5 17h6" />
          </svg>
        ),
      },
      {
        label: 'Announce',
        tab: 'announcements',
        role: 'Admin',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6z"/>
            <path d="M12 17V3"/>
            <path d="M5 10l7-7 7 7"/>
          </svg>
        ),
      },
      {
        label: 'Students',
        tab: 'students',
        role: 'Admin',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        ),
      },
      {
        label: 'Accounts',
        tab: 'accounts',
        role: 'Admin',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
          </svg>
        ),
      },
    ],
  },
];

// ── Sidebar / bottom-nav items (mobile only) ──────────────
// `role` restricts the item to users with that role.
export const NAV_ITEMS = [
  {
    label: 'Home',
    tab: 'overview',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Activity',
    tab: 'activity',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    label: 'Systems',
    tab: 'admin',
    role: 'Admin',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M17.5 14v6M14.5 17h6" />
      </svg>
    ),
  },
  {
    label: 'Announce',
    tab: 'announcements',
    role: 'Admin',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6z"/>
        <path d="M12 17V3"/>
        <path d="M5 10l7-7 7 7"/>
      </svg>
    ),
  },
  {
    label: 'Students',
    tab: 'students',
    role: 'Admin',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    label: 'History',
    route: '/dashboard/history',
    activeKey: 'history',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

// ── Profile dropdown items ────────────────────────────────
export const DROPDOWN_ITEMS = [

  {
    label: 'Settings',
    action: 'settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
  {
    label: 'Help',
    action: 'help',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

// ── Utility helpers ───────────────────────────────────────
export const getDayDate = () =>
  new Date().toLocaleDateString('en-PH', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

export const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export const fmt = (n) =>
  n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);

export const timeAgo = (ts) => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)    return diff + 's ago';
  if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
};
