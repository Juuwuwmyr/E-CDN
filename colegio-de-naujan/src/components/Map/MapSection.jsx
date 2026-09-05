const iconBg = { blue: 'rgba(0,34,128,0.08)', red: 'rgba(200,16,46,0.08)', gold: 'rgba(200,150,12,0.1)' };
const iconColor = { blue: '#002280', red: '#C8102E', gold: '#C8960C' };

const items = [
  { color: 'blue', label: 'Address',      value: 'Santiago, Naujan, Oriental Mindoro, Philippines',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg> },
  { color: 'red',  label: 'Phone',        value: '+63 (123) 456-7890',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 16.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg> },
  { color: 'gold', label: 'Email',        value: 'cdn.college@edu.ph',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg> },
  { color: 'blue', label: 'Office Hours', value: 'Monday – Friday · 7:00 AM – 5:00 PM',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
];

const MapSection = () => (
  <section id="contact" className="py-20" style={{ background: '#fff', borderTop: '1px solid #e5e7eb' }}>
    <div className="cdn-container">

      <div className="mb-10 scroll-animate">
        <span className="tag-label">Find Us</span>
        <h2 className="section-heading">Our <span className="h-blue">Location</span></h2>
        <p className="section-sub">Colegio De Naujan is located in Santiago, Naujan, Oriental Mindoro, Philippines.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-stretch scroll-animate">

        {/* Map */}
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '1.5px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', minHeight: 420 }}>
          <iframe
            title="Colegio De Naujan Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3880.5!2d121.3167!3d13.3317!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd1b1b1b1b1b1b%3A0x1b1b1b1b1b1b1b1b!2sSantiago%2C+Naujan%2C+Oriental+Mindoro!5e1!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph"
            width="100%" height="100%"
            style={{ border: 0, minHeight: 420, display: 'block' }}
            allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-4 transition-all duration-200"
              style={{ padding: '1.25rem', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 14 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#002280'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,34,128,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: 40, height: 40, borderRadius: 8, background: iconBg[item.color], color: iconColor[item.color] }}
              >
                {item.icon}
              </div>
              <div className="flex flex-col gap-0.5">
                <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af' }}>{item.label}</span>
                <p className="m-0 font-semibold leading-snug" style={{ fontSize: '0.9rem', color: '#0F1422' }}>{item.value}</p>
              </div>
            </div>
          ))}

          <a
            href="https://maps.google.com/?q=Santiago,Naujan,Oriental+Mindoro"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 font-bold text-[0.9rem] no-underline transition-all duration-200 mt-auto"
            style={{ padding: '0.875rem 1.5rem', background: '#002280', color: '#fff', borderRadius: 8, boxShadow: '0 4px 14px rgba(0,34,128,0.25)' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#001560'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#002280'; e.currentTarget.style.transform = 'none'; }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
            Get Directions
          </a>
        </div>
      </div>
    </div>
  </section>
);

export default MapSection;
