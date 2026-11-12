const CourseModal = ({ course, isOpen, onClose, colorBorder, colorPill }) => {
  if (!isOpen || !course) return null;

  const c = colorPill[course.color];

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:40, backdropFilter:'blur(3px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div style={{
        position:'fixed', inset:0, zIndex:50,
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'1rem', overflowY:'auto',
      }}>
        <div style={{
          width:'100%', maxWidth:560,
          background:'#fff', borderRadius:12,
          boxShadow:'0 20px 60px rgba(0,0,0,0.2)',
          maxHeight:'90vh', display:'flex', flexDirection:'column',
          margin:'auto',
        }}>

          {/* Header */}
          <div style={{
            padding:'1.1rem 1.25rem',
            borderBottom:'1px solid #f1f5f9',
            display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'1rem',
            flexShrink:0,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
              <span style={{
                fontSize:'.68rem', fontWeight:800, textTransform:'uppercase',
                letterSpacing:'1.2px', padding:'4px 10px', borderRadius:5,
                background: c.bg, color: c.color,
              }}>
                {course.code}
              </span>
              {course.duration && (
                <span style={{ fontSize:'.72rem', color:'#9ca3af', fontWeight:600 }}>
                  {course.duration} · {course.credits}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                width:28, height:28, borderRadius:6, border:'1px solid #e5e7eb',
                background:'#f9fafb', cursor:'pointer', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#6b7280',
              }}
              aria-label="Close"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <div style={{ overflowY:'auto', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>

            {/* Title */}
            <h2 style={{ margin:0, fontSize:'1rem', fontWeight:800, color:'#0F1422', lineHeight:1.4 }}>
              {course.full}
            </h2>

            {/* Description */}
            <p style={{ margin:0, fontSize:'.85rem', color:'#4E5873', lineHeight:1.75 }}>
              {course.desc}
            </p>

            {/* Highlights */}
            {course.highlights?.length > 0 && (
              <div>
                <p style={{ margin:'0 0 8px', fontSize:'.68rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color: c.color }}>
                  Key Features
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                  {course.highlights.map((h, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:6, fontSize:'.8rem', color:'#374151' }}>
                      <svg style={{ width:13, height:13, color: c.color, flexShrink:0, marginTop:2 }} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Career Paths */}
            {course.careerPaths?.length > 0 && (
              <div>
                <p style={{ margin:'0 0 8px', fontSize:'.68rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color: c.color }}>
                  Career Paths
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {course.careerPaths.map((path, i) => (
                    <span key={i} style={{
                      padding:'4px 10px', borderRadius:20,
                      fontSize:'.75rem', fontWeight:600,
                      background: c.bg, color: c.color,
                    }}>
                      {path}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding:'0.9rem 1.25rem',
            borderTop:'1px solid #f1f5f9',
            flexShrink:0,
          }}>
            <button
              onClick={onClose}
              style={{
                width:'100%', padding:'9px', borderRadius:7,
                border:'1.5px solid #e5e7eb', background:'#f9fafb',
                fontSize:'.85rem', fontWeight:700, color:'#374151',
                cursor:'pointer', fontFamily:'inherit',
                transition:'background .12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background='#f9fafb'}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseModal;
