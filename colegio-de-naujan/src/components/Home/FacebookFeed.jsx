import { useEffect, useState, useRef } from 'react';

const FB_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.931-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const PAGES = [
  {
    id: 'main',
    label: 'Colegio De Naujan',
    short: 'CDN Official',
    url: 'https://www.facebook.com/colegiodenaujan',
    color: '#002280',
  },
  {
    id: 'bsis',
    label: 'BSIS Department',
    short: 'BSIS CDN',
    url: 'https://www.facebook.com/BSIS.CDN',
    color: '#C8102E',
  },
  {
    id: 'eportal',
    label: 'CDN E-Portal',
    short: 'E-Portal',
    url: 'https://www.facebook.com/profile.php?id=61556215947706',
    color: '#1877F2',
  },
];

function FbEmbed({ url, active }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!active) return;
    // Give the DOM a tick to mount, then parse
    const timer = setTimeout(() => {
      if (window.FB && ref.current) {
        window.FB.XFBML.parse(ref.current);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [active, url]);

  return (
    <div ref={ref} className="w-full flex justify-center">
      <div
        className="fb-page"
        data-href={url}
        data-tabs="timeline,events"
        data-width="600"
        data-height="650"
        data-small-header="false"
        data-adapt-container-width="true"
        data-hide-cover="false"
        data-show-facepile="false"
      />
    </div>
  );
}

export default function FacebookFeed() {
  const [active, setActive] = useState(0);
  const sdkLoaded = useRef(false);

  // Load Facebook JS SDK once
  useEffect(() => {
    if (sdkLoaded.current) return;
    sdkLoaded.current = true;

    window.fbAsyncInit = function () {
      window.FB.init({ xfbml: true, version: 'v19.0' });
    };

    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const current = PAGES[active];

  return (
    <section
      className="w-full py-16 scroll-animate"
      style={{ background: '#f4f6fb' }}
    >
      <div id="fb-root" />
      <div className="cdn-container">

        {/* ── Section header ── */}
        <div className="flex flex-col gap-2 mb-10">
          <div
            className="inline-flex items-center gap-2 w-fit px-3.5 py-1.5 rounded text-[0.68rem] font-extrabold uppercase tracking-[2px]"
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              color: '#6b7280',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <span style={{ color: '#1877F2' }}>{FB_ICON}</span>
            Latest from Facebook
          </div>

          <h2
            className="font-black m-0"
            style={{ fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', letterSpacing: '-1px', color: '#0F1422' }}
          >
            Stay Updated with{' '}
            <span style={{ color: '#002280' }}>CDN Events</span>
          </h2>
          <p style={{ color: '#4E5873', lineHeight: 1.7, maxWidth: 560, margin: 0 }}>
            Browse the latest posts and events from all our official Facebook pages.
            Switch between pages using the tabs below.
          </p>
        </div>

        {/* ── Tab bar ── */}
        <div
          className="flex flex-wrap gap-2 mb-8 p-1 rounded-xl w-fit"
          style={{ background: '#e9ecf4' }}
          role="tablist"
          aria-label="Facebook pages"
        >
          {PAGES.map((page, i) => {
            const isActive = active === i;
            return (
              <button
                key={page.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(i)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all"
                style={{
                  fontSize: '0.8rem',
                  background: isActive ? '#fff' : 'transparent',
                  color: isActive ? page.color : '#6b7280',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  letterSpacing: '0.2px',
                }}
              >
                <span style={{ color: isActive ? page.color : '#9ca3af' }}>
                  {FB_ICON}
                </span>
                {page.short}
              </button>
            );
          })}
        </div>

        {/* ── Content area ── */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Feed panel */}
          <div
            className="w-full lg:flex-1 rounded-2xl overflow-hidden"
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 24px rgba(0,34,128,0.07)',
              minHeight: 680,
            }}
          >
            {/* Panel header */}
            <div
              className="flex items-center gap-3 px-5 py-3.5"
              style={{
                borderBottom: '1px solid #f0f0f0',
                background: `linear-gradient(90deg, ${current.color}12 0%, transparent 100%)`,
              }}
            >
              <span style={{ color: current.color }}>{FB_ICON}</span>
              <span
                className="font-bold"
                style={{ fontSize: '0.85rem', color: '#0F1422' }}
              >
                {current.label}
              </span>
              <span
                className="ml-auto text-[0.7rem] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${current.color}18`, color: current.color }}
              >
                Live Feed
              </span>
            </div>

            {/* Embed — render all, show/hide via CSS to avoid re-mount flicker */}
            <div className="p-4">
              {PAGES.map((page, i) => (
                <div key={page.id} style={{ display: active === i ? 'block' : 'none' }}>
                  <FbEmbed url={page.url} active={active === i} />
                </div>
              ))}
            </div>
          </div>

          {/* Right column — follow cards */}
          <div className="flex flex-col gap-4 lg:w-64 w-full">
            <p
              className="font-extrabold uppercase m-0"
              style={{ fontSize: '0.68rem', letterSpacing: '1.5px', color: '#6b7280' }}
            >
              Our Pages
            </p>

            {PAGES.map((page, i) => {
              const isActive = active === i;
              return (
                <div
                  key={page.id}
                  className="rounded-xl p-4 flex flex-col gap-3 transition-all cursor-pointer"
                  style={{
                    background: '#fff',
                    border: `1.5px solid ${isActive ? page.color : '#e5e7eb'}`,
                    boxShadow: isActive
                      ? `0 4px 16px ${page.color}22`
                      : '0 1px 4px rgba(0,0,0,0.05)',
                  }}
                  onClick={() => setActive(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setActive(i)}
                  aria-label={`Switch to ${page.label}`}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: page.color }}>{FB_ICON}</span>
                    <span
                      className="font-bold"
                      style={{ fontSize: '0.85rem', color: '#0F1422', lineHeight: 1.3 }}
                    >
                      {page.label}
                    </span>
                  </div>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-center font-bold rounded-lg py-1.5 transition-colors"
                    style={{
                      fontSize: '0.75rem',
                      background: isActive ? page.color : '#f3f4f6',
                      color: isActive ? '#fff' : '#374151',
                      textDecoration: 'none',
                      display: 'block',
                    }}
                  >
                    Follow Page →
                  </a>
                </div>
              );
            })}

            {/* Ad blocker note */}
            <p style={{ fontSize: '0.7rem', color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>
              * Feeds are powered by the Facebook Page Plugin. If a feed doesn't load,
              you may have an ad blocker active — use the follow links above to visit the pages directly.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
