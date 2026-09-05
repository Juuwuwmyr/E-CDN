const pillarsConfig = {
  blue: { tagBg: 'rgba(0,34,128,0.08)',   tagColor: '#002280', borderHover: '#002280' },
  red:  { tagBg: 'rgba(200,16,46,0.08)',  tagColor: '#C8102E', borderHover: '#C8102E' },
  gold: { tagBg: 'rgba(200,150,12,0.10)', tagColor: '#C8960C', borderHover: '#C8960C' },
};

const About = () => {
  const pillars = [
    { num: '01', color: 'blue', label: 'Values',    title: 'Quality Education',      desc: 'Colegio De Naujan is committed to delivering relevant, high-quality instruction across all programs — grounded in both theory and practical application.' },
    { num: '02', color: 'red',  label: 'Community', title: 'Service & Outreach',     desc: 'We nurture socially responsible graduates who actively contribute to the community through service-learning, outreach programs, and civic engagement.' },
    { num: '03', color: 'gold', label: 'Character', title: 'Values-Driven Learning', desc: 'Beyond academics, CDN cultivates integrity, discipline, and a God-loving character — preparing students for life in a just and progressive society.' },
  ];

  const highlights = [
    { val: '__', lbl: 'Years of Service'  },
    { val: '__', lbl: 'College Programs'  },
    { val: '__', lbl: 'Students Enrolled' },
    { val: '__', lbl: 'Passing Rate'      },
  ];

  return (
    <section id="about" className="py-20" style={{ background: '#fff', borderTop: '1px solid #e5e7eb' }}>
      <div className="cdn-container">

        {/* Two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-14">

          {/* Left */}
          <div className="flex flex-col gap-5 scroll-animate from-left">
            <span className="tag-label">About The School</span>
            <h2 className="section-heading">
              Colegio De Naujan —<br />
              <span className="h-blue">Who We Are.</span>
            </h2>
            <p style={{ fontSize: '1rem', color: '#4E5873', lineHeight: 1.75, margin: 0 }}>
              Colegio De Naujan is a premier institution of higher learning located in
              Santiago, Naujan, Oriental Mindoro. We are dedicated to providing
              quality, accessible, and values-driven education to every student.
            </p>
            <p style={{ fontSize: '1rem', color: '#4E5873', lineHeight: 1.75, margin: 0 }}>
              Through our four college programs — BSIS, BTVTED-WFT, BTVTED-CHS, and
              BPA — we equip graduates with the knowledge, skills, and character needed
              to excel in their chosen vocation and serve their community.
            </p>

            {/* Highlight bar */}
            <div
              className="flex items-stretch mt-2"
              style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: '1.25rem 1.5rem' }}
            >
              {highlights.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col gap-0.5">
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#002280', lineHeight: 1 }}>{h.val}</span>
                  <span style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{h.lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — pillar cards */}
          <div className="flex flex-col gap-4">
            {pillars.map((p, i) => {
              const cm = pillarsConfig[p.color];
              return (
                <div
                  key={i}
                  className={`relative flex items-start gap-5 p-6 transition-all duration-200 scroll-animate from-right stagger-${i + 1}`}
                  style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 14 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = cm.borderHover; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.07)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* tag */}
                  <span
                    className="absolute top-4 right-4 text-[0.6rem] font-black uppercase tracking-[1.2px] px-2 py-0.5 rounded"
                    style={{ background: cm.tagBg, color: cm.tagColor }}
                  >
                    {p.label}
                  </span>
                  {/* num */}
                  <span
                    className="px-2 py-1 rounded-lg font-black"
                    style={{ fontSize: '1.75rem', lineHeight: 1, background: cm.tagBg, color: cm.tagColor, minWidth: '2.5rem', textAlign: 'center' }}
                  >
                    {p.num}
                  </span>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <h3 className="m-0 font-extrabold" style={{ fontSize: '1rem', color: '#0F1422' }}>{p.title}</h3>
                    <p className="m-0" style={{ fontSize: '0.875rem', color: '#4E5873', lineHeight: 1.65 }}>{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mission Banner */}
        <div
          className="relative flex items-center justify-between gap-12 overflow-hidden scroll-animate flex-wrap"
          style={{ background: 'linear-gradient(125deg, #002280 0%, #003399 55%, #001560 100%)', borderRadius: 20, padding: '3.5rem' }}
        >
          <div className="absolute pointer-events-none" style={{ right: -60, bottom: -60, width: 260, height: 260, background: 'radial-gradient(circle, rgba(255,215,0,0.14) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div className="absolute pointer-events-none" style={{ left: -40, top: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(200,16,46,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />

          <div className="relative z-10 flex flex-col gap-3" style={{ maxWidth: 600 }}>
            <span
              className="inline-flex items-center w-fit px-3.5 py-1 rounded-full text-[0.72rem] font-bold uppercase tracking-[1px]"
              style={{ border: '1.5px solid rgba(255,215,0,0.45)', color: '#FFD700' }}
            >
              Our Mission
            </span>
            <h2 className="m-0 font-black text-white" style={{ fontSize: 'clamp(1.2rem,2.5vw,1.75rem)', lineHeight: 1.35 }}>
              Emboldened and imbued by the mandate and philosophy of higher education.
            </h2>
            <p className="m-0" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.75 }}>
              With aspiration, ideals, and a high sense of appreciation on the role of lifelong
              education, COLEGIO de NAUJAN aims to produce men and women equipped with adequate
              and relevant knowledge, skills, and values that will enable them to practice
              successfully the vocation and profession that is properly matched with manpower
              requirement of the country and head quality life in a democratic, just and peaceful,
              progressive, and God-loving community.
            </p>
          </div>

          <a
            href="#courses"
            className="relative z-10 shrink-0 font-extrabold text-[0.95rem] rounded-lg no-underline transition-all duration-200"
            style={{ padding: '1rem 2rem', background: '#FFD700', color: '#001560', boxShadow: '0 4px 16px rgba(255,215,0,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#ffe040'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FFD700'; e.currentTarget.style.transform = 'none'; }}
          >
            Explore Courses
          </a>
        </div>

      </div>
    </section>
  );
};

export default About;
