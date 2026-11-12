/**
 * GovernancePage — Admin-only "Governance" tab
 * Three sub-tabs: Documents (Transparency) · Concerns (Accountability) · Consultations (Participation)
 * Follows existing db-home-content / sl-* / db-stat-card conventions.
 *
 * Single default export: GovernancePage ({ user }).
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  getAllDocuments, createDocument, updateDocument, publishDocument, archiveDocument, getDocumentStats,
  getAllConcerns, updateConcernStatus, getConcernStats,
  getAllConsultations, createConsultation, updateConsultation, getParticipationStats,
  addQuestion, getConsultationWithQuestions, getConsultationStats,
  uploadGovernanceFile,
} from '../../../lib/governance';
import { supabase } from '../../../lib/supabase';
import { logActivity } from '../../../lib/activityLogger';

/* ═══════════════════════════════════════════════════════════
   SHARED CONSTANTS & HELPERS
═══════════════════════════════════════════════════════════ */
const DOC_CATEGORIES = [
  { value: 'all',                label: 'All Categories' },
  { value: 'academic_programs',  label: 'Academic Programs' },
  { value: 'enrollment_stats',   label: 'Enrollment Statistics' },
  { value: 'budget_reports',     label: 'Budget Reports' },
  { value: 'accomplishments',    label: 'Accomplishments' },
  { value: 'projects',           label: 'Projects' },
  { value: 'partnerships',       label: 'Partnerships' },
  { value: 'announcements',      label: 'Announcements' },
  { value: 'official_documents', label: 'Official Documents' },
  { value: 'historical_records', label: 'Historical Records' },
  { value: 'other',              label: 'Other' },
];
const DOC_CATS_NO_ALL = DOC_CATEGORIES.filter(c => c.value !== 'all');

const CONCERN_STATUSES  = ['all','submitted','received','assigned','under_review','action_in_progress','resolved','closed','rejected'];
const CONCERN_STEPS     = ['submitted','received','assigned','under_review','action_in_progress','resolved','closed'];
const CONCERN_CATEGORIES= ['all','academic_services','enrollment_services','laboratory_facilities','campus_maintenance','institutional_programs','administrative_services','other'];
const CONSULT_TYPES     = ['survey','consultation','proposal'];
const CONSULT_Q_TYPES    = ['text','yes_no','single_choice','multiple_choice','rating'];

const PRIORITY_COLORS = { low:'#10813f', normal:'#002280', high:'#C8960C', urgent:'#C8102E' };
const PRIORITY_BG     = { low:'#edf7f1', normal:'#eef1fb', high:'#fdf8ec', urgent:'#fdf0f2' };
const STATUS_COLORS   = {
  draft:'#6b7280', submitted:'#C8960C', approved:'#002280', published:'#10813f', archived:'#9ca3af',
  received:'#C8960C', assigned:'#7c3aed', under_review:'#002280', action_in_progress:'#0891b2',
  resolved:'#10813f', closed:'#6b7280', rejected:'#C8102E', reopened:'#C8960C',
};
const STATUS_BG = {
  draft:'#f3f4f6', submitted:'#fdf8ec', approved:'#eef1fb', published:'#edf7f1', archived:'#f9fafb',
  received:'#fdf8ec', assigned:'#f5f0ff', under_review:'#eef1fb', action_in_progress:'#ecf8fb',
  resolved:'#edf7f1', closed:'#f3f4f6', rejected:'#fdf0f2', reopened:'#fdf8ec',
};
const TYPE_COLORS = { survey:'#002280', consultation:'#7c3aed', proposal:'#C8960C' };
const TYPE_BG     = { survey:'#eef1fb', consultation:'#f5f0ff', proposal:'#fdf8ec' };

const DOC_PIPELINE = ['draft','submitted','approved','published','archived'];
const STATUS_TABS  = ['all','draft','published','archived'];

const Badge = ({ label, color, bg }) => (
  <span style={{
    display:'inline-flex', alignItems:'center',
    fontSize:'.67rem', fontWeight:700, padding:'3px 9px',
    borderRadius:20, textTransform:'capitalize', whiteSpace:'nowrap',
    color: color || STATUS_COLORS[label] || '#6b7280',
    background: bg || STATUS_BG[label] || '#f3f4f6',
  }}>{(label || '').replace(/_/g,' ')}</span>
);

const inp = {
  width:'100%', padding:'9px 11px', borderRadius:8,
  border:'1.5px solid #e2e8f0', fontSize:'.87rem',
  outline:'none', boxSizing:'border-box',
  background:'#fafafa', color:'#1e293b', fontFamily:'inherit',
};
const labelSt = { display:'block', marginBottom:4, fontSize:'.74rem', fontWeight:700, color:'#64748b' };

const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-PH',{ month:'short', day:'numeric', year:'numeric' }) : '—';
const fmtTs   = iso => iso ? new Date(iso).toLocaleString('en-PH',{ month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const timeAgo = iso => {
  if (!iso) return '—';
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60)       return 'just now';
  if (d < 3600)     return Math.floor(d/60) + 'm ago';
  if (d < 86400)    return Math.floor(d/3600) + 'h ago';
  if (d < 604800)   return Math.floor(d/86400) + 'd ago';
  if (d < 2592000)  return Math.floor(d/604800) + 'w ago';
  return Math.floor(d/2592000) + 'mo ago';
};
const isOverdue = c => c.target_deadline && new Date(c.target_deadline) < new Date(new Date().toDateString()) && !['resolved','closed','rejected'].includes(c.status);

/* File helpers (kept from prior implementation) */
const ACCEPTED_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg';
const FILE_ICONS = {
  pdf:  { color:'#C8102E', bg:'#fdf0f2', label:'PDF' },
  doc:  { color:'#002280', bg:'#eef1fb', label:'DOC' },
  docx: { color:'#002280', bg:'#eef1fb', label:'DOCX' },
  ppt:  { color:'#b45309', bg:'#fdf8ec', label:'PPT' },
  pptx: { color:'#b45309', bg:'#fdf8ec', label:'PPTX' },
  xls:  { color:'#10813f', bg:'#edf7f1', label:'XLS' },
  xlsx: { color:'#10813f', bg:'#edf7f1', label:'XLSX' },
};
const getFileIcon = name => {
  const ext = (name || '').split('.').pop().toLowerCase();
  return FILE_ICONS[ext] || { color:'#6b7280', bg:'#f3f4f6', label:(ext.toUpperCase() || 'FILE') };
};
const fmtFileSize = bytes => {
  if (!bytes) return '';
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/* small inline-styled buttons */
const pillBtn = active => ({
  padding:'5px 11px', borderRadius:8, border:`1.5px solid ${active ? '#002280' : '#e2e8f0'}`,
  background: active ? '#002280' : '#fff', color: active ? '#fff' : '#64748b',
  fontSize:'.74rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
  transition:'all .15s',
});
const quickAct = (active, color) => ({
  display:'inline-flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:8,
  border:`1.5px solid ${active ? color : '#e2e8f0'}`, background: active ? color : '#fff',
  color: active ? '#fff' : '#475569', fontSize:'.74rem', fontWeight:700,
  cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', transition:'all .15s',
});
const statTile = () => ({
  background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10,
  padding:'10px 6px', textAlign:'center', display:'flex', flexDirection:'column', gap:2,
});
const tileVal = (c) => ({ margin:0, fontSize:'1.2rem', fontWeight:900, color:c, lineHeight:1 });
const tileLbl = { margin:0, fontSize:'.68rem', fontWeight:600, color:'#94a3b8' };

/* ═══════════════════════════════════════════════════════════
   TRANSPARENCY (DOCUMENTS) SUB-TAB
═══════════════════════════════════════════════════════════ */
const TransparencyTab = ({ user }) => {
  const [docs,         setDocs]         = useState([]);
  const [stats,        setStats]        = useState({});
  const [loading,      setLoading]      = useState(true);
  const [catFilter,    setCatFilter]    = useState('all');
  const [statusTab,    setStatusTab]    = useState('all');
  const [search,       setSearch]       = useState('');
  const [modal,        setModal]        = useState(false);   // create modal
  const [editDoc,      setEditDoc]      = useState(null);     // doc being edited
  const [saving,       setSaving]       = useState(false);
  const [toast,       setToast]        = useState(null);
  const [sel,         setSel]          = useState(() => new Set()); // bulk selection

  /* upload state (shared across create & edit modals — only one open at a time) */
  const [pickedFile,     setPickedFile]     = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadErr,      setUploadErr]      = useState('');
  const [isDragging,     setIsDragging]    = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title:'', body:'', category:'other', academic_year:'',
    responsible_office:'', status:'draft', file_url:'',
  });

  const showToast = useCallback((msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([getAllDocuments(), getDocumentStats()]);
      setDocs(d); setStats(s);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);   // eslint-disable-line

  const filtered = useMemo(() => {
    let d = docs;
    if (catFilter !== 'all')  d = d.filter(x => x.category === catFilter);
    if (statusTab !== 'all')  d = d.filter(x => x.status === statusTab);
    if (search) { const q = search.toLowerCase(); d = d.filter(x => (x.title || '').toLowerCase().includes(q)); }
    return d;
  }, [docs, catFilter, statusTab, search]);

  /* ── file pick helpers (kept exactly as the prior logic) ── */
  const pickFile = (file) => {
    if (!file) return;
    const maxMB = 20;
    if (file.size > maxMB * 1024 * 1024) { setUploadErr(`File is too large (max ${maxMB} MB).`); return; }
    setUploadErr(''); setPickedFile(file); setUploadProgress(0);
    setForm(p => ({ ...p, title: p.title || file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') }));
  };
  const onFileInput = e => pickFile(e.target.files?.[0]);
  const onDrop      = e => { e.preventDefault(); setIsDragging(false); pickFile(e.dataTransfer.files?.[0]); };
  const onDragOver  = e => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = ()  => setIsDragging(false);
  const clearFile   = ()  => { setPickedFile(null); setUploadProgress(0); setUploadErr(''); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const openCreate = () => {
    setForm({ title:'', body:'', category:'other', academic_year:'', responsible_office:'', status:'draft', file_url:'' });
    clearFile();
    setModal(true);
  };
  const openEdit = (doc) => {
    setForm({
      title: doc.title || '', body: doc.body || '', category: doc.category || 'other',
      academic_year: doc.academic_year || '', responsible_office: doc.responsible_office || '',
      status: doc.status || 'draft', file_url: doc.file_url || '',
    });
    clearFile();
    setEditDoc(doc);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title) return;
    setSaving(true); setUploadErr('');
    try {
      let file_url = form.file_url || '';
      if (pickedFile) file_url = await uploadGovernanceFile(pickedFile, 'transparency', pct => setUploadProgress(pct));
      await createDocument({ ...form, file_url, created_by: user?.username });
      await logActivity('document_created', `Created: ${form.title}`, user?.username, 'success', 'Governance');
      showToast('Document saved.');
      setModal(false); load();
    } catch (e) {
      setUploadErr(e.message || 'Upload failed. Check storage bucket permissions.');
    } finally { setSaving(false); }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editDoc || !form.title) return;
    setSaving(true); setUploadErr('');
    try {
      let file_url = form.file_url || '';
      if (pickedFile) file_url = await uploadGovernanceFile(pickedFile, 'transparency', pct => setUploadProgress(pct));
      const updates = { ...form, file_url };
      await updateDocument(editDoc.id, updates);
      await logActivity('document_updated', `Updated: ${form.title}`, user?.username, 'success', 'Governance');
      showToast('Document updated.');
      setEditDoc(null); load();
    } catch (e) {
      setUploadErr(e.message || 'Update failed.');
    } finally { setSaving(false); }
  };

  const handleApprove = async (doc) => {
    try { await updateDocument(doc.id, { status:'approved' });
      await logActivity('document_approved', `Approved: ${doc.title}`, user?.username, 'success', 'Governance');
      showToast('Document approved.'); load();
    } catch (e) { showToast(e.message, 'error'); }
  };
  const handlePublish = async (doc) => {
    try { await publishDocument(doc.id, user?.username);
      await logActivity('document_published', `Published: ${doc.title}`, user?.username, 'success', 'Governance');
      showToast(`"${doc.title}" published.`); load();
    } catch (e) { showToast(e.message, 'error'); }
  };
  const handlePublishNow = async (doc) => {
    try { await publishDocument(doc.id, user?.username);
      await logActivity('document_published', `Published: ${doc.title}`, user?.username, 'success', 'Governance');
      showToast(`"${doc.title}" published.`); load();
    } catch (e) { showToast(e.message, 'error'); }
  };
  const handleArchive = async (doc) => {
    try { await archiveDocument(doc.id);
      await logActivity('document_archived', `Archived: ${doc.title}`, user?.username, 'success', 'Governance');
      showToast(`"${doc.title}" archived.`); load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const toggleSel = (id) => setSel(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const allChecked = filtered.length > 0 && filtered.every(d => sel.has(d.id));
  const toggleAll = () => setSel(prev => {
    const n = new Set(prev);
    if (filtered.every(d => n.has(d.id))) filtered.forEach(d => n.delete(d.id));
    else filtered.forEach(d => n.add(d.id));
    return n;
  });
  const bulkPublish = async () => {
    try {
      await Promise.all([...sel].map(id => publishDocument(id, user?.username)));
      await logActivity('document_published', `Bulk published ${sel.size} documents`, user?.username, 'success', 'Governance');
      showToast(`${sel.size} document(s) published.`); setSel(new Set()); load();
    } catch (e) { showToast(e.message, 'error'); }
  };
  const bulkArchive = async () => {
    try {
      await Promise.all([...sel].map(id => archiveDocument(id)));
      await logActivity('document_archived', `Bulk archived ${sel.size} documents`, user?.username, 'success', 'Governance');
      showToast(`${sel.size} document(s) archived.`); setSel(new Set()); load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  /* reusable upload zone + picked-file card (logic kept as-is) */
  const renderDropZone = () => (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
      style={{
        border:`2px dashed ${isDragging ? '#002280' : '#cbd5e1'}`, borderRadius:12,
        padding:'1.6rem 1rem', textAlign:'center', cursor:'pointer',
        background: isDragging ? '#eef1fb' : '#fafafa', transition:'all .15s',
      }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isDragging?'#002280':'#94a3b8'} strokeWidth="1.5" style={{marginBottom:8}}>
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      <p style={{margin:'0 0 4px',fontWeight:700,fontSize:'.88rem',color: isDragging?'#002280':'#374151'}}>
        {isDragging ? 'Drop to attach' : 'Drag & drop a file here'}
      </p>
      <p style={{margin:0,fontSize:'.78rem',color:'#9ca3af'}}>or <span style={{color:'#002280',fontWeight:700}}>click to browse</span></p>
      <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} style={{display:'none'}} onChange={onFileInput}/>
    </div>
  );
  const renderPickedCard = () => {
    const fi = pickedFile ? getFileIcon(pickedFile.name) : null;
    return (
      <div style={{ border:'1.5px solid #e2e8f0', borderRadius:12, padding:'0.9rem 1rem', background:'#fafafa', display:'flex', alignItems:'center', gap:'0.85rem' }}>
        <div style={{ width:42, height:42, borderRadius:10, flexShrink:0, background:fi.bg, color:fi.color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'.72rem', letterSpacing:'.03em' }}>{fi.label}</div>
        <div style={{flex:1, minWidth:0}}>
          <p style={{margin:'0 0 2px',fontWeight:700,fontSize:'.87rem',color:'#0F1422',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{pickedFile.name}</p>
          <p style={{margin:0,fontSize:'.72rem',color:'#9ca3af'}}>{fmtFileSize(pickedFile.size)}</p>
          {saving && uploadProgress > 0 && uploadProgress < 100 && (
            <div style={{marginTop:6,height:4,borderRadius:4,background:'#e2e8f0',overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:4,background:'#002280',width:`${uploadProgress}%`,transition:'width .3s'}}/>
            </div>
          )}
          {saving && uploadProgress === 100 && <p style={{margin:'4px 0 0',fontSize:'.72rem',color:'#10813f',fontWeight:700}}>✓ Upload complete</p>}
        </div>
        {!saving && (
          <button type="button" onClick={clearFile} style={{ width:28, height:28, borderRadius:7, border:'1.5px solid #e2e8f0', background:'#fff', color:'#9ca3af', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'inherit' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>
    );
  };

  const STAT_TILES = [
    { l:'Total',     v: stats.total     || 0, c:'#002280' },
    { l:'Draft',     v: stats.draft     || 0, c:'#6b7280' },
    { l:'Submitted', v: stats.submitted || 0, c:'#C8960C' },
    { l:'Approved',  v: stats.approved  || 0, c:'#7c3aed' },
    { l:'Published', v: stats.published || 0, c:'#10813f' },
  ];

  return (
    <div>
      {toast && <div className={`sl-toast sl-toast--${toast.type}`}>{toast.msg}</div>}

      {/* Stat strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'.75rem', marginBottom:'1.25rem' }}>
        {STAT_TILES.map(s => (
          <div key={s.l} style={statTile()}>
            <p style={tileVal(s.c)}>{loading ? '…' : s.v}</p>
            <p style={tileLbl}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="sl-toolbar">
        <div className="sl-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="sl-search" placeholder="Search documents…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="sl-select" value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
          {DOC_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <div style={{ display:'flex', gap:6 }}>
          {STATUS_TABS.map(t => (
            <button key={t} style={pillBtn(statusTab===t)} onClick={()=>setStatusTab(t)}>{t==='all'?'All':t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </div>
        <div className="sl-toolbar-right">
          <button className="sl-btn sl-btn--primary" onClick={openCreate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Document
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {sel.size > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:'.6rem', margin:'.6rem 0', padding:'8px 12px', background:'#eef1fb', borderRadius:9, fontSize:'.8rem', fontWeight:700, color:'#002280' }}>
          <span>{sel.size} selected</span>
          <button className="sl-btn sl-btn--ghost" onClick={bulkPublish} style={{ padding:'5px 12px', fontSize:'.78rem' }}>Publish selected</button>
          <button className="sl-btn sl-btn--ghost" onClick={bulkArchive} style={{ padding:'5px 12px', fontSize:'.78rem' }}>Archive selected</button>
          <button className="sl-btn sl-btn--ghost" onClick={()=>setSel(new Set())} style={{ padding:'5px 12px', fontSize:'.78rem' }}>Clear</button>
        </div>
      )}

      <div className="sl-count">
        <label style={{ display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer', fontWeight:600 }}>
          <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{cursor:'pointer'}}/>
        </label>
        Showing <strong>{filtered.length}</strong> of {docs.length} documents
      </div>

      {/* Document list */}
      {loading ? (
        <div className="sl-loading">{[...Array(4)].map((_,i)=><div key={i} className="sl-card sl-card--skeleton" style={{height:56}}/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="db-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:44,height:44,color:'#d1d5db'}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p>No documents yet.</p>
          <span>Create your first transparency document to publish to the public portal.</span>
          <button className="sl-btn sl-btn--primary" style={{marginTop:'.6rem'}} onClick={openCreate}>New Document</button>
        </div>
      ) : (
        <div className="sl-list">
          {filtered.map((doc, i) => {
            const curIdx = DOC_PIPELINE.indexOf(doc.status);
            return (
              <div key={doc.id} className="sl-list-row" style={{ alignItems:'center' }}>
                <span className="sl-list-num">{i+1}</span>
                <input type="checkbox" checked={sel.has(doc.id)} onChange={()=>toggleSel(doc.id)} style={{ cursor:'pointer' }}/>
                <div className="sl-list-info" style={{ flex:2 }}>
                  <p className="sl-list-name">{doc.title}</p>
                  <p className="sl-list-sn">{doc.responsible_office || '—'} · {doc.academic_year || '—'}</p>
                </div>
                <Badge label={doc.category?.replace(/_/g,' ')} color="#002280" bg="#eef1fb"/>
                {/* Status pipeline */}
                <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                  {DOC_PIPELINE.map((step, idx) => {
                    const reached = curIdx >= 0 && idx <= curIdx;
                    return (
                      <span key={step} style={{
                        fontSize:'.6rem', fontWeight:700, padding:'2px 6px', borderRadius:10,
                        textTransform:'capitalize', whiteSpace:'nowrap',
                        color: reached ? STATUS_COLORS[step] : '#cbd5e1',
                        background: reached ? STATUS_BG[step] : '#f8fafc',
                        border:`1px solid ${reached ? STATUS_COLORS[step]+'33' : '#e2e8f0'}`,
                      }}>{step === 'published' ? 'Pub' : step === 'submitted' ? 'Sub' : step === 'approved' ? 'Appr' : step === 'archived' ? 'Arch' : 'Drf'}</span>
                    );
                  })}
                </div>
                <span className="sl-list-sn" style={{ minWidth:88 }} title={fmtTs(doc.published_at || doc.created_at)}>{fmtDate(doc.published_at || doc.created_at)}</span>
                {doc.file_url && <span style={{ width:30, textAlign:'center' }} title="Has attachment">{(() => { const fi = getFileIcon(doc.file_url); return <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:24, height:24, borderRadius:6, background:fi.bg, color:fi.color, fontSize:'.58rem', fontWeight:900 }}>{fi.label}</span>; })()}</span>}
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  {doc.status === 'draft' && (
                    <button className="sl-act-btn sl-act-btn--edit" title="Publish Now" onClick={()=>handlePublishNow(doc)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10813f" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </button>
                  )}
                  {doc.status === 'submitted' && (
                    <button className="sl-act-btn sl-act-btn--edit" title="Approve" onClick={()=>handleApprove(doc)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                  )}
                  {doc.status === 'approved' && (
                    <button className="sl-act-btn sl-act-btn--edit" title="Publish" onClick={()=>handlePublish(doc)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10813f" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </button>
                  )}
                  {doc.status === 'published' && (
                    <button className="sl-act-btn" title="Archive" onClick={()=>handleArchive(doc)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                    </button>
                  )}
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="sl-act-btn" title="View / Download file" style={{ textDecoration:'none' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#002280" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </a>
                  )}
                  <button className="sl-act-btn sl-act-btn--edit" title="Edit" onClick={()=>openEdit(doc)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── New Document Modal ── */}
      {modal && (
        <div className="sl-modal-backdrop" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="sl-modal" style={{ maxWidth:680, maxHeight:'92vh', overflowY:'auto' }}>
            <div className="sl-modal-header">
              <h3>New Transparency Document</h3>
              <button className="sl-modal-close" onClick={()=>setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={labelSt}>File Attachment <span style={{fontWeight:400,color:'#9ca3af'}}>(PDF, Word, PowerPoint, Excel — max 20 MB)</span></label>
                {!pickedFile ? renderDropZone() : renderPickedCard()}
                {uploadErr && <div style={{marginTop:6,background:'#fee2e2',color:'#991b1b',borderRadius:8,padding:'7px 11px',fontSize:'.81rem',fontWeight:600}}>{uploadErr}</div>}
              </div>
              <div>
                <label style={labelSt}>Title *</label>
                <input style={inp} required value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Document title"/>
              </div>
              <div>
                <label style={labelSt}>Category *</label>
                <select style={inp} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                  {DOC_CATS_NO_ALL.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={labelSt}>Academic Year</label>
                  <input style={inp} value={form.academic_year} onChange={e=>setForm(p=>({...p,academic_year:e.target.value}))} placeholder="AY 2026-2027"/>
                </div>
                <div>
                  <label style={labelSt}>Responsible Office</label>
                  <input style={inp} value={form.responsible_office} onChange={e=>setForm(p=>({...p,responsible_office:e.target.value}))} placeholder="Office name"/>
                </div>
              </div>
              <div>
                <label style={labelSt}>Body / Description</label>
                <textarea style={{...inp, height:84, resize:'vertical'}} value={form.body} onChange={e=>setForm(p=>({...p,body:e.target.value}))} placeholder="Document summary or body text…"/>
              </div>
              <div>
                <label style={labelSt}>Initial Status</label>
                <select style={inp} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submit for Review</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
              <div className="sl-modal-actions">
                <button type="button" className="sl-btn sl-btn--ghost" onClick={()=>setModal(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="sl-btn sl-btn--primary" disabled={saving}>
                  {saving ? (uploadProgress > 0 && uploadProgress < 100 ? `Uploading ${uploadProgress}%…` : 'Saving…') : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editDoc && (
        <div className="sl-modal-backdrop" onClick={e=>e.target===e.currentTarget&&setEditDoc(null)}>
          <div className="sl-modal" style={{ maxWidth:680, maxHeight:'92vh', overflowY:'auto' }}>
            <div className="sl-modal-header">
              <h3>Edit Document</h3>
              <button className="sl-modal-close" onClick={()=>setEditDoc(null)}>✕</button>
            </div>
            <form onSubmit={handleEditSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={labelSt}>Attachment</label>
                {!pickedFile ? (
                  <div>
                    {form.file_url ? (
                      <div style={{ display:'flex', alignItems:'center', gap:'.6rem', padding:'8px 10px', background:'#fafafa', border:'1.5px solid #e2e8f0', borderRadius:10, marginBottom:8 }}>
                        {(() => { const fi = getFileIcon(form.file_url); return <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:26, height:26, borderRadius:6, background:fi.bg, color:fi.color, fontSize:'.6rem', fontWeight:900 }}>{fi.label}</span>; })()}
                        <a href={form.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize:'.78rem', color:'#002280', fontWeight:700, textDecoration:'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Current file</a>
                        <span style={{ marginLeft:'auto', fontSize:'.72rem', color:'#9ca3af' }}>Replace below ↓</span>
                      </div>
                    ) : null}
                    {renderDropZone()}
                  </div>
                ) : renderPickedCard()}
                {uploadErr && <div style={{marginTop:6,background:'#fee2e2',color:'#991b1b',borderRadius:8,padding:'7px 11px',fontSize:'.81rem',fontWeight:600}}>{uploadErr}</div>}
              </div>
              <div>
                <label style={labelSt}>Title *</label>
                <input style={inp} required value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
              </div>
              <div>
                <label style={labelSt}>Category</label>
                <select style={inp} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                  {DOC_CATS_NO_ALL.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={labelSt}>Academic Year</label>
                  <input style={inp} value={form.academic_year} onChange={e=>setForm(p=>({...p,academic_year:e.target.value}))}/>
                </div>
                <div>
                  <label style={labelSt}>Responsible Office</label>
                  <input style={inp} value={form.responsible_office} onChange={e=>setForm(p=>({...p,responsible_office:e.target.value}))}/>
                </div>
              </div>
              <div>
                <label style={labelSt}>Body / Description</label>
                <textarea style={{...inp, height:84, resize:'vertical'}} value={form.body} onChange={e=>setForm(p=>({...p,body:e.target.value}))}/>
              </div>
              <div>
                <label style={labelSt}>Status</label>
                <select style={inp} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="sl-modal-actions">
                <button type="button" className="sl-btn sl-btn--ghost" onClick={()=>setEditDoc(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="sl-btn sl-btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ACCOUNTABILITY (CONCERNS) SUB-TAB
═══════════════════════════════════════════════════════════ */
const AccountabilityTab = ({ user }) => {
  const [concerns,       setConcerns]       = useState([]);
  const [stats,          setStats]          = useState({});
  const [loading,        setLoading]        = useState(true);
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [catFilter,      setCatFilter]      = useState('all');
  const [dateFrom,       setDateFrom]       = useState('');
  const [dateTo,         setDateTo]         = useState('');
  const [search,         setSearch]         = useState('');
  const [sortBy,         setSortBy]         = useState('date');
  const [selected,       setSelected]       = useState(null);
  const [editForm,       setEditForm]       = useState({});
  const [saving,         setSaving]         = useState(false);
  const [toast,          setToast]          = useState(null);
  const assignRef = useRef(null);

  const showToast = useCallback((msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([getAllConcerns({}), getConcernStats()]);
      setConcerns(c); setStats(s);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);   // eslint-disable-line

  const PRIO_RANK = { urgent:0, high:1, normal:2, low:3 };
  const STATUS_RANK = { submitted:0, received:1, assigned:2, under_review:3, action_in_progress:4, resolved:5, closed:6, rejected:7, reopened:8 };

  const filtered = useMemo(() => {
    let c = concerns;
    if (statusFilter !== 'all')   c = c.filter(x => x.status === statusFilter);
    if (priorityFilter !== 'all') c = c.filter(x => x.priority === priorityFilter);
    if (catFilter !== 'all')      c = c.filter(x => x.category === catFilter);
    if (search) { const q = search.toLowerCase(); c = c.filter(x => (x.subject||'').toLowerCase().includes(q) || (x.reference_no||'').toLowerCase().includes(q)); }
    if (dateFrom) c = c.filter(x => x.created_at && new Date(x.created_at) >= new Date(dateFrom));
    if (dateTo)   { const end = new Date(dateTo); end.setHours(23,59,59,999); c = c.filter(x => x.created_at && new Date(x.created_at) <= end); }
    c = [...c].sort((a,b) => {
      if (sortBy === 'priority') return (PRIO_RANK[a.priority] ?? 9) - (PRIO_RANK[b.priority] ?? 9);
      if (sortBy === 'status')   return (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
      return new Date(b.created_at) - new Date(a.created_at); // date desc default
    });
    return c;
  }, [concerns, statusFilter, priorityFilter, catFilter, search, dateFrom, dateTo, sortBy]);

  const overdueCount = useMemo(() => concerns.filter(isOverdue).length, [concerns]);
  const now = new Date();
  const resolvedThisMonth = useMemo(() => concerns.filter(c => c.resolved_at && new Date(c.resolved_at).getMonth() === now.getMonth() && new Date(c.resolved_at).getFullYear() === now.getFullYear()).length, [concerns, now]);   // eslint-disable-line

  const openDetail = (c) => {
    setSelected(c);
    setEditForm({
      status: c.status, resolution_note: c.resolution_note || '', internal_notes: c.internal_notes || '',
      assigned_office: c.assigned_office || '', assigned_to: c.assigned_to || '',
      target_deadline: c.target_deadline ? c.target_deadline.slice(0,10) : '',
    });
  };

  const setQuickStatus = (status, focusAssign) => {
    setEditForm(p => ({ ...p, status }));
    if (focusAssign && assignRef.current) setTimeout(() => assignRef.current.scrollIntoView({ behavior:'smooth', block:'center' }), 50);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateConcernStatus(selected.id, editForm);
      await logActivity('concern_updated', `Updated concern ${selected.reference_no}`, user?.username, 'success', 'Governance');
      showToast('Concern updated.');
      setSelected(null); load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const clearFilters = () => { setStatusFilter('all'); setPriorityFilter('all'); setCatFilter('all'); setDateFrom(''); setDateTo(''); setSearch(''); };

  const STAT_TILES = [
    { l:'Total',            v: stats.total || 0, c:'#002280' },
    { l:'Open',             v: stats.open  || 0, c:'#C8102E' },
    { l:'Overdue',          v: overdueCount,    c:'#C8960C' },
    { l:'Resolved this mo.', v: resolvedThisMonth, c:'#10813f' },
  ];

  const curStepIdx = selected ? CONCERN_STEPS.indexOf(selected.status) : -1;

  return (
    <div>
      {toast && <div className={`sl-toast sl-toast--${toast.type}`}>{toast.msg}</div>}

      {/* Summary stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.75rem', marginBottom:'1.25rem' }}>
        {STAT_TILES.map(s => (
          <div key={s.l} style={statTile()}>
            <p style={tileVal(s.c)}>{loading ? '…' : s.v}</p>
            <p style={tileLbl}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="sl-toolbar" style={{ flexWrap:'wrap', gap:'.5rem' }}>
        <div className="sl-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="sl-search" placeholder="Search subject or ref no…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="sl-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          {CONCERN_STATUSES.map(s => <option key={s} value={s}>{s==='all'?'All Statuses':s.replace(/_/g,' ')}</option>)}
        </select>
        <select className="sl-select" value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}>
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <select className="sl-select" value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
          {CONCERN_CATEGORIES.map(c => <option key={c} value={c}>{c==='all'?'All Categories':c.replace(/_/g,' ')}</option>)}
        </select>
        <select className="sl-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="date">Sort: Newest</option>
          <option value="priority">Sort: Priority</option>
          <option value="status">Sort: Status</option>
        </select>
        <div className="sl-toolbar-right">
          <button className="sl-btn sl-btn--ghost" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:'.6rem', flexWrap:'wrap', margin:'.5rem 0 .9rem' }}>
        <label style={{ fontSize:'.74rem', fontWeight:700, color:'#64748b' }}>From
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{ marginLeft:6, padding:'5px 8px', borderRadius:7, border:'1.5px solid #e2e8f0', fontSize:'.78rem', fontFamily:'inherit' }}/>
        </label>
        <label style={{ fontSize:'.74rem', fontWeight:700, color:'#64748b' }}>To
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{ marginLeft:6, padding:'5px 8px', borderRadius:7, border:'1.5px solid #e2e8f0', fontSize:'.78rem', fontFamily:'inherit' }}/>
        </label>
      </div>

      <div className="sl-count">Showing <strong>{filtered.length}</strong> of {concerns.length} concerns</div>

      {/* Inbox list */}
      {loading ? (
        <div className="sl-loading">{[...Array(4)].map((_,i)=><div key={i} className="sl-card sl-card--skeleton" style={{height:56}}/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="db-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:44,height:44,color:'#d1d5db'}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <p>No concerns match these filters.</p>
          <button className="sl-btn sl-btn--ghost" style={{marginTop:'.6rem'}} onClick={clearFilters}>Clear Filters</button>
        </div>
      ) : (
        <div className="sl-list">
          {filtered.map((c, i) => {
            const od = isOverdue(c);
            return (
              <div key={c.id} className="sl-list-row" style={{ cursor:'pointer', borderLeft:`4px solid ${PRIORITY_COLORS[c.priority] || '#cbd5e1'}`, paddingLeft:'.7rem' }} onClick={()=>openDetail(c)}>
                <span className="sl-list-num">{i+1}</span>
                <div className="sl-list-info" style={{ flex:2 }}>
                  <p className="sl-list-name">{c.subject}</p>
                  <p className="sl-list-sn">{c.reference_no} · {c.assigned_office || 'Unassigned'}</p>
                </div>
                <Badge label={c.category?.replace(/_/g,' ')} color="#002280" bg="#eef1fb"/>
                <Badge label={c.priority} color={PRIORITY_COLORS[c.priority]} bg={PRIORITY_BG[c.priority]}/>
                <Badge label={c.status}/>
                {od && <Badge label="Overdue" color="#fff" bg="#C8102E"/>}
                <span className="sl-list-sn" style={{ minWidth:78 }} title={fmtTs(c.created_at)}>{timeAgo(c.created_at)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail / slide-in panel */}
      {selected && (
        <div className="sl-modal-backdrop" style={{ justifyContent:'flex-end', padding:0, zIndex:500 }} onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
          <div style={{ position:'relative', background:'#fff', borderRadius:0, width:'100%', maxWidth:680, height:'100vh', boxShadow:'-12px 0 40px rgba(0,0,0,.18)', display:'flex', flexDirection:'column' }}>
            {/* Header */}
            <div style={{ flexShrink:0, display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'1.1rem 1.4rem', borderBottom:'1px solid #f1f5f9' }}>
              <div style={{ minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'.5rem', flexWrap:'wrap', marginBottom:4 }}>
                  <Badge label={selected.status}/>
                  <Badge label={selected.priority} color={PRIORITY_COLORS[selected.priority]} bg={PRIORITY_BG[selected.priority]}/>
                  {isOverdue(selected) && <Badge label="Overdue" color="#fff" bg="#C8102E"/>}
                </div>
                <h3 style={{ margin:0, fontSize:'1.05rem', fontWeight:800, color:'#0f1724' }}>{selected.subject}</h3>
                <p style={{ margin:'4px 0 0', fontSize:'.78rem', color:'#94a3b8' }}>{selected.reference_no} · {selected.category?.replace(/_/g,' ')} · {fmtTs(selected.created_at)}</p>
              </div>
              <button className="sl-modal-close" onClick={()=>setSelected(null)} style={{ flexShrink:0 }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ flex:1, overflowY:'auto', padding:'1.1rem 1.4rem', display:'flex', flexDirection:'column', gap:16 }}>
              {/* Description */}
              <div>
                <p style={labelSt}>Description</p>
                <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', fontSize:'.86rem', color:'#374151', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{selected.description}</div>
              </div>

              {/* Submitter info */}
              {!selected.is_anonymous && (
                <div style={{ fontSize:'.82rem', color:'#475569', background:'#f8fafc', borderRadius:10, padding:'10px 14px', border:'1px solid #eef2f7' }}>
                  <strong style={{ color:'#002280' }}>Submitter:</strong> {selected.submitter_name || 'N/A'}
                  {selected.submitter_email ? ` · ${selected.submitter_email}` : ''}
                  {selected.student_number ? ` · ${selected.student_number}` : ''}
                </div>
              )}
              {selected.is_anonymous && (
                <div style={{ fontSize:'.82rem', color:'#9ca3af', background:'#f8fafc', borderRadius:10, padding:'10px 14px', border:'1px dashed #e2e8f0' }}>
                  Submitted anonymously
                </div>
              )}

              {/* Status timeline */}
              <div>
                <p style={labelSt}>Status Timeline</p>
                <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                  {CONCERN_STEPS.map((step, idx) => {
                    const reached = curStepIdx >= 0 && idx <= curStepIdx;
                    const color = reached ? STATUS_COLORS[step] : '#cbd5e1';
                    return (
                      <div key={step} style={{ display:'flex', alignItems:'center', gap:10, padding:'4px 0' }}>
                        <span style={{
                          width:18, height:18, borderRadius:'50%', flexShrink:0,
                          border:`2px solid ${color}`, background: reached ? color : '#fff',
                          display:'inline-flex', alignItems:'center', justifyContent:'center',
                        }}>{reached && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}</span>
                        <span style={{ fontSize:'.82rem', fontWeight:700, color: reached ? '#1e293b' : '#94a3b8', textTransform:'capitalize' }}>{step.replace(/_/g,' ')}</span>
                        {selected.status === step && <span style={{ fontSize:'.66rem', fontWeight:700, color:color, marginLeft:'auto' }}>● current</span>}
                      </div>
                    );
                  })}
                  {selected.status === 'rejected' && (
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'4px 0' }}>
                      <span style={{ width:18, height:18, borderRadius:'50%', flexShrink:0, border:'2px solid #C8102E', background:'#C8102E', display:'inline-flex', alignItems:'center', justifyContent:'center' }}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
                      <span style={{ fontSize:'.82rem', fontWeight:700, color:'#C8102E' }}>Rejected</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick action bar */}
              <div>
                <p style={labelSt}>Quick Actions</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  <button style={quickAct(editForm.status==='received','#C8960C')} onClick={()=>setQuickStatus('received', false)}>Mark Received</button>
                  <button style={quickAct(editForm.status==='assigned','#7c3aed')} onClick={()=>setQuickStatus('assigned', true)}>Assign</button>
                  <button style={quickAct(editForm.status==='under_review','#002280')} onClick={()=>setQuickStatus('under_review', false)}>Under Review</button>
                  <button style={quickAct(editForm.status==='action_in_progress','#0891b2')} onClick={()=>setQuickStatus('action_in_progress', false)}>In Progress</button>
                  <button style={quickAct(editForm.status==='resolved','#10813f')} onClick={()=>setQuickStatus('resolved', false)}>Resolve</button>
                  <button style={quickAct(editForm.status==='closed','#6b7280')} onClick={()=>setQuickStatus('closed', false)}>Close</button>
                  <button style={quickAct(editForm.status==='rejected','#C8102E')} onClick={()=>setQuickStatus('rejected', false)}>Reject</button>
                </div>
              </div>

              {/* Assignment form */}
              <div ref={assignRef}>
                <p style={labelSt}>Assignment</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <label style={{ ...labelSt, fontSize:'.7rem' }}>Assigned Office</label>
                    <input style={inp} value={editForm.assigned_office || ''} onChange={e=>setEditForm(p=>({...p,assigned_office:e.target.value}))} placeholder="Office name"/>
                  </div>
                  <div>
                    <label style={{ ...labelSt, fontSize:'.7rem' }}>Assigned To</label>
                    <input style={inp} value={editForm.assigned_to || ''} onChange={e=>setEditForm(p=>({...p,assigned_to:e.target.value}))} placeholder="Person / role"/>
                  </div>
                </div>
                <div style={{ marginTop:8 }}>
                  <label style={{ ...labelSt, fontSize:'.7rem' }}>Target Deadline</label>
                  <input type="date" style={inp} value={editForm.target_deadline || ''} onChange={e=>setEditForm(p=>({...p,target_deadline:e.target.value}))}/>
                </div>
              </div>

              {/* Internal notes */}
              <div>
                <label style={labelSt}>Internal Notes <span style={{fontWeight:400,color:'#9ca3af'}}>(admin only — not shown to submitter)</span></label>
                <textarea style={{...inp, height:74, resize:'vertical'}} value={editForm.internal_notes || ''} onChange={e=>setEditForm(p=>({...p,internal_notes:e.target.value}))} placeholder="Private notes for the admin team…"/>
              </div>

              {/* Resolution note */}
              <div>
                <label style={labelSt}>Resolution Note <span style={{fontWeight:400,color:'#9ca3af'}}>(visible to submitter when resolved)</span></label>
                <textarea style={{...inp, height:74, resize:'vertical'}} value={editForm.resolution_note || ''} onChange={e=>setEditForm(p=>({...p,resolution_note:e.target.value}))} placeholder="Action taken, resolution details…"/>
              </div>
            </div>

            {/* Footer */}
            <div style={{ flexShrink:0, display:'flex', gap:'.75rem', justifyContent:'flex-end', padding:'1rem 1.4rem', borderTop:'1px solid #f1f5f9', background:'#fff' }}>
              <button className="sl-btn sl-btn--ghost" onClick={()=>setSelected(null)} disabled={saving}>Cancel</button>
              <button className="sl-btn sl-btn--primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   PARTICIPATION (CONSULTATIONS) SUB-TAB
═══════════════════════════════════════════════════════════ */
const ParticipationTab = ({ user }) => {
  const [consultations, setConsultations] = useState([]);
  const [stats,         setStats]         = useState({});
  const [counts,        setCounts]        = useState({});
  const [loading,       setLoading]       = useState(true);
  const [createModal,   setCreateModal]   = useState(false);
  const [builder,       setBuilder]       = useState(null);   // consultation open in question builder
  const [respModal,      setRespModal]     = useState(null);    // consultation open in responses view
  const [saving,        setSaving]       = useState(false);
  const [toast,         setToast]        = useState(null);

  const [createForm, setCreateForm] = useState({ title:'', description:'', type:'survey', opens_at:'', closes_at:'' });
  const [qList,      setQList]      = useState([]);
  const [qText,      setQText]      = useState('');
  const [qType,      setQType]      = useState('text');
  const [qOptions,   setQOptions]   = useState('');
  const [respData,   setRespData]   = useState({ loading:true, count:0, tallies:{}, questions:[] });

  const showToast = useCallback((msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([getAllConsultations(), getParticipationStats()]);
      setConsultations(c); setStats(s);
      // response counts per consultation
      const cnts = await Promise.all(c.map(x => getConsultationStats(x.id).then(r => [x.id, r.responseCount]).catch(() => [x.id, 0])));
      setCounts(Object.fromEntries(cnts));
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);   // eslint-disable-line

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.title) return;
    setSaving(true);
    try {
      await createConsultation({ ...createForm, created_by: user?.username });
      await logActivity('consultation_created', `Created: ${createForm.title}`, user?.username, 'success', 'Governance');
      showToast('Consultation created.');
      setCreateModal(false);
      setCreateForm({ title:'', description:'', type:'survey', opens_at:'', closes_at:'' });
      load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (id, status, title) => {
    try {
      await updateConsultation(id, { status });
      await logActivity('consultation_status_changed', `Set "${title}" to ${status}`, user?.username, 'success', 'Governance');
      showToast(`Status updated to ${status}.`);
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const openBuilder = async (c) => {
    setBuilder(c); setQText(''); setQType('text'); setQOptions('');
    try {
      const full = await getConsultationWithQuestions(c.id);
      setQList(full.questions || []);
    } catch (e) { setQList([]); showToast(e.message, 'error'); }
  };

  const moveQ = (idx, dir) => {
    setQList(prev => {
      const n = [...prev]; const j = idx + dir;
      if (j < 0 || j >= n.length) return n;
      [n[idx], n[j]] = [n[j], n[idx]];
      return n.map((q, i) => ({ ...q, sort_order: i }));
    });
  };

  const handleAddQuestion = async () => {
    if (!builder || !qText.trim()) return;
    setSaving(true);
    try {
      const opts = (qType === 'single_choice' || qType === 'multiple_choice')
        ? qOptions.split(/[\n,]/).map(s => s.trim()).filter(Boolean)
        : null;
      await addQuestion(builder.id, {
        question_text: qText.trim(),
        question_type: qType,
        options: opts,
        sort_order: qList.length,
      });
      await logActivity('question_added', `Added question to "${builder.title}"`, user?.username, 'success', 'Governance');
      showToast('Question added.');
      const full = await getConsultationWithQuestions(builder.id);
      setQList(full.questions || []);
      setQText(''); setQOptions('');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const openResponses = async (c) => {
    setRespModal(c);
    setRespData({ loading:true, count:0, tallies:{}, questions:[] });
    try {
      const [full, st] = await Promise.all([getConsultationWithQuestions(c.id), getConsultationStats(c.id)]);
      const questions = full.questions || [];
      let tallies = {};
      let respRows = [];
      try {
        const { data, error } = await supabase.from('consultation_responses').select('question_id,answer').eq('consultation_id', c.id);
        if (error) throw error;
        respRows = data || [];
        const tally = {};
        respRows.forEach(r => {
          const key = r.question_id;
          if (!tally[key]) tally[key] = {};
          const ans = (r.answer || '').trim();
          tally[key][ans] = (tally[key][ans] || 0) + 1;
        });
        tallies = tally;
      } catch (_) { /* graceful: fall back to count + question list */ }
      setRespData({ loading:false, count: st.responseCount || 0, tallies, questions });
    } catch (e) {
      setRespData({ loading:false, count:0, tallies:{}, questions:[] });
      showToast(e.message, 'error');
    }
  };

  const STAT_TILES = [
    { l:'Total',     v: stats.total     || 0, c:'#002280' },
    { l:'Active',    v: stats.active    || 0, c:'#10813f' },
    { l:'Responses', v: stats.responses || 0, c:'#7c3aed' },
  ];

  return (
    <div>
      {toast && <div className={`sl-toast sl-toast--${toast.type}`}>{toast.msg}</div>}

      {/* Stat strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.75rem', marginBottom:'1.25rem' }}>
        {STAT_TILES.map(s => (
          <div key={s.l} style={statTile()}>
            <p style={tileVal(s.c)}>{loading ? '…' : s.v}</p>
            <p style={tileLbl}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="sl-toolbar">
        <p style={{ margin:0, fontSize:'.86rem', color:'#374151', fontWeight:600 }}>Surveys &amp; Consultations</p>
        <div className="sl-toolbar-right">
          <button className="sl-btn sl-btn--ghost" onClick={load}>↻ Refresh</button>
          <button className="sl-btn sl-btn--primary" onClick={()=>setCreateModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Consultation
          </button>
        </div>
      </div>

      <div className="sl-count">Showing <strong>{consultations.length}</strong> consultations</div>

      {/* List */}
      {loading ? (
        <div className="sl-loading">{[...Array(3)].map((_,i)=><div key={i} className="sl-card sl-card--skeleton" style={{height:56}}/>)}</div>
      ) : consultations.length === 0 ? (
        <div className="db-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:44,height:44,color:'#d1d5db'}}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          <p>No consultations yet.</p>
          <span>Create one to start gathering feedback from the public.</span>
          <button className="sl-btn sl-btn--primary" style={{marginTop:'.6rem'}} onClick={()=>setCreateModal(true)}>New Consultation</button>
        </div>
      ) : (
        <div className="sl-list">
          {consultations.map((c, i) => (
            <div key={c.id} className="sl-list-row" style={{ alignItems:'center' }}>
              <span className="sl-list-num">{i+1}</span>
              <div className="sl-list-info" style={{ flex:2 }}>
                <p className="sl-list-name">{c.title}</p>
                <p className="sl-list-sn">{c.opens_at ? fmtDate(c.opens_at) : 'No open date'} → {c.closes_at ? fmtDate(c.closes_at) : 'No close date'}</p>
              </div>
              <Badge label={c.type} color={TYPE_COLORS[c.type]} bg={TYPE_BG[c.type]}/>
              <Badge label={c.status}/>
              <span className="sl-list-sn" style={{ minWidth:84 }} title="Responses">{counts[c.id] ?? '…'} responses</span>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button className="sl-act-btn sl-act-btn--edit" title="Manage Questions" onClick={()=>openBuilder(c)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                </button>
                {c.status === 'draft' && (
                  <button className="sl-act-btn sl-act-btn--edit" title="Publish" onClick={()=>handleStatusChange(c.id,'published',c.title)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10813f" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </button>
                )}
                {c.status === 'published' && (
                  <button className="sl-act-btn sl-act-btn--toggle" title="Close" onClick={()=>handleStatusChange(c.id,'closed',c.title)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  </button>
                )}
                <button className="sl-act-btn" title="View Responses" onClick={()=>openResponses(c)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#002280" strokeWidth="2.5"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Consultation Modal ── */}
      {createModal && (
        <div className="sl-modal-backdrop" onClick={e=>e.target===e.currentTarget&&setCreateModal(false)}>
          <div className="sl-modal" style={{ maxWidth:680, maxHeight:'92vh', overflowY:'auto' }}>
            <div className="sl-modal-header">
              <h3>New Consultation / Survey</h3>
              <button className="sl-modal-close" onClick={()=>setCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={labelSt}>Title *</label>
                <input style={inp} required value={createForm.title} onChange={e=>setCreateForm(p=>({...p,title:e.target.value}))} placeholder="Consultation title"/>
              </div>
              <div>
                <label style={labelSt}>Type</label>
                <select style={inp} value={createForm.type} onChange={e=>setCreateForm(p=>({...p,type:e.target.value}))}>
                  {CONSULT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Description</label>
                <textarea style={{...inp, height:80, resize:'vertical'}} value={createForm.description} onChange={e=>setCreateForm(p=>({...p,description:e.target.value}))} placeholder="What is this consultation about?"/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={labelSt}>Opens</label>
                  <input type="datetime-local" style={inp} value={createForm.opens_at} onChange={e=>setCreateForm(p=>({...p,opens_at:e.target.value}))}/>
                </div>
                <div>
                  <label style={labelSt}>Closes</label>
                  <input type="datetime-local" style={inp} value={createForm.closes_at} onChange={e=>setCreateForm(p=>({...p,closes_at:e.target.value}))}/>
                </div>
              </div>
              <div className="sl-modal-actions">
                <button type="button" className="sl-btn sl-btn--ghost" onClick={()=>setCreateModal(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="sl-btn sl-btn--primary" disabled={saving}>{saving ? 'Creating…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Question Builder Modal ── */}
      {builder && (
        <div className="sl-modal-backdrop" onClick={e=>e.target===e.currentTarget&&setBuilder(null)}>
          <div className="sl-modal" style={{ maxWidth:680, maxHeight:'92vh', overflowY:'auto' }}>
            <div className="sl-modal-header">
              <div>
                <h3 style={{ margin:0 }}>Question Builder</h3>
                <p style={{ margin:'4px 0 0', fontSize:'.78rem', color:'#94a3b8' }}>{builder.title}</p>
              </div>
              <button className="sl-modal-close" onClick={()=>setBuilder(null)}>✕</button>
            </div>

            {/* Add-question form */}
            <div style={{ background:'#f8fafc', border:'1px solid #eef2f7', borderRadius:12, padding:14, display:'flex', flexDirection:'column', gap:10 }}>
              <p style={{ margin:0, fontSize:'.78rem', fontWeight:700, color:'#002280' }}>Add a question</p>
              <input style={inp} placeholder="Question text…" value={qText} onChange={e=>setQText(e.target.value)}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={{ ...labelSt, fontSize:'.7rem' }}>Type</label>
                  <select style={inp} value={qType} onChange={e=>setQType(e.target.value)}>
                    {CONSULT_Q_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex', alignItems:'flex-end' }}>
                  <button type="button" className="sl-btn sl-btn--primary" style={{ width:'100%' }} onClick={handleAddQuestion} disabled={saving || !qText.trim()}>+ Add</button>
                </div>
              </div>
              {(qType === 'single_choice' || qType === 'multiple_choice') && (
                <div>
                  <label style={{ ...labelSt, fontSize:'.7rem' }}>Options <span style={{fontWeight:400,color:'#9ca3af'}}>(one per line or comma-separated)</span></label>
                  <textarea style={{...inp, height:62, resize:'vertical'}} value={qOptions} onChange={e=>setQOptions(e.target.value)} placeholder={'Option A\nOption B\nOption C'}/>
                </div>
              )}
            </div>

            {/* Existing questions */}
            <div>
              <p style={{ ...labelSt, marginBottom:6 }}>Questions ({qList.length})</p>
              <span style={{ fontSize:'.72rem', color:'#9ca3af' }}>Reordering is preview-only — new questions are saved when added.</span>
              {qList.length === 0 ? (
                <p style={{ fontSize:'.82rem', color:'#9ca3af', padding:'1rem 0' }}>No questions yet. Add the first one above.</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
                  {qList.map((q, idx) => (
                    <div key={q.id || idx} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 11px', border:'1.5px solid #e2e8f0', borderRadius:9, background:'#fff' }}>
                      <span style={{ fontSize:'.72rem', fontWeight:800, color:'#94a3b8', width:18 }}>{idx+1}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:0, fontSize:'.84rem', fontWeight:700, color:'#1e293b' }}>{q.question_text}</p>
                        <p style={{ margin:'2px 0 0', fontSize:'.7rem', color:'#9ca3af', textTransform:'capitalize' }}>
                          {q.question_type?.replace(/_/g,' ')}
                          {q.options?.length ? ` · ${q.options.join(', ')}` : ''}
                        </p>
                      </div>
                      <button type="button" className="sl-act-btn" title="Move up" onClick={()=>moveQ(idx,-1)} disabled={idx===0} style={{ opacity: idx===0 ? 0.4 : 1 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                      </button>
                      <button type="button" className="sl-act-btn" title="Move down" onClick={()=>moveQ(idx,1)} disabled={idx===qList.length-1} style={{ opacity: idx===qList.length-1 ? 0.4 : 1 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sl-modal-actions">
              <button className="sl-btn sl-btn--primary" onClick={()=>setBuilder(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Responses Modal ── */}
      {respModal && (
        <div className="sl-modal-backdrop" onClick={e=>e.target===e.currentTarget&&setRespModal(null)}>
          <div className="sl-modal" style={{ maxWidth:680, maxHeight:'92vh', overflowY:'auto' }}>
            <div className="sl-modal-header">
              <div>
                <h3 style={{ margin:0 }}>Responses</h3>
                <p style={{ margin:'4px 0 0', fontSize:'.78rem', color:'#94a3b8' }}>{respModal.title} · {respData.loading ? '…' : respData.count} total responses</p>
              </div>
              <button className="sl-modal-close" onClick={()=>setRespModal(null)}>✕</button>
            </div>

            {respData.loading ? (
              <div className="sl-loading"><div className="sl-card sl-card--skeleton" style={{height:80}}/></div>
            ) : respData.questions.length === 0 ? (
              <p style={{ fontSize:'.85rem', color:'#9ca3af' }}>No questions on this consultation.</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {respData.questions.map((q, idx) => {
                  const t = respData.tallies[q.id] || {};
                  const entries = Object.entries(t).sort((a,b)=>b[1]-a[1]);
                  const total = entries.reduce((s,[,n])=>s+n,0);
                  return (
                    <div key={q.id || idx} style={{ border:'1.5px solid #e2e8f0', borderRadius:10, padding:'11px 13px' }}>
                      <p style={{ margin:0, fontSize:'.85rem', fontWeight:700, color:'#1e293b' }}>{idx+1}. {q.question_text}</p>
                      <p style={{ margin:'2px 0 8px', fontSize:'.7rem', color:'#9ca3af', textTransform:'capitalize' }}>{q.question_type?.replace(/_/g,' ')} · {total} answer(s)</p>
                      {entries.length === 0 ? (
                        <p style={{ margin:0, fontSize:'.78rem', color:'#9ca3af' }}>No responses yet.</p>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                          {entries.map(([ans, n]) => {
                            const pct = total ? Math.round((n/total)*100) : 0;
                            return (
                              <div key={ans}>
                                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.76rem', color:'#475569', marginBottom:2 }}>
                                  <span>{ans || '(blank)'}</span><strong>{n}</strong>
                                </div>
                                <div style={{ height:6, borderRadius:6, background:'#f1f5f9', overflow:'hidden' }}>
                                  <div style={{ height:'100%', borderRadius:6, background:'#002280', width:`${pct}%` }}/>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="sl-modal-actions">
              <button className="sl-btn sl-btn--primary" onClick={()=>setRespModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN GovernancePage
═══════════════════════════════════════════════════════════ */
const GovernancePage = ({ user }) => {
  const [subTab, setSubTab] = useState('transparency');
  const [docStats,      setDocStats]      = useState({});
  const [concernStats,  setConcernStats]  = useState({});
  const [partStats,     setPartStats]     = useState({});
  const [loadingStats,  setLoadingStats]  = useState(true);

  useEffect(() => {
    Promise.all([getDocumentStats(), getConcernStats(), getParticipationStats()])
      .then(([d,c,p]) => { setDocStats(d); setConcernStats(c); setPartStats(p); })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  const STAT_CARDS = [
    { label:'Total Documents',     value:loadingStats?'…':docStats.total||0,      color:'#002280', bg:'#eef1fb', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { label:'Published',           value:loadingStats?'…':docStats.published||0,  color:'#10813f', bg:'#edf7f1', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { label:'Concerns Received',   value:loadingStats?'…':concernStats.total||0,  color:'#C8102E', bg:'#fdf0f2', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    { label:'Active Consultations', value:loadingStats?'…':partStats.active||0,    color:'#7c3aed', bg:'#f5f0ff', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
  ];

  const SUB_TABS = [
    { key:'transparency',  label:'Documents'     },
    { key:'accountability',label:'Concerns'       },
    { key:'participation', label:'Consultations'  },
  ];

  return (
    <div className="db-home-content" style={{ paddingBottom:'4rem' }}>
      {/* Stat cards */}
      <div className="db-stats-row" style={{ marginBottom:'1.5rem' }}>
        {STAT_CARDS.map(s => (
          <div key={s.label} className="db-stat-card" style={{ '--sc':s.color, '--sc-bg':s.bg }}>
            <div className="db-stat-icon" style={{ background:s.bg, color:s.color }}>{s.icon}</div>
            <div className="db-stat-body">
              <p className="db-stat-value">{s.value}</p>
              <p className="db-stat-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-tab switcher */}
      <div style={{ display:'flex', gap:8, marginBottom:16, background:'#f4f6fb', borderRadius:14, padding:4 }}>
        {SUB_TABS.map(t => (
          <button key={t.key} onClick={()=>setSubTab(t.key)} style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center',
            padding:'10px 12px', borderRadius:10, border:'none', cursor:'pointer',
            fontWeight:700, fontSize:'.82rem', fontFamily:'inherit', transition:'all .15s',
            background: subTab===t.key ? '#fff' : 'transparent',
            color: subTab===t.key ? '#002280' : '#6b7280',
            boxShadow: subTab===t.key ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      {subTab === 'transparency'  && <TransparencyTab  user={user}/>}
      {subTab === 'accountability' && <AccountabilityTab user={user}/>}
      {subTab === 'participation'  && <ParticipationTab  user={user}/>}
    </div>
  );
};

export default GovernancePage;
