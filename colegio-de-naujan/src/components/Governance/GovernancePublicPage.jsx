/**
 * GovernancePublicPage.jsx
 * Full public-facing CDN OPEN Governance page.
 * Sections: Transparency | Accountability (concern form + tracker) | Participation | Municipal Services
 */
import { useState, useEffect, useMemo, useLocation } from 'react';
import { Link } from 'react-router-dom';
import {
  getPublishedDocuments,
  submitConcern,
  getConcernByRef,
  getPublishedConsultations,
  getConsultationWithQuestions,
  submitResponse,
} from '../../lib/governance';

/* ── helpers ── */
const DOC_CATS = [
  { value: 'all',                label: 'All' },
  { value: 'academic_programs',  label: 'Academic Programs' },
  { value: 'enrollment_stats',   label: 'Enrollment' },
  { value: 'budget_reports',     label: 'Budget Reports' },
  { value: 'accomplishments',    label: 'Accomplishments' },
  { value: 'projects',           label: 'Projects' },
  { value: 'partnerships',       label: 'Partnerships' },
  { value: 'announcements',      label: 'Announcements' },
  { value: 'official_documents', label: 'Official Docs' },
  { value: 'historical_records', label: 'Historical' },
  { value: 'other',              label: 'Other' },
];

const CONCERN_CATS = [
  'academic_services','enrollment_services','laboratory_facilities',
  'campus_maintenance','institutional_programs','administrative_services','other',
];

const CONCERN_STATUS_STEPS = [
  'submitted','received','assigned','under_review','action_in_progress','resolved','closed',
];

const STATUS_COLORS = {
  submitted:'#6b7280', received:'#C8960C', assigned:'#7c3aed',
  under_review:'#002280', action_in_progress:'#0891b2',
  resolved:'#10813f', closed:'#374151', rejected:'#C8102E',
};

const inp = {
  width:'100%', padding:'10px 13px', borderRadius:9,
  border:'1.5px solid #e2e8f0', fontSize:'.9rem',
  outline:'none', boxSizing:'border-box',
  background:'#fafafa', color:'#1e293b', fontFamily:'inherit',
  transition:'border-color .15s',
};

const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'}) : '—';

const MUNICIPAL_PORTALS = [
  { name:'Naujan Official Website',    office:'Office of the Mayor',         desc:'Official municipal government website.',                        url:'https://naujan.gov.ph/',           category:'Municipal Services' },
  { name:'DepEd Division of Oriental Mindoro', office:'DepEd',              desc:'Education services and school information.',                    url:'https://deped.gov.ph/',            category:'Education' },
  { name:'PhilHealth Oriental Mindoro',office:'PhilHealth',                 desc:'Health insurance membership and benefits.',                     url:'https://www.philhealth.gov.ph/',   category:'Health Services' },
  { name:'SSS Member Portal',          office:'Social Security System',      desc:'SSS contributions and benefits inquiry.',                       url:'https://www.sss.gov.ph/',          category:'Social Services' },
  { name:'CHED Central Office',        office:'Commission on Higher Ed.',    desc:'Higher education programs and scholarships.',                   url:'https://ched.gov.ph/',             category:'Education' },
  { name:'TESDA Online Program',       office:'TESDA',                       desc:'Technical-vocational education and training.',                  url:'https://top.tesda.gov.ph/',        category:'Education' },
  { name:'eGovPH',                     office:'DICT',                        desc:'Government services portal — license, permits, and more.',     url:'https://egov.ph/',                 category:'Citizen Services' },
  { name:'DSWD FO IV-B',               office:'DSWD MIMAROPA',               desc:'Social welfare programs and assistance.',                       url:'https://fo4b.dswd.gov.ph/',        category:'Social Services' },
];

/* ═══════════════════════════════════════════════════════════
   TRANSPARENCY TAB
═══════════════════════════════════════════════════════════ */
const TransparencySection = () => {
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat,     setCat]     = useState('all');
  const [search,  setSearch]  = useState('');

  useEffect(()=>{
    getPublishedDocuments()
      .then(setDocs)
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[]);

  const filtered = useMemo(()=>{
    let d = docs;
    if (cat !== 'all') d = d.filter(x=>x.category===cat);
    if (search) { const q=search.toLowerCase(); d=d.filter(x=>(x.title||'').toLowerCase().includes(q)||(x.body||'').toLowerCase().includes(q)); }
    return d;
  },[docs,cat,search]);

  return (
    <div>
      {/* Filters */}
      <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', marginBottom:'1.5rem', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', pointerEvents:'none' }}
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input style={{...inp, paddingLeft:36}} placeholder="Search documents…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {DOC_CATS.slice(0,6).map(c=>(
            <button key={c.value} onClick={()=>setCat(c.value)} style={{
              padding:'7px 14px', borderRadius:20, border:'1.5px solid',
              borderColor: cat===c.value ? '#002280' : '#e2e8f0',
              background:  cat===c.value ? '#002280' : '#fff',
              color:       cat===c.value ? '#fff' : '#374151',
              fontSize:'.8rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
            }}>{c.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
          {[...Array(6)].map((_,i)=>(
            <div key={i} style={{ height:160, borderRadius:14, background:'linear-gradient(90deg,#f1f5f9 25%,#e8edf5 50%,#f1f5f9 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }}/>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'4rem 1rem', color:'#9ca3af' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom:12, opacity:.4 }}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <p style={{ margin:0, fontWeight:700 }}>No published documents found.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
          {filtered.map(doc=>(
            <div key={doc.id} style={{
              background:'#fff', border:'1.5px solid #e8edf5', borderRadius:14,
              padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem',
              transition:'box-shadow .18s,transform .18s',
            }}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 6px 20px rgba(0,34,128,.09)'; e.currentTarget.style.transform='translateY(-2px)';}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none';}}
            >
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                <span style={{
                  fontSize:'.67rem', fontWeight:800, padding:'3px 9px', borderRadius:20,
                  textTransform:'capitalize', background:'#eef1fb', color:'#002280',
                }}>{doc.category?.replace(/_/g,' ')}</span>
                {doc.academic_year && <span style={{ fontSize:'.67rem', color:'#9ca3af', fontWeight:600 }}>{doc.academic_year}</span>}
              </div>
              <h3 style={{ margin:0, fontSize:'.97rem', fontWeight:800, color:'#0F1422', lineHeight:1.3 }}>{doc.title}</h3>
              {doc.body && <p style={{ margin:0, fontSize:'.84rem', color:'#6b7280', lineHeight:1.6, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{doc.body}</p>}
              <div style={{ marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'0.5rem', borderTop:'1px solid #f1f5f9' }}>
                <span style={{ fontSize:'.73rem', color:'#9ca3af' }}>{doc.responsible_office||'CDN'} · {fmtDate(doc.published_at)}</span>
                {doc.file_url && (
                  <div style={{ display:'flex', gap:6 }}>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{
                      display:'inline-flex', alignItems:'center', gap:4,
                      fontSize:'.78rem', fontWeight:700, color:'#002280', textDecoration:'none',
                      padding:'5px 10px', borderRadius:6, border:'1.5px solid #e2e8f0',
                      background:'#fff', transition:'background .12s',
                    }}
                      onMouseEnter={e=>e.currentTarget.style.background='#eef1fb'}
                      onMouseLeave={e=>e.currentTarget.style.background='#fff'}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                      View
                    </a>
                    <button
                      onClick={async () => {
                        try {
                          const res  = await fetch(doc.file_url);
                          const blob = await res.blob();
                          const url  = URL.createObjectURL(blob);
                          const a    = document.createElement('a');
                          const ext  = doc.file_url.split('?')[0].split('.').pop();
                          a.href     = url;
                          a.download = `${doc.title.replace(/[^a-zA-Z0-9 ]/g,'_')}.${ext}`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch { window.open(doc.file_url, '_blank'); }
                      }}
                      style={{
                        display:'inline-flex', alignItems:'center', gap:4,
                        fontSize:'.78rem', fontWeight:700, color:'#fff',
                        padding:'5px 10px', borderRadius:6, border:'none',
                        background:'#002280', cursor:'pointer', fontFamily:'inherit',
                        transition:'opacity .12s',
                      }}
                      onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
                      onMouseLeave={e=>e.currentTarget.style.opacity='1'}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ACCOUNTABILITY TAB
═══════════════════════════════════════════════════════════ */
const AccountabilitySection = () => {
  const [form, setForm] = useState({
    category:'academic_services', subject:'', description:'', office:'',
    is_anonymous:false, submitter_name:'', submitter_email:'',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(null);
  const [error,      setError]      = useState('');
  const [refNo,      setRefNo]      = useState('');
  const [tracking,   setTracking]   = useState(null);
  const [trackErr,   setTrackErr]   = useState('');
  const [tracking_loading, setTrackingLoading] = useState(false);

  const f = k => e => setForm(p=>({...p,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.description) { setError('Subject and description are required.'); return; }
    setSubmitting(true); setError('');
    try {
      const result = await submitConcern(form);
      setSubmitted(result);
      setForm({ category:'academic_services', subject:'', description:'', office:'', is_anonymous:false, submitter_name:'', submitter_email:'' });
    } catch(err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!refNo.trim()) return;
    setTrackingLoading(true); setTrackErr(''); setTracking(null);
    try {
      const r = await getConcernByRef(refNo);
      setTracking(r);
    } catch { setTrackErr('Concern not found. Please check your reference number.'); }
    finally { setTrackingLoading(false); }
  };

  const stepIdx = tracking ? CONCERN_STATUS_STEPS.indexOf(tracking.status) : -1;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', alignItems:'start' }}>

      {/* LEFT — Concern Form */}
      <div>
        <h3 style={{ margin:'0 0 1.25rem', fontSize:'1.05rem', fontWeight:800, color:'#0F1422' }}>Submit a Concern or Suggestion</h3>

        {submitted ? (
          <div style={{ background:'#edf7f1', border:'1.5px solid #bbf7d0', borderRadius:14, padding:'1.5rem', textAlign:'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10813f" strokeWidth="2" style={{ marginBottom:12 }}>
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p style={{ margin:'0 0 6px', fontWeight:800, fontSize:'1rem', color:'#166534' }}>Concern Submitted!</p>
            <p style={{ margin:'0 0 12px', fontSize:'.86rem', color:'#166534' }}>Your reference number is:</p>
            <div style={{ background:'#fff', border:'2px solid #10813f', borderRadius:10, padding:'10px 20px', display:'inline-block', fontWeight:900, fontSize:'1.1rem', color:'#002280', letterSpacing:1 }}>
              {submitted.reference_no}
            </div>
            <p style={{ margin:'12px 0 0', fontSize:'.8rem', color:'#6b7280' }}>Save this number to track your concern status.</p>
            <button onClick={()=>setSubmitted(null)} style={{ marginTop:16, padding:'9px 20px', borderRadius:8, border:'none', background:'#002280', color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Submit Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {error && <div style={{ background:'#fee2e2', color:'#991b1b', borderRadius:9, padding:'9px 13px', fontSize:'.84rem', fontWeight:600 }}>{error}</div>}

            <div>
              <label style={{ display:'block', marginBottom:5, fontSize:'.78rem', fontWeight:700, color:'#64748b' }}>Category *</label>
              <select style={inp} value={form.category} onChange={f('category')}>
                {CONCERN_CATS.map(c=><option key={c} value={c}>{c.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', marginBottom:5, fontSize:'.78rem', fontWeight:700, color:'#64748b' }}>Subject *</label>
              <input style={inp} value={form.subject} onChange={f('subject')} placeholder="Brief description of your concern" required/>
            </div>
            <div>
              <label style={{ display:'block', marginBottom:5, fontSize:'.78rem', fontWeight:700, color:'#64748b' }}>Description *</label>
              <textarea style={{...inp,height:100,resize:'vertical'}} value={form.description} onChange={f('description')} placeholder="Please describe your concern in detail…" required/>
            </div>
            <div>
              <label style={{ display:'block', marginBottom:5, fontSize:'.78rem', fontWeight:700, color:'#64748b' }}>Office / Department (optional)</label>
              <input style={inp} value={form.office} onChange={f('office')} placeholder="Which office does this concern?"/>
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
              <input type="checkbox" checked={form.is_anonymous} onChange={f('is_anonymous')} style={{ width:16, height:16, accentColor:'#002280' }}/>
              <span style={{ fontSize:'.87rem', fontWeight:600, color:'#374151' }}>Submit anonymously</span>
            </label>
            {!form.is_anonymous && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontSize:'.78rem', fontWeight:700, color:'#64748b' }}>Your Name</label>
                  <input style={inp} value={form.submitter_name} onChange={f('submitter_name')} placeholder="Full name"/>
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontSize:'.78rem', fontWeight:700, color:'#64748b' }}>Email (optional)</label>
                  <input type="email" style={inp} value={form.submitter_email} onChange={f('submitter_email')} placeholder="email@example.com"/>
                </div>
              </div>
            )}
            <button type="submit" disabled={submitting} style={{
              padding:'12px', borderRadius:10, border:'none',
              background:'#C8102E', color:'#fff',
              fontSize:'.9rem', fontWeight:800, cursor:'pointer', fontFamily:'inherit',
              opacity: submitting ? .6 : 1, transition:'opacity .15s',
            }}>
              {submitting ? 'Submitting…' : 'Submit Concern'}
            </button>
          </form>
        )}
      </div>

      {/* RIGHT — Reference Tracker */}
      <div>
        <h3 style={{ margin:'0 0 1.25rem', fontSize:'1.05rem', fontWeight:800, color:'#0F1422' }}>Track Your Concern</h3>
        <form onSubmit={handleTrack} style={{ display:'flex', gap:10, marginBottom:'1.25rem' }}>
          <input style={{...inp,flex:1}} value={refNo} onChange={e=>setRefNo(e.target.value.toUpperCase())} placeholder="CDN-YYYYMMDD-XXXX"/>
          <button type="submit" disabled={tracking_loading} style={{
            padding:'10px 18px', borderRadius:9, border:'none',
            background:'#002280', color:'#fff',
            fontSize:'.87rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
            whiteSpace:'nowrap', opacity: tracking_loading ? .6 : 1,
          }}>
            {tracking_loading ? '…' : 'Track'}
          </button>
        </form>

        {trackErr && <div style={{ background:'#fee2e2', color:'#991b1b', borderRadius:9, padding:'9px 13px', fontSize:'.84rem', fontWeight:600, marginBottom:'1rem' }}>{trackErr}</div>}

        {tracking && (
          <div style={{ background:'#fff', border:'1.5px solid #e8edf5', borderRadius:14, padding:'1.25rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
              <div>
                <p style={{ margin:0, fontWeight:800, fontSize:'.97rem', color:'#0F1422' }}>{tracking.reference_no}</p>
                <p style={{ margin:'3px 0 0', fontSize:'.78rem', color:'#9ca3af' }}>{tracking.category?.replace(/_/g,' ')} · {fmtDate(tracking.created_at)}</p>
              </div>
              <span style={{
                fontSize:'.72rem', fontWeight:800, padding:'4px 12px', borderRadius:20,
                background: (STATUS_COLORS[tracking.status]||'#6b7280') + '18',
                color: STATUS_COLORS[tracking.status]||'#6b7280',
                textTransform:'capitalize',
              }}>{tracking.status?.replace(/_/g,' ')}</span>
            </div>

            {/* Status timeline */}
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {CONCERN_STATUS_STEPS.map((step, i) => {
                const done = i <= stepIdx;
                const cur  = i === stepIdx;
                return (
                  <div key={step} style={{ display:'flex', alignItems:'flex-start', gap:12, paddingBottom: i < CONCERN_STATUS_STEPS.length-1 ? '0.75rem' : 0, position:'relative' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                      <div style={{
                        width:22, height:22, borderRadius:'50%', border: `2px solid ${done?'#10813f':'#e2e8f0'}`,
                        background: done ? '#10813f' : '#fff',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        zIndex:1, flexShrink:0,
                        boxShadow: cur ? '0 0 0 4px rgba(16,129,63,.15)' : 'none',
                      }}>
                        {done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      {i < CONCERN_STATUS_STEPS.length-1 && (
                        <div style={{ width:2, flex:1, minHeight:20, background: done ? '#10813f' : '#e2e8f0', marginTop:2 }}/>
                      )}
                    </div>
                    <p style={{ margin:'2px 0 0', fontSize:'.82rem', fontWeight: cur ? 800 : 600, color: cur ? '#10813f' : done ? '#374151' : '#9ca3af', textTransform:'capitalize' }}>
                      {step.replace(/_/g,' ')}
                    </p>
                  </div>
                );
              })}
            </div>

            {tracking.resolution_note && (
              <div style={{ marginTop:'1rem', background:'#edf7f1', borderRadius:10, padding:'10px 14px' }}>
                <p style={{ margin:'0 0 4px', fontSize:'.72rem', fontWeight:800, color:'#10813f', textTransform:'uppercase', letterSpacing:'.05em' }}>Resolution Note</p>
                <p style={{ margin:0, fontSize:'.86rem', color:'#166534', lineHeight:1.5 }}>{tracking.resolution_note}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   PARTICIPATION TAB
═══════════════════════════════════════════════════════════ */
const ParticipationSection = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [active,   setActive]   = useState(null);
  const [answers,  setAnswers]  = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  useEffect(()=>{
    getPublishedConsultations()
      .then(setConsultations)
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[]);

  const openConsultation = async (c) => {
    try {
      const full = await getConsultationWithQuestions(c.id);
      setActive(full); setAnswers({}); setSubmitted(false);
    } catch(e) { alert(e.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const responses = (active.questions||[]).map(q=>({ question_id:q.id, answer:answers[q.id]||'', is_anonymous:true }));
      await submitResponse(active.id, responses);
      setSubmitted(true);
    } catch(err) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  if (active) return (
    <div style={{ maxWidth:640, margin:'0 auto' }}>
      <button onClick={()=>setActive(null)} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'none', border:'none', color:'#002280', fontWeight:700, fontSize:'.87rem', cursor:'pointer', fontFamily:'inherit', marginBottom:'1.5rem', padding:0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Back to consultations
      </button>

      {submitted ? (
        <div style={{ background:'#edf7f1', border:'1.5px solid #bbf7d0', borderRadius:14, padding:'2rem', textAlign:'center' }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#10813f" strokeWidth="2" style={{ marginBottom:12 }}>
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <p style={{ margin:'0 0 6px', fontWeight:800, color:'#166534' }}>Response submitted! Thank you.</p>
          <button onClick={()=>setActive(null)} style={{ marginTop:16, padding:'9px 20px', borderRadius:8, border:'none', background:'#002280', color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Back</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <div>
            <h3 style={{ margin:'0 0 4px', fontSize:'1.1rem', fontWeight:900, color:'#0F1422' }}>{active.title}</h3>
            {active.description && <p style={{ margin:0, fontSize:'.9rem', color:'#6b7280', lineHeight:1.6 }}>{active.description}</p>}
          </div>
          {(active.questions||[]).map((q,i)=>(
            <div key={q.id} style={{ background:'#fafafa', border:'1px solid #e8edf5', borderRadius:12, padding:'1rem 1.25rem' }}>
              <label style={{ display:'block', marginBottom:8, fontSize:'.9rem', fontWeight:700, color:'#0F1422' }}>
                {i+1}. {q.question_text} {q.is_required && <span style={{color:'#C8102E'}}>*</span>}
              </label>
              {q.question_type === 'text' && (
                <textarea style={{...inp,height:72,resize:'vertical'}} value={answers[q.id]||''} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))} required={q.is_required}/>
              )}
              {q.question_type === 'yes_no' && (
                <div style={{ display:'flex', gap:12 }}>
                  {['Yes','No'].map(opt=>(
                    <label key={opt} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                      <input type="radio" name={`q_${q.id}`} value={opt} checked={answers[q.id]===opt} onChange={()=>setAnswers(p=>({...p,[q.id]:opt}))} required={q.is_required} style={{accentColor:'#002280'}}/>
                      <span style={{fontSize:'.9rem',fontWeight:600,color:'#374151'}}>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {(q.question_type === 'single_choice' || q.question_type === 'multiple_choice') && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {(q.options||[]).map(opt=>(
                    <label key={opt} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                      <input
                        type={q.question_type === 'multiple_choice' ? 'checkbox' : 'radio'}
                        name={`q_${q.id}`}
                        value={opt}
                        checked={q.question_type === 'multiple_choice'
                          ? (answers[q.id]||[]).includes(opt)
                          : answers[q.id]===opt
                        }
                        onChange={()=>{
                          if (q.question_type === 'multiple_choice') {
                            const cur = answers[q.id]||[];
                            setAnswers(p=>({...p,[q.id]:cur.includes(opt)?cur.filter(v=>v!==opt):[...cur,opt]}));
                          } else {
                            setAnswers(p=>({...p,[q.id]:opt}));
                          }
                        }}
                        style={{accentColor:'#002280'}}
                      />
                      <span style={{fontSize:'.9rem',fontWeight:600,color:'#374151'}}>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.question_type === 'rating' && (
                <div style={{ display:'flex', gap:10 }}>
                  {[1,2,3,4,5].map(n=>(
                    <button type="button" key={n} onClick={()=>setAnswers(p=>({...p,[q.id]:String(n)}))} style={{
                      width:42, height:42, borderRadius:'50%', border:'2px solid',
                      borderColor: answers[q.id]===String(n) ? '#002280' : '#e2e8f0',
                      background: answers[q.id]===String(n) ? '#002280' : '#fff',
                      color: answers[q.id]===String(n) ? '#fff' : '#374151',
                      fontWeight:800, fontSize:'.95rem', cursor:'pointer', fontFamily:'inherit',
                    }}>{n}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button type="submit" disabled={submitting} style={{
            padding:'13px', borderRadius:10, border:'none',
            background:'#C8960C', color:'#fff',
            fontSize:'.9rem', fontWeight:800, cursor:'pointer', fontFamily:'inherit',
            opacity: submitting ? .6 : 1,
          }}>
            {submitting ? 'Submitting…' : 'Submit Response'}
          </button>
        </form>
      )}
    </div>
  );

  return (
    <div>
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {[...Array(3)].map((_,i)=><div key={i} style={{ height:80, borderRadius:14, background:'#f1f5f9' }}/>)}
        </div>
      ) : consultations.length === 0 ? (
        <div style={{ textAlign:'center', padding:'4rem 1rem', color:'#9ca3af' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom:12, opacity:.4 }}>
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          <p style={{ margin:0, fontWeight:700 }}>No active consultations at this time.</p>
          <p style={{ margin:'6px 0 0', fontSize:'.86rem' }}>Check back soon for upcoming surveys.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {consultations.map(c=>(
            <div key={c.id} style={{
              background:'#fff', border:'1.5px solid #e8edf5', borderRadius:14,
              padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem',
            }}>
              <div style={{ minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:'.67rem', fontWeight:800, padding:'3px 9px', borderRadius:20, textTransform:'capitalize', background:'#eef1fb', color:'#002280' }}>{c.type}</span>
                  {c.closes_at && <span style={{ fontSize:'.72rem', color:'#9ca3af', fontWeight:600 }}>Closes {fmtDate(c.closes_at)}</span>}
                </div>
                <p style={{ margin:'0 0 4px', fontWeight:800, fontSize:'.97rem', color:'#0F1422' }}>{c.title}</p>
                {c.description && <p style={{ margin:0, fontSize:'.84rem', color:'#6b7280', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{c.description}</p>}
              </div>
              <button onClick={()=>openConsultation(c)} style={{
                padding:'10px 20px', borderRadius:9, border:'none',
                background:'#C8960C', color:'#fff',
                fontWeight:700, fontSize:'.85rem', cursor:'pointer', fontFamily:'inherit',
                flexShrink:0, whiteSpace:'nowrap',
              }}>Participate</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MUNICIPAL SERVICES TAB
═══════════════════════════════════════════════════════════ */
const MunicipalSection = () => {
  const cats = [...new Set(MUNICIPAL_PORTALS.map(p=>p.category))];
  return (
    <div>
      <div style={{ background:'#fdf8ec', border:'1.5px solid rgba(200,150,12,.2)', borderRadius:12, padding:'12px 16px', marginBottom:'1.5rem', fontSize:'.84rem', color:'#92400e', fontWeight:600 }}>
        ⚠️ These are official external portals. CDN is not affiliated with or responsible for their content. Links open in a new tab.
      </div>
      {cats.map(cat=>(
        <div key={cat} style={{ marginBottom:'2rem' }}>
          <p style={{ margin:'0 0 0.75rem', fontSize:'.72rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#94a3b8' }}>{cat}</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'0.75rem' }}>
            {MUNICIPAL_PORTALS.filter(p=>p.category===cat).map(portal=>(
              <a key={portal.name} href={portal.url} target="_blank" rel="noopener noreferrer" style={{
                display:'flex', flexDirection:'column', gap:6,
                background:'#fff', border:'1.5px solid #e8edf5', borderRadius:12, padding:'1rem 1.1rem',
                textDecoration:'none', transition:'box-shadow .18s, transform .18s',
              }}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 16px rgba(0,34,128,.09)'; e.currentTarget.style.transform='translateY(-2px)';}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none';}}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                  <p style={{ margin:0, fontWeight:800, fontSize:'.9rem', color:'#0F1422' }}>{portal.name}</p>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" style={{ flexShrink:0 }}>
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </div>
                <p style={{ margin:0, fontSize:'.75rem', color:'#7c3aed', fontWeight:600 }}>{portal.office}</p>
                <p style={{ margin:0, fontSize:'.8rem', color:'#6b7280', lineHeight:1.5 }}>{portal.desc}</p>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
const TABS = [
  { key:'transparency',  label:'Transparency'       },
  { key:'accountability',label:'Accountability'      },
  { key:'participation', label:'Participation'       },
  { key:'municipal',     label:'Municipal Services'  },
];

const GovernancePublicPage = () => {
  const [activeTab, setActiveTab] = useState('transparency');

  // Honour hash from URL (e.g. /governance#accountability)
  useEffect(()=>{
    const hash = window.location.hash.replace('#','');
    if (TABS.find(t=>t.key===hash)) setActiveTab(hash);
  },[]);

  return (
    <div style={{ minHeight:'100vh', background:'#f8f9fc' }}>

      {/* Hero */}
      <div style={{
        background:'linear-gradient(135deg,#001158 0%,#002280 60%,#0038d4 100%)',
        padding:'4rem 1.5rem 3rem',
        textAlign:'center',
      }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)',
          borderRadius:999, padding:'6px 18px', marginBottom:'1.25rem',
          fontSize:'.68rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'2px', color:'rgba(255,255,255,0.8)',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          CDN OPEN Governance System
        </div>
        <h1 style={{ margin:'0 0 1rem', fontSize:'clamp(1.8rem,4vw,2.8rem)', fontWeight:900, color:'#fff', letterSpacing:'-1px' }}>
          Transparency · Accountability · Participation
        </h1>
        <p style={{ margin:'0 auto', maxWidth:520, fontSize:'.97rem', color:'rgba(255,255,255,0.7)', lineHeight:1.7 }}>
          Access institutional information, submit concerns, and participate in
          shaping the future of Colegio de Naujan.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        background:'#fff', borderBottom:'2px solid #f1f5f9',
        position:'sticky', top:72, zIndex:40,
        overflowX:'auto',
      }}>
        <div className="cdn-container" style={{ display:'flex', gap:0 }}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{
              padding:'14px 22px', border:'none', background:'none',
              fontSize:'.88rem', fontWeight: activeTab===t.key ? 700 : 600,
              color: activeTab===t.key ? '#002280' : '#94a3b8',
              borderBottom: activeTab===t.key ? '2px solid #002280' : '2px solid transparent',
              marginBottom:'-2px', cursor:'pointer', whiteSpace:'nowrap',
              fontFamily:'inherit', transition:'color .15s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="cdn-container" style={{ padding:'2.5rem 1.5rem 5rem' }}>
        {activeTab === 'transparency'   && <TransparencySection/>}
        {activeTab === 'accountability' && <AccountabilitySection/>}
        {activeTab === 'participation'  && <ParticipationSection/>}
        {activeTab === 'municipal'      && <MunicipalSection/>}
      </div>

      {/* Back to site */}
      <div style={{ background:'#0F1422', padding:'2rem 1.5rem', textAlign:'center' }}>
        <Link to="/" style={{ color:'rgba(255,255,255,0.6)', fontSize:'.87rem', textDecoration:'none', fontWeight:600 }}>
          ← Back to CDN Portal
        </Link>
      </div>
    </div>
  );
};

export default GovernancePublicPage;
