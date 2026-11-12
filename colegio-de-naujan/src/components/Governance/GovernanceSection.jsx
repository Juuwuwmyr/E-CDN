/**
 * GovernanceSection.jsx
 * Landing page section — pillar buttons open inline modals.
 */
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getDocumentStats, getConcernStats, getParticipationStats,
  getPublishedDocuments,
  submitConcern, getConcernByRef,
  getPublishedConsultations, getConsultationWithQuestions, submitResponse,
} from '../../lib/governance';

/* ─── shared ─────────────────────────────────────────────── */
const inp = {
  width:'100%', padding:'10px 13px', borderRadius:8,
  border:'1.5px solid #e2e8f0', fontSize:'.88rem',
  outline:'none', boxSizing:'border-box',
  background:'#fafafa', color:'#1e293b', fontFamily:'inherit',
};
const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}) : '—';

const DOC_CATS = [
  {value:'all',label:'All'},{value:'academic_programs',label:'Academic Programs'},
  {value:'enrollment_stats',label:'Enrollment'},{value:'budget_reports',label:'Budget Reports'},
  {value:'accomplishments',label:'Accomplishments'},{value:'projects',label:'Projects'},
  {value:'partnerships',label:'Partnerships'},{value:'official_documents',label:'Official Docs'},
  {value:'historical_records',label:'Historical'},{value:'other',label:'Other'},
];
const CONCERN_CATS = ['academic_services','enrollment_services','laboratory_facilities','campus_maintenance','institutional_programs','administrative_services','other'];
const CONCERN_STEPS = ['submitted','received','assigned','under_review','action_in_progress','resolved','closed'];
const STEP_COLORS = { submitted:'#6b7280',received:'#C8960C',assigned:'#7c3aed',under_review:'#002280',action_in_progress:'#0891b2',resolved:'#10813f',closed:'#374151',rejected:'#C8102E' };

/* ─── Municipal portals ───────────────────────────────────── */
const MUNICIPAL_PORTALS = [
  { name:'Naujan Official Website',         office:'Office of the Mayor',     url:'https://naujan.gov.ph/',         category:'Municipal' },
  { name:'DepEd Division Oriental Mindoro', office:'DepEd',                   url:'https://deped.gov.ph/',          category:'Education' },
  { name:'PhilHealth',                      office:'PhilHealth',              url:'https://www.philhealth.gov.ph/', category:'Health'    },
  { name:'SSS Member Portal',               office:'Social Security System',  url:'https://www.sss.gov.ph/',        category:'Social'    },
  { name:'CHED',                            office:'Commission on Higher Ed.',url:'https://ched.gov.ph/',           category:'Education' },
  { name:'TESDA Online Program',            office:'TESDA',                   url:'https://top.tesda.gov.ph/',      category:'Education' },
  { name:'eGovPH',                          office:'DICT',                    url:'https://egov.ph/',               category:'Citizen'   },
  { name:'DSWD FO IV-B',                    office:'DSWD MIMAROPA',           url:'https://fo4b.dswd.gov.ph/',      category:'Social'    },
];
const PORTAL_COLORS = {
  Municipal:{color:'#002280',bg:'#eef1fb'}, Education:{color:'#10813f',bg:'#edf7f1'},
  Health:{color:'#C8102E',bg:'#fdf0f2'},    Social:{color:'#7c3aed',bg:'#f5f0ff'},
  Citizen:{color:'#C8960C',bg:'#fdf8ec'},
};

/* ═══════════════════════════════════════════════════════════
   MODAL SHELL
═══════════════════════════════════════════════════════════ */
const Modal = ({ open, onClose, title, color, icon, children }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:'fixed', inset:0, zIndex:9000,
        background:'rgba(15,23,36,.55)', backdropFilter:'blur(6px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'1rem', animation:'gov-modal-in .18s ease both',
      }}
    >
      <div style={{
        background:'#fff', borderRadius:22, width:'100%', maxWidth:720,
        maxHeight:'90vh', display:'flex', flexDirection:'column',
        boxShadow:'0 32px 80px rgba(0,0,0,.28)',
        animation:'gov-modal-up .22s cubic-bezier(.2,.8,.4,1) both',
        overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{ background:color, padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem', flexShrink:0 }}>
          <div style={{ width:42,height:42,borderRadius:12,background:'rgba(255,255,255,.18)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#fff' }}>
            {icon}
          </div>
          <p style={{ margin:0, flex:1, fontSize:'1.1rem', fontWeight:900, color:'#fff' }}>{title}</p>
          <button onClick={onClose} style={{ width:32,height:32,borderRadius:8,border:'none',background:'rgba(255,255,255,.2)',color:'#fff',fontSize:'1.3rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,lineHeight:1 }}>×</button>
        </div>
        {/* Scrollable body */}
        <div style={{ overflowY:'auto', padding:'1.5rem', flex:1 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   TRANSPARENCY MODAL CONTENT
═══════════════════════════════════════════════════════════ */
const TransparencyContent = () => {
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat,     setCat]     = useState('all');
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    getPublishedDocuments()
      .then(setDocs).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let d = docs;
    if (cat !== 'all') d = d.filter(x => x.category === cat);
    if (search) { const q=search.toLowerCase(); d=d.filter(x=>(x.title||'').toLowerCase().includes(q)); }
    return d;
  }, [docs, cat, search]);

  return (
    <div>
      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:'1.25rem', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:180 }}>
          <svg style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#9ca3af',pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input style={{...inp,paddingLeft:32,borderRadius:8}} placeholder="Search documents…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
          {DOC_CATS.slice(0,5).map(c=>(
            <button key={c.value} onClick={()=>setCat(c.value)} style={{
              padding:'7px 12px', borderRadius:20, border:'1.5px solid',
              borderColor: cat===c.value?'#002280':'#e2e8f0',
              background:  cat===c.value?'#002280':'#fff',
              color:       cat===c.value?'#fff':'#374151',
              fontSize:'.76rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
            }}>{c.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {[...Array(4)].map((_,i)=><div key={i} style={{height:70,borderRadius:12,background:'linear-gradient(90deg,#f1f5f9 25%,#e8edf5 50%,#f1f5f9 75%)',backgroundSize:'200% 100%',animation:'gov-shimmer 1.4s infinite'}}/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center',padding:'3rem',color:'#9ca3af' }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginBottom:10,opacity:.4}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p style={{margin:0,fontWeight:700}}>No published documents found.</p>
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:'.75rem' }}>
          {filtered.map(doc => (
            <div key={doc.id} style={{
              background:'#f8f9fc', border:'1.5px solid #e8edf5', borderRadius:14,
              padding:'1rem 1.25rem', display:'flex', alignItems:'center', gap:'1rem',
              transition:'background .12s',
            }}
              onMouseEnter={e=>e.currentTarget.style.background='#eef1fb'}
              onMouseLeave={e=>e.currentTarget.style.background='#f8f9fc'}
            >
              {/* Icon */}
              <div style={{ width:40,height:40,borderRadius:10,background:'#eef1fb',color:'#002280',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5z"/></svg>
              </div>
              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:3 }}>
                  <p style={{ margin:0,fontSize:'.9rem',fontWeight:800,color:'#0F1422',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:280 }}>{doc.title}</p>
                  <span style={{ fontSize:'.62rem',fontWeight:800,padding:'2px 8px',borderRadius:20,background:'#eef1fb',color:'#002280',textTransform:'capitalize',flexShrink:0 }}>
                    {doc.category?.replace(/_/g,' ')||'Document'}
                  </span>
                </div>
                <p style={{ margin:0,fontSize:'.72rem',color:'#9ca3af',fontWeight:600 }}>
                  {doc.responsible_office||'CDN'} · {fmtDate(doc.published_at)}
                </p>
                {doc.body && <p style={{ margin:'3px 0 0',fontSize:'.79rem',color:'#6b7280',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:1,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{doc.body}</p>}
              </div>
              {/* Actions */}
              {doc.file_url && (
                <div style={{ display:'flex',gap:6,flexShrink:0 }}>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:7,border:'1.5px solid #e2e8f0',background:'#fff',color:'#002280',fontSize:'.75rem',fontWeight:700,textDecoration:'none',transition:'background .12s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#eef1fb'}
                    onMouseLeave={e=>e.currentTarget.style.background='#fff'}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    View
                  </a>
                  <button
                    onClick={async()=>{ try{ const r=await fetch(doc.file_url); const b=await r.blob(); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=doc.title.replace(/[^a-zA-Z0-9 ]/g,'_')+'.'+doc.file_url.split('?')[0].split('.').pop(); a.click(); URL.revokeObjectURL(u); }catch{window.open(doc.file_url,'_blank');} }}
                    style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:7,border:'none',background:'#002280',color:'#fff',fontSize:'.75rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ACCOUNTABILITY MODAL CONTENT
═══════════════════════════════════════════════════════════ */
const AccountabilityContent = () => {
  const [view,       setView]       = useState('form'); // form | track
  const [form,       setForm]       = useState({ subject:'',description:'',category:'academic_services',is_anonymous:true,submitter_name:'',submitter_email:'' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(null);
  const [formErr,    setFormErr]    = useState('');
  const [refInput,   setRefInput]   = useState('');
  const [tracking,   setTracking]   = useState(null);
  const [trackLoad,  setTrackLoad]  = useState(false);
  const [trackErr,   setTrackErr]   = useState('');

  const f = k => e => setForm(p => ({...p,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject||!form.description){setFormErr('Subject and description are required.');return;}
    setSubmitting(true);setFormErr('');
    try { const r=await submitConcern(form); setSubmitted(r); }
    catch(err){setFormErr(err.message);}
    finally{setSubmitting(false);}
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if(!refInput.trim())return;
    setTrackLoad(true);setTrackErr('');setTracking(null);
    try{setTracking(await getConcernByRef(refInput));}
    catch{setTrackErr('Concern not found. Check your reference number.');}
    finally{setTrackLoad(false);}
  };

  const stepIdx = tracking ? CONCERN_STEPS.indexOf(tracking.status) : -1;

  return (
    <div>
      {/* Tab switcher */}
      <div style={{ display:'flex',gap:0,marginBottom:'1.5rem',background:'#f4f6fb',borderRadius:12,padding:4 }}>
        {[['form','Submit Concern'],['track','Track Status']].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={{
            flex:1,padding:'9px 12px',borderRadius:8,border:'none',cursor:'pointer',
            fontWeight:700,fontSize:'.85rem',fontFamily:'inherit',transition:'all .15s',
            background:view===k?'#fff':'transparent',
            color:view===k?'#C8102E':'#6b7280',
            boxShadow:view===k?'0 1px 4px rgba(0,0,0,.08)':'none',
          }}>{l}</button>
        ))}
      </div>

      {view === 'form' && (
        submitted ? (
          <div style={{ background:'#edf7f1',border:'1.5px solid #bbf7d0',borderRadius:14,padding:'2rem',textAlign:'center' }}>
            <div style={{fontSize:'2.5rem',marginBottom:'.75rem'}}>✅</div>
            <p style={{margin:'0 0 .5rem',fontWeight:800,color:'#166534'}}>Concern Submitted!</p>
            <p style={{margin:'0 0 .75rem',fontSize:'.86rem',color:'#166534'}}>Your reference number:</p>
            <div style={{display:'inline-block',background:'#fff',border:'2px solid #10813f',borderRadius:10,padding:'8px 24px',fontWeight:900,fontSize:'1.1rem',color:'#002280',letterSpacing:1}}>{submitted.reference_no}</div>
            <p style={{margin:'.75rem 0 0',fontSize:'.78rem',color:'#6b7280'}}>Save this to track your concern.</p>
            <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:'1rem',flexWrap:'wrap'}}>
              <button onClick={()=>setSubmitted(null)} style={{padding:'8px 20px',borderRadius:8,border:'none',background:'#002280',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Submit Another</button>
              <button onClick={()=>{setRefInput(submitted.reference_no);setView('track');}} style={{padding:'8px 20px',borderRadius:8,border:'1.5px solid #002280',background:'#fff',color:'#002280',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Track It</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:12}}>
            {formErr&&<div style={{background:'#fee2e2',color:'#991b1b',borderRadius:8,padding:'8px 12px',fontSize:'.84rem',fontWeight:600}}>{formErr}</div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={{display:'block',marginBottom:4,fontSize:'.74rem',fontWeight:700,color:'#64748b'}}>Category *</label>
                <select style={inp} value={form.category} onChange={f('category')}>
                  {CONCERN_CATS.map(c=><option key={c} value={c}>{c.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',marginBottom:4,fontSize:'.74rem',fontWeight:700,color:'#64748b'}}>Subject *</label>
                <input style={inp} value={form.subject} onChange={f('subject')} placeholder="Brief description" required/>
              </div>
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:'.74rem',fontWeight:700,color:'#64748b'}}>Description *</label>
              <textarea style={{...inp,height:90,resize:'vertical'}} value={form.description} onChange={f('description')} placeholder="Describe your concern in detail…" required/>
            </div>
            <label style={{display:'flex',alignItems:'center',gap:9,cursor:'pointer',userSelect:'none'}}>
              <input type="checkbox" checked={form.is_anonymous} onChange={f('is_anonymous')} style={{width:15,height:15,accentColor:'#C8102E'}}/>
              <span style={{fontSize:'.87rem',fontWeight:600,color:'#374151'}}>Submit anonymously</span>
            </label>
            {!form.is_anonymous&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><label style={{display:'block',marginBottom:4,fontSize:'.74rem',fontWeight:700,color:'#64748b'}}>Your Name</label><input style={inp} value={form.submitter_name} onChange={f('submitter_name')} placeholder="Full name"/></div>
                <div><label style={{display:'block',marginBottom:4,fontSize:'.74rem',fontWeight:700,color:'#64748b'}}>Email (optional)</label><input type="email" style={inp} value={form.submitter_email} onChange={f('submitter_email')} placeholder="email@example.com"/></div>
              </div>
            )}
            <button type="submit" disabled={submitting} style={{padding:'12px',borderRadius:10,border:'none',background:'#C8102E',color:'#fff',fontSize:'.9rem',fontWeight:800,cursor:'pointer',fontFamily:'inherit',opacity:submitting?.6:1}}>
              {submitting?'Submitting…':'Submit Concern'}
            </button>
          </form>
        )
      )}

      {view === 'track' && (
        <div>
          <form onSubmit={handleTrack} style={{display:'flex',gap:8,marginBottom:'1.25rem'}}>
            <input style={{...inp,flex:1}} value={refInput} onChange={e=>setRefInput(e.target.value.toUpperCase())} placeholder="CDN-YYYYMMDD-XXXX"/>
            <button type="submit" disabled={trackLoad} style={{padding:'10px 20px',borderRadius:8,border:'none',background:'#C8102E',color:'#fff',fontSize:'.87rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',opacity:trackLoad?.6:1}}>
              {trackLoad?'…':'Track'}
            </button>
          </form>
          {trackErr&&<div style={{background:'#fee2e2',color:'#991b1b',borderRadius:9,padding:'9px 13px',fontSize:'.84rem',fontWeight:600,marginBottom:'1rem'}}>{trackErr}</div>}
          {tracking&&(
            <div style={{background:'#f8f9fc',border:'1.5px solid #e8edf5',borderRadius:14,padding:'1.25rem'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
                <div>
                  <p style={{margin:0,fontWeight:800,fontSize:'.97rem',color:'#0F1422'}}>{tracking.reference_no}</p>
                  <p style={{margin:'3px 0 0',fontSize:'.78rem',color:'#9ca3af'}}>{tracking.category?.replace(/_/g,' ')} · {fmtDate(tracking.created_at)}</p>
                </div>
                <span style={{fontSize:'.72rem',fontWeight:800,padding:'4px 12px',borderRadius:20,background:(STEP_COLORS[tracking.status]||'#6b7280')+'18',color:STEP_COLORS[tracking.status]||'#6b7280',textTransform:'capitalize'}}>{tracking.status?.replace(/_/g,' ')}</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:0}}>
                {CONCERN_STEPS.map((step,i)=>{
                  const done=i<=stepIdx; const cur=i===stepIdx;
                  return(
                    <div key={step} style={{display:'flex',alignItems:'flex-start',gap:10,paddingBottom:i<CONCERN_STEPS.length-1?'.65rem':0}}>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0}}>
                        <div style={{width:20,height:20,borderRadius:'50%',border:`2px solid ${done?'#10813f':'#e2e8f0'}`,background:done?'#10813f':'#fff',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:cur?'0 0 0 4px rgba(16,129,63,.15)':'none'}}>
                          {done&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        {i<CONCERN_STEPS.length-1&&<div style={{width:2,flex:1,minHeight:16,background:done?'#10813f':'#e2e8f0',marginTop:2}}/>}
                      </div>
                      <p style={{margin:'1px 0 0',fontSize:'.81rem',fontWeight:cur?800:600,color:cur?'#10813f':done?'#374151':'#9ca3af',textTransform:'capitalize'}}>{step.replace(/_/g,' ')}</p>
                    </div>
                  );
                })}
              </div>
              {tracking.resolution_note&&(
                <div style={{marginTop:'1rem',background:'#edf7f1',borderRadius:10,padding:'10px 14px'}}>
                  <p style={{margin:'0 0 4px',fontSize:'.72rem',fontWeight:800,color:'#10813f',textTransform:'uppercase',letterSpacing:'.05em'}}>Resolution Note</p>
                  <p style={{margin:0,fontSize:'.86rem',color:'#166534',lineHeight:1.5}}>{tracking.resolution_note}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   PARTICIPATION MODAL CONTENT
═══════════════════════════════════════════════════════════ */
const ParticipationContent = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [active,    setActive]    = useState(null);
  const [answers,   setAnswers]   = useState({});
  const [submitting,setSubmitting]= useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(()=>{
    getPublishedConsultations().then(setConsultations).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const openConsultation = async (c) => {
    try{ const full=await getConsultationWithQuestions(c.id); setActive(full);setAnswers({});setSubmitted(false); }
    catch(e){alert(e.message);}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();setSubmitting(true);
    try{
      await submitResponse(active.id,(active.questions||[]).map(q=>({question_id:q.id,answer:answers[q.id]||'',is_anonymous:true})));
      setSubmitted(true);
    }catch(err){alert(err.message);}
    finally{setSubmitting(false);}
  };

  if (active) return (
    <div>
      <button onClick={()=>setActive(null)} style={{display:'inline-flex',alignItems:'center',gap:6,background:'none',border:'none',color:'#C8960C',fontWeight:700,fontSize:'.87rem',cursor:'pointer',fontFamily:'inherit',marginBottom:'1.25rem',padding:0}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>
      {submitted?(
        <div style={{background:'#edf7f1',border:'1.5px solid #bbf7d0',borderRadius:14,padding:'2rem',textAlign:'center'}}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#10813f" strokeWidth="2" style={{marginBottom:12}}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <p style={{margin:0,fontWeight:800,color:'#166534'}}>Response submitted! Thank you.</p>
          <button onClick={()=>setActive(null)} style={{marginTop:16,padding:'9px 20px',borderRadius:8,border:'none',background:'#002280',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Back</button>
        </div>
      ):(
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
          <div>
            <h3 style={{margin:'0 0 4px',fontSize:'1.05rem',fontWeight:900,color:'#0F1422'}}>{active.title}</h3>
            {active.description&&<p style={{margin:0,fontSize:'.88rem',color:'#6b7280',lineHeight:1.6}}>{active.description}</p>}
          </div>
          {(active.questions||[]).map((q,i)=>(
            <div key={q.id} style={{background:'#f8f9fc',border:'1px solid #e8edf5',borderRadius:12,padding:'1rem 1.25rem'}}>
              <label style={{display:'block',marginBottom:8,fontSize:'.9rem',fontWeight:700,color:'#0F1422'}}>
                {i+1}. {q.question_text} {q.is_required&&<span style={{color:'#C8102E'}}>*</span>}
              </label>
              {q.question_type==='text'&&<textarea style={{...inp,height:72,resize:'vertical'}} value={answers[q.id]||''} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))} required={q.is_required}/>}
              {q.question_type==='yes_no'&&(
                <div style={{display:'flex',gap:12}}>
                  {['Yes','No'].map(opt=>(
                    <label key={opt} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                      <input type="radio" name={`q_${q.id}`} value={opt} checked={answers[q.id]===opt} onChange={()=>setAnswers(p=>({...p,[q.id]:opt}))} required={q.is_required} style={{accentColor:'#C8960C'}}/>
                      <span style={{fontSize:'.9rem',fontWeight:600,color:'#374151'}}>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {(q.question_type==='single_choice'||q.question_type==='multiple_choice')&&(
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {(q.options||[]).map(opt=>(
                    <label key={opt} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                      <input
                        type={q.question_type==='multiple_choice'?'checkbox':'radio'}
                        name={`q_${q.id}`} value={opt}
                        checked={q.question_type==='multiple_choice'?(answers[q.id]||[]).includes(opt):answers[q.id]===opt}
                        onChange={()=>{ if(q.question_type==='multiple_choice'){const c=answers[q.id]||[];setAnswers(p=>({...p,[q.id]:c.includes(opt)?c.filter(v=>v!==opt):[...c,opt]}));}else{setAnswers(p=>({...p,[q.id]:opt}));} }}
                        style={{accentColor:'#C8960C'}}
                      />
                      <span style={{fontSize:'.9rem',fontWeight:600,color:'#374151'}}>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.question_type==='rating'&&(
                <div style={{display:'flex',gap:8}}>
                  {[1,2,3,4,5].map(n=>(
                    <button type="button" key={n} onClick={()=>setAnswers(p=>({...p,[q.id]:String(n)}))} style={{width:40,height:40,borderRadius:'50%',border:'2px solid',borderColor:answers[q.id]===String(n)?'#C8960C':'#e2e8f0',background:answers[q.id]===String(n)?'#C8960C':'#fff',color:answers[q.id]===String(n)?'#fff':'#374151',fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>{n}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button type="submit" disabled={submitting} style={{padding:'13px',borderRadius:10,border:'none',background:'#C8960C',color:'#fff',fontSize:'.9rem',fontWeight:800,cursor:'pointer',fontFamily:'inherit',opacity:submitting?.6:1}}>
            {submitting?'Submitting…':'Submit Response'}
          </button>
        </form>
      )}
    </div>
  );

  return loading ? (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {[...Array(3)].map((_,i)=><div key={i} style={{height:72,borderRadius:12,background:'#f1f5f9'}}/>)}
    </div>
  ) : consultations.length === 0 ? (
    <div style={{textAlign:'center',padding:'3rem',color:'#9ca3af'}}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginBottom:10,opacity:.4}}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      <p style={{margin:0,fontWeight:700}}>No active consultations right now.</p>
      <p style={{margin:'6px 0 0',fontSize:'.86rem'}}>Check back soon for upcoming surveys.</p>
    </div>
  ) : (
    <div style={{display:'flex',flexDirection:'column',gap:'.85rem'}}>
      {consultations.map(c=>(
        <div key={c.id} style={{background:'#f8f9fc',border:'1.5px solid #e8edf5',borderRadius:14,padding:'1.1rem 1.25rem',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem'}}>
          <div style={{minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
              <span style={{fontSize:'.67rem',fontWeight:800,padding:'3px 9px',borderRadius:20,textTransform:'capitalize',background:'#fdf8ec',color:'#C8960C'}}>{c.type}</span>
              {c.closes_at&&<span style={{fontSize:'.72rem',color:'#9ca3af',fontWeight:600}}>Closes {fmtDate(c.closes_at)}</span>}
            </div>
            <p style={{margin:'0 0 3px',fontWeight:800,fontSize:'.95rem',color:'#0F1422'}}>{c.title}</p>
            {c.description&&<p style={{margin:0,fontSize:'.83rem',color:'#6b7280',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{c.description}</p>}
          </div>
          <button onClick={()=>openConsultation(c)} style={{padding:'9px 18px',borderRadius:9,border:'none',background:'#C8960C',color:'#fff',fontWeight:700,fontSize:'.84rem',cursor:'pointer',fontFamily:'inherit',flexShrink:0,whiteSpace:'nowrap'}}>
            Participate
          </button>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   STATS BAR
═══════════════════════════════════════════════════════════ */
const StatsBar = () => {
  const [stats, setStats] = useState(null);
  useEffect(()=>{
    Promise.all([getDocumentStats(),getConcernStats(),getParticipationStats()])
      .then(([d,c,p])=>setStats({docs:d.published,concerns:c.open,consultations:p.active}))
      .catch(()=>{});
  },[]);
  const items = [
    { label:'Published Documents', value:stats?.docs??'—',          color:'#002280', bg:'#eef1fb', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 13h8v1.5H8V13zm0 3h5v1.5H8V16zm0-6h3v1.5H8V10z"/></svg> },
    { label:'Open Concerns',        value:stats?.concerns??'—',      color:'#C8102E', bg:'#fdf0f2', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/><path d="M7 9h10v2H7zm0 4h7v2H7z"/></svg> },
    { label:'Active Consultations', value:stats?.consultations??'—', color:'#C8960C', bg:'#fdf8ec', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'3rem' }}>
      {items.map(item=>(
        <div key={item.label} style={{ background:'#fff', border:'1.5px solid #e8edf5', borderRadius:14, padding:'1.1rem 1.25rem', display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{ width:42,height:42,borderRadius:11,background:item.bg,color:item.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>{item.icon}</div>
          <div>
            <p style={{ margin:0, fontSize:'1.5rem', fontWeight:900, color:'#0F1422', lineHeight:1 }}>
              {stats===null?<span style={{display:'inline-block',width:36,height:22,borderRadius:6,background:'#f1f5f9',animation:'gov-shimmer 1.4s infinite'}}/>:item.value}
            </p>
            <p style={{ margin:'3px 0 0', fontSize:'.75rem', fontWeight:700, color:'#9ca3af' }}>{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN SECTION
═══════════════════════════════════════════════════════════ */
const PILLARS = [
  {
    key: 'transparency', color:'#002280', bg:'#eef1fb',
    title:'Transparency', btnLabel:'View Public Documents',
    desc:'Public access to institutional information published by the college\'s authorized information officer — viewable and downloadable without an account.',
    features:['Academic programs & admission requirements','Enrollment and institutional statistics','Laboratory equipment & resource inventory','Accomplishment reports & approved budgets','Partnerships, projects & annual history'],
    icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 13h8v1.5H8V13zm0 3h5v1.5H8V16zm0-6h3v1.5H8V10z"/></svg>,
    modalTitle:'Public Documents — Transparency',
  },
  {
    key: 'accountability', color:'#C8102E', bg:'#fdf0f2',
    title:'Accountability', btnLabel:'Submit or Track a Concern',
    desc:'Submit concerns or suggestions and track institutional responses in real time. Every submission is routed to the responsible office with a unique reference number.',
    features:['Online concern & feedback form','Auto-generated tracking reference number','Assigned to appropriate office','Real-time status updates & deadlines','Public overdue-action dashboard'],
    icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99L7 9.5l1.41-1.41L12 11.17l3.59-3.58L17 9l-5 5z"/></svg>,
    modalTitle:'Concerns & Feedback — Accountability',
  },
  {
    key: 'participation', color:'#C8960C', bg:'#fdf8ec',
    title:'Participation', btnLabel:'Join Active Consultations',
    desc:'Students, parents, faculty, CSOs, and community members can join surveys and consultations to shape college programs and services.',
    features:['Online surveys & consultations','Program & facility improvement suggestions','Consultation schedules & documented minutes','Responses: accepted, deferred, or rejected','Records of how input influenced decisions'],
    icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
    modalTitle:'Surveys & Consultations — Participation',
  },
];

const GovernanceSection = () => {
  const [openModal, setOpenModal] = useState(null); // 'transparency' | 'accountability' | 'participation' | null

  return (
    <section id="governance" style={{ background:'#f8f9fc', padding:'5.5rem 0 4rem', borderTop:'1px solid #f1f5f9' }}>
      <div className="cdn-container">

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'3rem' }}>
          <span style={{ display:'inline-flex',alignItems:'center',gap:7,background:'#eef1fb',border:'1px solid rgba(0,34,128,.12)',borderRadius:999,padding:'5px 18px',marginBottom:'1.1rem',fontSize:'.68rem',fontWeight:800,letterSpacing:'1.8px',textTransform:'uppercase',color:'#002280' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            CDN OPEN Governance System
          </span>
          <h2 style={{ margin:'0 0 .9rem', fontSize:'clamp(1.6rem,3.5vw,2.3rem)', fontWeight:900, color:'#0F1422', letterSpacing:'-.5px' }}>
            Transparency · Accountability · Participation
          </h2>
          <p style={{ margin:'0 auto', maxWidth:560, fontSize:'.97rem', color:'#6b7280', lineHeight:1.75 }}>
            CDN promotes open governance through accessible public information, stakeholder feedback, and meaningful community participation.
          </p>
        </div>

        {/* Stats */}
        <StatsBar />

        {/* Pillar cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'1.25rem', marginBottom:'3rem' }}>
          {PILLARS.map(p => (
            <div key={p.key} style={{ background:'#fff', border:'1.5px solid #e8edf5', borderRadius:18, padding:'1.75rem', display:'flex', flexDirection:'column', gap:'1rem', transition:'box-shadow .2s,transform .2s' }}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 8px 32px ${p.color}22`;e.currentTarget.style.transform='translateY(-4px)';}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}
            >
              <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                <div style={{ width:52,height:52,borderRadius:14,background:p.bg,color:p.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>{p.icon}</div>
                <div>
                  <p style={{ margin:0, fontSize:'1.05rem', fontWeight:900, color:'#0F1422' }}>{p.title}</p>
                  <p style={{ margin:'3px 0 0', fontSize:'.78rem', color:'#9ca3af', fontWeight:600 }}>CDN OPEN Portal</p>
                </div>
              </div>
              <p style={{ margin:0, fontSize:'.88rem', color:'#6b7280', lineHeight:1.7 }}>{p.desc}</p>
              <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:'.5rem' }}>
                {p.features.map(f=>(
                  <li key={f} style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:'.82rem', color:'#374151', fontWeight:600 }}>
                    <svg style={{ width:14,height:14,color:p.color,flexShrink:0,marginTop:2 }} viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              {/* Button opens modal */}
              <button
                onClick={() => setOpenModal(p.key)}
                style={{ marginTop:'auto', padding:'11px 0', borderRadius:10, border:'none', background:p.color, color:'#fff', fontSize:'.87rem', fontWeight:800, cursor:'pointer', fontFamily:'inherit', transition:'opacity .15s' }}
                onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}
              >
                {p.btnLabel} →
              </button>
            </div>
          ))}
        </div>

        {/* Municipal Portals */}
        <div style={{ marginBottom:'3rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem', flexWrap:'wrap', gap:'.75rem' }}>
            <div>
              <p style={{ margin:0, fontSize:'1.05rem', fontWeight:800, color:'#0F1422' }}>Municipal & Government Portals</p>
              <p style={{ margin:'3px 0 0', fontSize:'.82rem', color:'#9ca3af' }}>Linked official services for Naujan residents and CDN stakeholders</p>
            </div>
            <div style={{ background:'#fdf8ec', border:'1px solid rgba(200,150,12,.2)', borderRadius:8, padding:'6px 14px', fontSize:'.75rem', color:'#92400e', fontWeight:600 }}>⚠️ External — opens in new tab</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'.85rem' }}>
            {MUNICIPAL_PORTALS.map(portal=>{
              const pc=PORTAL_COLORS[portal.category]||{color:'#374151',bg:'#f3f4f6'};
              const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(portal.url).hostname}&sz=64`;
              return (
                <a key={portal.name} href={portal.url} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex',flexDirection:'column',gap:'.55rem',background:'#fff',border:'1.5px solid #e8edf5',borderRadius:12,padding:'.95rem 1.1rem',textDecoration:'none',transition:'box-shadow .18s,transform .18s' }}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 4px 16px ${pc.color}20`;e.currentTarget.style.transform='translateY(-2px)';}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}
                >
                  {/* Logo + category row */}
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:6 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <img
                        src={faviconUrl}
                        alt={portal.name}
                        width={28} height={28}
                        style={{ borderRadius:6, objectFit:'contain', background:'#f8fafc', border:'1px solid #e8edf5', padding:2 }}
                        onError={e=>{ e.currentTarget.style.display='none'; }}
                      />
                      <span style={{ fontSize:'.62rem',fontWeight:800,padding:'2px 8px',borderRadius:20,textTransform:'uppercase',letterSpacing:'.04em',background:pc.bg,color:pc.color }}>{portal.category}</span>
                    </div>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </div>
                  <p style={{ margin:0,fontWeight:800,fontSize:'.87rem',color:'#0F1422',lineHeight:1.3 }}>{portal.name}</p>
                  <p style={{ margin:0,fontSize:'.73rem',color:'#6b7280',fontWeight:600 }}>{portal.office}</p>
                </a>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background:'linear-gradient(130deg,#001158 0%,#002280 60%,#0038d4 100%)', borderRadius:18, padding:'2.5rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1.5rem', flexWrap:'wrap' }}>
          <div>
            <p style={{ margin:'0 0 .4rem', fontSize:'1.1rem', fontWeight:900, color:'#fff' }}>Explore the full CDN OPEN Governance Portal</p>
            <p style={{ margin:0, fontSize:'.88rem', color:'rgba(255,255,255,.65)', lineHeight:1.6 }}>View all public documents, track concerns, join active surveys, and access government services.</p>
          </div>
          <Link to="/governance" style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'12px 28px',borderRadius:10,background:'#fff',color:'#002280',fontWeight:800,fontSize:'.92rem',textDecoration:'none',whiteSpace:'nowrap',flexShrink:0 }}
            onMouseEnter={e=>e.currentTarget.style.opacity='.9'}
            onMouseLeave={e=>e.currentTarget.style.opacity='1'}
          >
            Open Full Portal
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>

      {/* ── Modals ── */}
      {PILLARS.map(p => (
        <Modal key={p.key} open={openModal===p.key} onClose={()=>setOpenModal(null)} title={p.modalTitle} color={p.color} icon={p.icon}>
          {p.key==='transparency'   && <TransparencyContent/>}
          {p.key==='accountability' && <AccountabilityContent/>}
          {p.key==='participation'  && <ParticipationContent/>}
        </Modal>
      ))}

      <style>{`
        @keyframes gov-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes gov-modal-in { from{opacity:0} to{opacity:1} }
        @keyframes gov-modal-up { from{opacity:0;transform:translateY(24px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </section>
  );
};

export default GovernanceSection;
