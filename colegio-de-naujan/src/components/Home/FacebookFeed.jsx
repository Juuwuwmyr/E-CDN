import { useEffect, useState, useRef, useCallback } from 'react';

const FB_ICON = (size = 14) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.931-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const PAGES = [
  {
    id: 'main',
    label: 'Colegio De Naujan',
    short: 'CDN Official',
    description: 'Main school announcements & news',
    url: 'https://www.facebook.com/colegiodenaujan',
    color: '#002280',
    bg: '#EEF2FF',
  },
  {
    id: 'bsis',
    label: 'BSIS Department',
    short: 'BSIS CDN',
    description: 'Bachelor of Science in Info Systems',
    url: 'https://www.facebook.com/BSIS.CDN',
    color: '#C8102E',
    bg: '#FFF1F2',
  },
  {
    id: 'eportal',
    label: 'CDN E-Portal',
    short: 'E-Portal',
    description: 'E-Portal updates & student news',
    url: 'https://www.facebook.com/profile.php?id=61556215947706',
    color: '#1877F2',
    bg: '#EFF6FF',
  },
];

/* Measures the container and returns a pixel width capped to 560 */
function useContainerWidth(ref) {
  const [width, setWidth] = useState(500);

  useEffect(() => {
    const measure = () => {
      if (ref.current) {
        // subtract card padding (2 × 20px)
        const w = Math.min(ref.current.offsetWidth - 40, 560);
        setWidth(Math.max(w, 180)); // never below 180
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);

  return width;
}

function FbEmbed({ url, active, containerWidth }) {
  const ref = useRef(null);

  const parse = useCallback(() => {
    if (window.FB && ref.current) window.FB.XFBML.parse(ref.current);
  }, []);

  // Re-parse when tab becomes visible or width changes
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(parse, 150);
    return () => clearTimeout(t);
  }, [active, containerWidth, parse]);

  return (
    <div ref={ref} className="w-full flex justify-center overflow-hidden">
      <div
        className="fb-page"
        data-href={url}
        data-tabs="timeline,events"
        data-width={String(containerWidth)}
        data-height="620"
        data-small-header="true"
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
  const feedCardRef = useRef(null);
  const containerWidth = useContainerWidth(feedCardRef);

  useEffect(() => {
    if (sdkLoaded.current) return;
    sdkLoaded.current = true;
    window.fbAsyncInit = function () {
      window.FB.init({ xfbml: true, version: 'v19.0' });
    };
    if (!document.getElementById('facebook-jssdk')) {
      const s = document.createElement('script');
      s.id = 'facebook-jssdk';
      s.src = 'https://connect.facebook.net/en_US/sdk.js';
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
    }
  }, []);

  const current = PAGES[active];

  return (
    <section
      className="w-full section-py relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #f4f6fb 0%, #eef1f8 100%)' }}
    >
      <div id="fb-root" />

      {/* Background dot grid */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,34,128,0.035) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Colour blobs — hidden on mobile to keep it clean */}
      <div aria-hidden="true" className="hidden sm:block absolute top-0 right-0 pointer-events-none"
        style={{ width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,34,128,0.06) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
      <div aria-hidden="true" className="hidden sm:block absolute bottom-0 left-0 pointer-events-none"
        style={{ width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,16,46,0.05) 0%, transparent 70%)', transform: 'translate(-30%,30%)' }} />

      <div className="cdn-container relative z-10">

        {/* ── Section header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div className="flex flex-col gap-3">
            <div
              className="inline-flex items-center gap-2 w-fit px-3.5 py-1.5 rounded-md text-[0.68rem] font-extrabold uppercase tracking-[2px]"
              style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#6b7280', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              <span style={{ color: '#1877F2' }}>{FB_ICON(12)}</span>
              Live from Facebook
            </div>
            <h2 className="section-heading m-0">
              Latest <span className="h-blue">News</span> &amp;{' '}
              <span className="h-red">Events</span>
            </h2>
            <p className="section-sub m-0">
              Stay in the loop with announcements, activities, and updates
              from all our official Facebook pages.
            </p>
          </div>

          {/* Desktop pill switcher */}
          <div
            className="hidden lg:flex items-center gap-1 p-1 rounded-xl flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #e5e7eb', backdropFilter: 'blur(8px)' }}
            role="tablist"
          >
            {PAGES.map((page, i) => {
              const isActive = active === i;
              return (
                <button
                  key={page.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(i)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all duration-200"
                  style={{
                    fontSize: '0.78rem',
                    background: isActive ? page.color : 'transparent',
                    color: isActive ? '#fff' : '#6b7280',
                    boxShadow: isActive ? `0 3px 12px ${page.color}44` : 'none',
                    border: 'none', cursor: 'pointer',
                    letterSpacing: '0.2px', whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ opacity: isActive ? 1 : 0.6 }}>{FB_ICON(12)}</span>
                  {page.short}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Mobile tab bar ── */}
        <div
          className="flex lg:hidden gap-2 mb-5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          role="tablist"
        >
          {PAGES.map((page, i) => {
            const isActive = active === i;
            return (
              <button
                key={page.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(i)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold flex-shrink-0 transition-all duration-200"
                style={{
                  fontSize: '0.75rem',
                  background: isActive ? page.color : '#fff',
                  color: isActive ? '#fff' : '#6b7280',
                  border: `1.5px solid ${isActive ? page.color : '#e5e7eb'}`,
                  boxShadow: isActive ? `0 3px 12px ${page.color}33` : 'none',
                  cursor: 'pointer',
                }}
              >
                <span style={{ opacity: isActive ? 1 : 0.5 }}>{FB_ICON(11)}</span>
                {page.short}
              </button>
            );
          })}
        </div>

        {/* ── Main layout ── */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* ── Feed card ── */}
          <div
            ref={feedCardRef}
            className="w-full lg:flex-1 rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 8px 40px rgba(0,34,128,0.09)',
            }}
          >
            {/* Coloured header bar */}
            <div
              className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4"
              style={{ background: `linear-gradient(135deg, ${current.color} 0%, ${current.color}cc 100%)` }}
            >
              <div className="flex gap-1 sm:gap-1.5">
                {[0,1,2].map(n => (
                  <span key={n} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.35)' }} />
                ))}
              </div>
              <div className="flex items-center gap-2 ml-1 sm:ml-2 min-w-0">
                <span style={{ color: '#fff', opacity: 0.9, flexShrink: 0 }}>{FB_ICON(13)}</span>
                <span className="font-bold text-white truncate" style={{ fontSize: '0.82rem' }}>
                  {current.label}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.18)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"
                  style={{ animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#fff', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Live
                </span>
              </div>
            </div>

            {/* Embed */}
            <div className="p-3 sm:p-5 flex-1 overflow-hidden" style={{ minHeight: 500 }}>
              {PAGES.map((page, i) => (
                <div key={page.id} style={{ display: active === i ? 'block' : 'none' }}>
                  <FbEmbed url={page.url} active={active === i} containerWidth={containerWidth} />
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 flex-wrap gap-2"
              style={{ borderTop: '1px solid #f0f0f0', background: '#fafafa' }}
            >
              <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
                Powered by Facebook Page Plugin
              </span>
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-bold"
                style={{ fontSize: '0.75rem', color: current.color, textDecoration: 'none' }}
              >
                Open in Facebook
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </div>
          </div>

          {/* ── Sidebar — stacks below on mobile, aside on desktop ── */}
          <div className="w-full lg:w-72 flex flex-col gap-3 sm:gap-4">

            {/* Mobile: compact horizontal chips / Desktop: full cards */}
            <div className="flex lg:flex-col gap-2 lg:gap-3 overflow-x-auto pb-1 lg:overflow-visible lg:pb-0"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              {PAGES.map((page, i) => {
                const isActive = active === i;
                return (
                  /* ── Mobile: slim chip row ── Desktop: full card ── */
                  <div
                    key={page.id}
                    onClick={() => setActive(i)}
                    onKeyDown={e => e.key === 'Enter' && setActive(i)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Switch to ${page.label}`}
                    className="cursor-pointer transition-all duration-200 flex-shrink-0 lg:flex-shrink"
                    style={{
                      /* mobile chip */
                      borderRadius: 14,
                      background: isActive ? page.color : '#fff',
                      border: `1.5px solid ${isActive ? page.color : '#e5e7eb'}`,
                      boxShadow: isActive ? `0 4px 16px ${page.color}33` : '0 1px 4px rgba(0,0,0,0.05)',
                    }}
                  >
                    {/* ── Mobile chip (lg:hidden) ── */}
                    <div className="flex lg:hidden items-center gap-2 px-3 py-2">
                      <span style={{ color: isActive ? '#fff' : page.color, opacity: isActive ? 1 : 0.7 }}>
                        {FB_ICON(13)}
                      </span>
                      <span className="font-bold whitespace-nowrap"
                        style={{ fontSize: '0.78rem', color: isActive ? '#fff' : '#374151' }}>
                        {page.short}
                      </span>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="ml-2 flex items-center gap-1 font-bold rounded-lg px-2.5 py-1 flex-shrink-0"
                        style={{
                          fontSize: '0.68rem',
                          background: isActive ? 'rgba(255,255,255,0.2)' : page.bg,
                          color: isActive ? '#fff' : page.color,
                          border: isActive ? '1px solid rgba(255,255,255,0.3)' : `1px solid ${page.color}22`,
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {FB_ICON(10)}
                        Follow
                      </a>
                    </div>

                    {/* ── Desktop full card (hidden on mobile) ── */}
                    <div className="hidden lg:flex flex-col gap-3 p-5"
                      style={{ transform: isActive ? 'translateY(-2px)' : 'translateY(0)' }}>
                      <div className="flex items-start gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: isActive ? 'rgba(255,255,255,0.2)' : page.bg }}
                        >
                          <span style={{ color: isActive ? '#fff' : page.color }}>{FB_ICON(15)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-bold leading-tight truncate"
                            style={{ fontSize: '0.85rem', color: isActive ? '#fff' : '#0F1422' }}>
                            {page.label}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: isActive ? 'rgba(255,255,255,0.75)' : '#9ca3af' }}>
                            {page.description}
                          </span>
                        </div>
                        {isActive && (
                          <span className="ml-auto px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                            style={{ fontSize: '0.58rem', background: 'rgba(255,255,255,0.2)', color: '#fff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Viewing
                          </span>
                        )}
                      </div>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center justify-center gap-2 font-bold rounded-xl py-2 transition-all"
                        style={{
                          fontSize: '0.75rem',
                          background: isActive ? 'rgba(255,255,255,0.18)' : page.bg,
                          color: isActive ? '#fff' : page.color,
                          border: isActive ? '1px solid rgba(255,255,255,0.25)' : `1px solid ${page.color}33`,
                          textDecoration: 'none',
                        }}
                      >
                        {FB_ICON(11)}
                        Follow Page
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ad blocker note */}
            <div className="rounded-xl p-3 sm:p-4 flex gap-3"
              style={{ background: '#fff', border: '1px solid #f0f0f0' }}>
              <svg className="flex-shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style={{ fontSize: '0.7rem', color: '#9ca3af', lineHeight: 1.65, margin: 0 }}>
                Feed not showing? You may have an ad blocker active. Use the <strong>Follow Page</strong> buttons to visit us directly on Facebook.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
