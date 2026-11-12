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
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        ),
      },
      {
        label: 'History',
        route: '/dashboard/history',
        activeKey: 'history',
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3a9 9 0 10-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 117 7v-2a5 5 0 10-5-5v1.17l1.59-1.58L11 13l-4 4-4-4 1.41-1.41L6 13.17V12A9 9 0 0113 3z"/>
            <path d="M12 8v5l3 3-1.5 1.5-3.5-3.5V8H12z"/>
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
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4h7v7H4V4zm0 9h7v7H4v-7zm9-9h7v7h-7V4zm0 9h7v7h-7v-7z"/>
          </svg>
        ),
      },
      {
        label: 'Announce',
        tab: 'announcements',
        role: 'Admin',
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            <path d="M7 9h10v2H7zm0 4h7v2H7z"/>
          </svg>
        ),
      },
      {
        label: 'Students',
        tab: 'students',
        role: 'Admin',
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
        ),
      },
      {
        label: 'Accounts',
        tab: 'accounts',
        role: 'Admin',
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            <path d="M20 8h2v2h-2zM20 12h2v2h-2z"/>
          </svg>
        ),
      },
      {
        label: 'Governance',
        tab: 'governance',
        role: 'Admin',
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12V11c0 4.52-3.08 8.74-7 9.93-3.92-1.19-7-5.41-7-9.93V6.3l7-3.12z"/>
            <path d="M11 13h2v2h-2zm0-6h2v5h-2z"/>
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
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
    ),
  },
  {
    label: 'Systems',
    tab: 'admin',
    role: 'Admin',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 4h7v7H4V4zm0 9h7v7H4v-7zm9-9h7v7h-7V4zm0 9h7v7h-7v-7z"/>
      </svg>
    ),
  },
  {
    label: 'Announce',
    tab: 'announcements',
    role: 'Admin',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12zM7 9h10v2H7zm0 4h7v2H7z"/>
      </svg>
    ),
  },
  {
    label: 'Students',
    tab: 'students',
    role: 'Admin',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    ),
  },
  {
    label: 'History',
    route: '/dashboard/history',
    activeKey: 'history',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 3a9 9 0 10-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 117 7v-2a5 5 0 10-5-5v1.17l1.59-1.58L11 13l-4 4-4-4 1.41-1.41L6 13.17V12A9 9 0 0113 3zM12 8v5l3 3-1.5 1.5-3.5-3.5V8H12z"/>
      </svg>
    ),
  },
  {
    label: 'Governance',
    tab: 'governance',
    role: 'Admin',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99L7 9.5l1.41-1.41L12 11.17l3.59-3.58L17 9l-5 5z"/>
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
