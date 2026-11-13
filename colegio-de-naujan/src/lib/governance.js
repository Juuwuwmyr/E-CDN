/**
 * governance.js
 * Service module for the CDN OPEN Governance System.
 * Covers: Transparency (documents), Accountability (concerns), Participation (consultations).
 */
import { supabase } from './supabase';

/* ═══════════════════════════════════════════════════════════
   TRANSPARENCY — governance_documents
═══════════════════════════════════════════════════════════ */

export async function getPublishedDocuments(category = null) {
  let q = supabase
    .from('governance_documents')
    .select('id,title,body,category,academic_year,status,file_url,photo_urls,responsible_office,published_at,created_by')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (category && category !== 'all') q = q.eq('category', category);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getAllDocuments() {
  const { data, error } = await supabase
    .from('governance_documents')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createDocument(doc) {
  const { data, error } = await supabase
    .from('governance_documents')
    .insert(doc)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDocument(id, updates) {
  const { data, error } = await supabase
    .from('governance_documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function publishDocument(id, approvedBy) {
  return updateDocument(id, {
    status:      'published',
    approved_by: approvedBy,
    published_at: new Date().toISOString(),
  });
}

export async function archiveDocument(id) {
  return updateDocument(id, { status: 'archived' });
}

export async function getDocumentStats() {
  const { data, error } = await supabase
    .from('governance_documents')
    .select('status');
  if (error) throw error;
  const stats = { total: 0, published: 0, draft: 0, submitted: 0, approved: 0, archived: 0 };
  (data || []).forEach(d => {
    stats.total++;
    if (stats[d.status] !== undefined) stats[d.status]++;
  });
  return stats;
}

/* ═══════════════════════════════════════════════════════════
   ACCOUNTABILITY — concern_submissions
═══════════════════════════════════════════════════════════ */

export async function submitConcern(concern) {
  const { data, error } = await supabase
    .from('concern_submissions')
    .insert({
      category:        concern.category,
      subject:         concern.subject,
      description:     concern.description,
      office:          concern.office || null,
      is_anonymous:    concern.is_anonymous || false,
      submitter_name:  concern.is_anonymous ? null : (concern.submitter_name || null),
      submitter_email: concern.is_anonymous ? null : (concern.submitter_email || null),
      student_number:  concern.is_anonymous ? null : (concern.student_number  || null),
      priority:        concern.priority || 'normal',
    })
    .select('id,reference_no,status,created_at')
    .single();
  if (error) throw error;
  return data;
}

export async function getConcernByRef(referenceNo) {
  const { data, error } = await supabase
    .from('concern_submissions')
    .select('id,reference_no,category,subject,status,priority,office,assigned_office,resolution_note,created_at,updated_at,resolved_at')
    .eq('reference_no', referenceNo.trim().toUpperCase())
    .single();
  if (error) throw error;
  return data;
}

export async function getAllConcerns(filters = {}) {
  let q = supabase
    .from('concern_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
  if (filters.category && filters.category !== 'all') q = q.eq('category', filters.category);
  if (filters.priority && filters.priority !== 'all') q = q.eq('priority', filters.priority);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function updateConcernStatus(id, { status, resolution_note, internal_notes, assigned_to, assigned_office, target_deadline }) {
  const updates = { status };
  if (resolution_note  !== undefined) updates.resolution_note  = resolution_note;
  if (internal_notes   !== undefined) updates.internal_notes   = internal_notes;
  if (assigned_to      !== undefined) updates.assigned_to      = assigned_to;
  if (assigned_office  !== undefined) updates.assigned_office  = assigned_office;
  if (target_deadline  !== undefined) updates.target_deadline  = target_deadline;
  if (status === 'resolved' || status === 'closed') updates.resolved_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('concern_submissions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getConcernStats() {
  const { data, error } = await supabase
    .from('concern_submissions')
    .select('status,priority');
  if (error) throw error;
  const s = { total: 0, submitted: 0, received: 0, assigned: 0, under_review: 0, action_in_progress: 0, resolved: 0, closed: 0, rejected: 0 };
  (data || []).forEach(c => { s.total++; if (s[c.status] !== undefined) s[c.status]++; });
  s.open = s.submitted + s.received + s.assigned + s.under_review + s.action_in_progress;
  return s;
}

/* ═══════════════════════════════════════════════════════════
   PARTICIPATION — consultations + questions + responses
═══════════════════════════════════════════════════════════ */

export async function getPublishedConsultations() {
  const { data, error } = await supabase
    .from('consultations')
    .select('id,title,description,type,status,opens_at,closes_at,created_by,created_at')
    .eq('status', 'published')
    .order('opens_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAllConsultations() {
  const { data, error } = await supabase
    .from('consultations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createConsultation(consultation) {
  const { data, error } = await supabase
    .from('consultations')
    .insert(consultation)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateConsultation(id, updates) {
  const { data, error } = await supabase
    .from('consultations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getConsultationWithQuestions(id) {
  const [consultRes, questRes] = await Promise.all([
    supabase.from('consultations').select('*').eq('id', id).single(),
    supabase.from('consultation_questions').select('*').eq('consultation_id', id).order('sort_order'),
  ]);
  if (consultRes.error) throw consultRes.error;
  if (questRes.error)   throw questRes.error;
  return { ...consultRes.data, questions: questRes.data || [] };
}

export async function addQuestion(consultationId, question) {
  const { data, error } = await supabase
    .from('consultation_questions')
    .insert({ ...question, consultation_id: consultationId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function submitResponse(consultationId, responses) {
  // responses: [{ question_id, answer, is_anonymous }]
  const rows = responses.map(r => ({
    consultation_id: consultationId,
    question_id:     r.question_id,
    answer:          r.answer,
    is_anonymous:    r.is_anonymous !== false,
  }));
  const { error } = await supabase.from('consultation_responses').insert(rows);
  if (error) throw error;
}

export async function getConsultationStats(consultationId) {
  const { count, error } = await supabase
    .from('consultation_responses')
    .select('*', { count: 'exact', head: true })
    .eq('consultation_id', consultationId);
  if (error) throw error;
  return { responseCount: count || 0 };
}

export async function getParticipationStats() {
  const [cons, resp] = await Promise.all([
    supabase.from('consultations').select('status'),
    supabase.from('consultation_responses').select('*', { count: 'exact', head: true }),
  ]);
  const active = (cons.data || []).filter(c => c.status === 'published').length;
  return { total: (cons.data || []).length, active, responses: resp.count || 0 };
}

/* ═══════════════════════════════════════════════════════════
   STORAGE — governance-documents bucket
   Bucket must exist in Supabase: Storage → New bucket →
   name "governance-documents", Public bucket ✓
═══════════════════════════════════════════════════════════ */

/**
 * Upload a file to the governance-documents bucket.
 * Returns the public URL string.
 * @param {File}   file       - File object from <input type="file">
 * @param {string} folderPath - e.g. "transparency" (optional prefix)
 * @param {function} onProgress - called with 0-100 (best-effort)
 */
export async function uploadGovernanceFile(file, folderPath = 'documents', onProgress) {
  const ext       = file.name.split('.').pop();
  const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const path      = `${folderPath}/${timestamp}_${safeName}`;

  // Supabase JS v2 upload — no native progress, so we fake 0→100
  if (onProgress) onProgress(10);

  const { error } = await supabase.storage
    .from('governance-documents')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    });

  if (error) {
    if (error.message?.toLowerCase().includes('bucket') || error.statusCode === '404' || error.error === 'Bucket not found') {
      throw new Error(
        'Storage bucket "governance-documents" not found. ' +
        'Go to Supabase → Storage → New bucket → name it "governance-documents" → enable Public → Save.'
      );
    }
    throw new Error(error.message);
  }
  if (onProgress) onProgress(90);

  const { data: urlData } = supabase.storage
    .from('governance-documents')
    .getPublicUrl(path);

  if (onProgress) onProgress(100);
  return urlData.publicUrl;
}

/* ═══════════════════════════════════════════════════════════
   SOFT DELETE (archive) + PERMANENT DELETE helpers
   "Delete" in UI → moves to archive (status='archived')
   "Archived" items hidden from normal queries
   "Permanent Delete" → truly removes from DB
═══════════════════════════════════════════════════════════ */

/* ── Documents ── */
export async function deleteDocument(id) {
  // Soft delete — move to archive
  const { error } = await supabase
    .from('governance_documents')
    .update({ status: 'archived' })
    .eq('id', id);
  if (error) throw error;
}

export async function permanentlyDeleteDocument(id) {
  const { error } = await supabase
    .from('governance_documents')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function restoreDocument(id) {
  const { error } = await supabase
    .from('governance_documents')
    .update({ status: 'draft' })
    .eq('id', id);
  if (error) throw error;
}

export async function getArchivedDocuments() {
  const { data, error } = await supabase
    .from('governance_documents')
    .select('*')
    .eq('status', 'archived')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/* ── Concerns ── */
export async function deleteConcern(id) {
  // Soft delete — mark as archived
  const { error } = await supabase
    .from('concern_submissions')
    .update({ status: 'archived' })
    .eq('id', id);
  if (error) throw error;
}

export async function permanentlyDeleteConcern(id) {
  const { error } = await supabase
    .from('concern_submissions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function restoreConcern(id) {
  const { error } = await supabase
    .from('concern_submissions')
    .update({ status: 'closed' })
    .eq('id', id);
  if (error) throw error;
}

export async function getArchivedConcerns() {
  const { data, error } = await supabase
    .from('concern_submissions')
    .select('*')
    .eq('status', 'archived')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/* ── Consultations ── */
export async function deleteConsultation(id) {
  // Soft delete — move to archived status
  const { error } = await supabase
    .from('consultations')
    .update({ status: 'archived' })
    .eq('id', id);
  if (error) throw error;
}

export async function permanentlyDeleteConsultation(id) {
  const { error } = await supabase
    .from('consultations')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function restoreConsultation(id) {
  const { error } = await supabase
    .from('consultations')
    .update({ status: 'draft' })
    .eq('id', id);
  if (error) throw error;
}

export async function getArchivedConsultations() {
  const { data, error } = await supabase
    .from('consultations')
    .select('*')
    .eq('status', 'archived')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
