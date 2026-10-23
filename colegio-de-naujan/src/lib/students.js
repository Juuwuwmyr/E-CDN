import { supabase } from './supabase';
import * as XLSX    from 'xlsx';

/* ── Fetch ── */
export async function getAllStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('student_number,full_name,course,year_level,gender,sex,enrollment_status,academic_year,semester,remarks,is_active')
    .order('full_name', { ascending: true });
  if (error) throw error;
  return data || [];
}

/* ── Upsert (batch 100) ── */
export async function upsertStudents(rows) {
  let total = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const { error } = await supabase
      .from('students')
      .upsert(chunk, { onConflict: 'student_number' });
    if (error) throw error;
    total += chunk.length;
  }
  return total;
}

/* ── Parse enrollment Excel ──
   Sheet: "BPA 1", "BSIS 2", "WFT 3", "CHS 4"
   Row 9 header: No. | Name | ID Number | Date | Sex | Remarks
   Skip: WITHDRAW, OD, STOPPED
── */
export function parseEnrollmentFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload  = (ev) => {
      try {
        const wb   = XLSX.read(ev.target.result, { type: 'array' });
        const SKIP = ['WITHDRAW', 'OD', 'STOPPED'];
        const valid = [], skipped = [];

        wb.SheetNames.forEach(sheetName => {
          if (SKIP.some(s => sheetName.toUpperCase().includes(s))) return;

          const match = sheetName.trim().match(/^(BPA|BSIS|WFT|CHS)\s+(\d)/i);
          if (!match) return;

          const courseRaw = match[1].toUpperCase();
          const yearNum   = match[2];
          const course    = courseRaw === 'WFT' ? 'BTVTED-WFT'
                          : courseRaw === 'CHS' ? 'BTVTED-CHS'
                          : courseRaw;

          const ws   = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

          const hIdx = rows.findIndex(r =>
            r.some(c => String(c).toLowerCase().includes('id number'))
          );
          if (hIdx === -1) return;

          rows.slice(hIdx + 1).forEach((row, relIdx) => {
            const rawName = String(row[1] || '').trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
            const idRaw   = String(row[2] || '').trim().replace(/\s/g, '');
            const sexRaw  = String(row[4] || '').trim().toUpperCase();
            const remarks = String(row[5] || '').trim() || null;

            if (!rawName && !idRaw) return;
            if (!idRaw || !rawName) {
              skipped.push(`${sheetName} row ${hIdx + 2 + relIdx}`);
              return;
            }

            const sex    = sexRaw === 'M' ? 'Male' : sexRaw === 'F' ? 'Female' : (sexRaw || null);
            const gender = sex;

            valid.push({
              student_number:    idRaw,
              full_name:         rawName,
              course,
              year_level:        parseInt(yearNum, 10),
              sex,
              gender,
              remarks,
              enrollment_status: 'enrolled',
              academic_year:     'AY 2026-2027',
              semester:          '1st',
              is_active:         true,
            });
          });
        });

        // ── Parse WITHDRAW sheet ──
        const wSheet = wb.Sheets["WITHDRAW"];
        if (wSheet) {
          const wRows = XLSX.utils.sheet_to_json(wSheet, { header: 1, defval: "" });
          const wHIdx = wRows.findIndex(r => r.some(c => String(c).toLowerCase().includes("student id")));
          if (wHIdx > -1) {
            wRows.slice(wHIdx + 1).forEach((row, ri) => {
              const name     = String(row[1]||"").trim().replace(/\n/g," ").replace(/\s+/g," ");
              const idRaw    = String(row[2]||"").trim().replace(/\s/g,"");
              const courseYr = String(row[3]||"").trim(); // e.g. "BSIS 1"
              if (!name || !idRaw) return;
              const cm = courseYr.match(/^(BPA|BSIS|WFT|CHS)\s+(\d)/i);
              const course = !cm ? courseYr
                : cm[1].toUpperCase() === "WFT" ? "BTVTED-WFT"
                : cm[1].toUpperCase() === "CHS" ? "BTVTED-CHS"
                : cm[1].toUpperCase();
              const yr = cm ? parseInt(cm[2],10) : null;
              valid.push({
                student_number: idRaw, full_name: name,
                course, year_level: yr,
                sex: null, gender: null, remarks: "Withdrawn",
                enrollment_status: "dropped",
                academic_year: "AY 2026-2027", semester: "1st", is_active: false,
              });
            });
          }
        }

        // ── Parse OD sheet ──
        const odSheet = wb.Sheets["OD"];
        if (odSheet) {
          const odRows = XLSX.utils.sheet_to_json(odSheet, { header: 1, defval: "" });
          const odHIdx = odRows.findIndex(r => r.some(c => String(c).toLowerCase().includes("student id")));
          if (odHIdx > -1) {
            odRows.slice(odHIdx + 1).forEach((row) => {
              const name     = String(row[1]||"").trim().replace(/\n/g," ").replace(/\s+/g," ");
              const idRaw    = String(row[2]||"").trim().replace(/\s/g,"");
              const courseYr = String(row[3]||"").trim();
              const status   = String(row[4]||"").trim();
              if (!name || !idRaw) return;
              const cm = courseYr.match(/^(BPA|BSIS|WFT|CHS)\s+(\d)/i);
              const course = !cm ? courseYr
                : cm[1].toUpperCase() === "WFT" ? "BTVTED-WFT"
                : cm[1].toUpperCase() === "CHS" ? "BTVTED-CHS"
                : cm[1].toUpperCase();
              const yr = cm ? parseInt(cm[2],10) : null;
              valid.push({
                student_number: idRaw, full_name: name,
                course, year_level: yr,
                sex: null, gender: null, remarks: status || "OD",
                enrollment_status: "irregular",
                academic_year: "AY 2026-2027", semester: "1st", is_active: false,
              });
            });
          }
        }

        // Deduplicate by student_number — keep last occurrence
        const seen = new Map();
        valid.forEach(r => seen.set(r.student_number, r));
        resolve({ rows: Array.from(seen.values()), skipped });
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
}

/* ── Template ── */
export function downloadEnrollmentTemplate() {
  const wb = XLSX.utils.book_new();
  [
    { sheet: 'BPA 1',  label: 'BPA FIRST YEAR'         },
    { sheet: 'BSIS 2', label: 'BSIS SECOND YEAR'        },
    { sheet: 'WFT 3',  label: 'BTVTED-WFT THIRD YEAR'  },
    { sheet: 'CHS 4',  label: 'BTVTED-CHS FOURTH YEAR' },
  ].forEach(({ sheet, label }) => {
    const aoa = [
      ['','','','','',''],['','','','','',''],['','','','','',''],
      ['','','','','',''],['','','','','',''],
      ['ENROLLMENT LIST FOR FIRST SEMESTER, AY. 2026-2027','','','','',''],
      [label,'','','','',''],['','','','','',''],
      ['No.','Name','ID Number','Date','Sex','Remarks'],
      [1,'DELA CRUZ, JUAN A.','2026-0001','','M',''],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), sheet);
  });
  XLSX.writeFile(wb, 'enrollment_template.xlsx');
}

/* ── Helpers ── */
export function parseDept(course) {
  if (!course) return 'Unknown';
  const u = course.toUpperCase();
  if (u.includes('BSIS')) return 'BSIS';
  if (u.includes('WFT'))  return 'BTVTED-WFT';
  if (u.includes('CHS'))  return 'BTVTED-CHS';
  if (u.includes('BPA'))  return 'BPA';
  return course;
}

export function yearLabel(y) {
  const m = { '1':'1st Year','2':'2nd Year','3':'3rd Year','4':'4th Year',1:'1st Year',2:'2nd Year',3:'3rd Year',4:'4th Year' };
  return m[y] || (y ? `${y} Year` : 'N/A');
}

export function avatarColor(str) {
  let h = 0;
  for (const c of (str||'')) h = c.charCodeAt(0) + ((h << 5) - h);
  const colors = ['#002280','#7c3aed','#10813f','#C8102E','#C8960C','#0891b2','#e11d48'];
  return colors[Math.abs(h) % colors.length];
}