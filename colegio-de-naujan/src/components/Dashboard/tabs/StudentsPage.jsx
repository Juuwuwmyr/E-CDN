/**
 * StudentsPage — Admin-only "Students" tab
 * Stat cards · searchable/filterable grid · bulk import (xlsx/csv) · template download
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { getAllStudents, upsertStudents, parseEnrollmentFile, parseDept, yearLabel, avatarColor } from "../../../lib/students";
import { logActivity } from "../../../lib/activityLogger";

/* ── helpers ── */
const DEPTS  = ["All", "BSIS", "BTVTED-WFT", "BTVTED-CHS", "BPA"];
const YEARS  = ["All", "1", "2", "3", "4"];
const YEAR_L = { "1":"1st Year", "2":"2nd Year", "3":"3rd Year", "4":"4th Year" };
const DEPT_COLORS = {
  "BSIS":       { color:"#002280", bg:"#eef1fb" },
  "BTVTED-WFT": { color:"#C8960C", bg:"#fdf8ec" },
  "BTVTED-CHS": { color:"#7c3aed", bg:"#f5f0ff" },
  "BPA":        { color:"#10813f", bg:"#edf7f1" },
  "Unknown":    { color:"#6b7280", bg:"#f3f4f6" },
};

/* ── sub-components ── */
const Avatar = ({ student }) => {
  const name  = student.full_name || "?";
  const parts = name.split(",");
  const lastI = (parts[0]?.[0] || "").toUpperCase();
  const firstI = (parts[1]?.trim()?.[0] || "").toUpperCase();
  const init  = (lastI + firstI) || "?";
  const color = avatarColor(student.student_number);
  return (
    <span style={{ background:color, color:"#fff", width:"100%", height:"100%",
      borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:"1.1rem", fontWeight:800 }}>
      {init}
    </span>
  );
};

const StudentCard = ({ student }) => {
  const dept  = parseDept(student.course);
  const dc    = DEPT_COLORS[dept] || DEPT_COLORS["Unknown"];
  return (
    <div className="sl-card">
      <div className="sl-card-avatar">
        <Avatar student={student} />
      </div>
      <div className="sl-card-body">
        <p className="sl-card-name">{student.full_name || "—"}</p>
        <p className="sl-card-sn">{student.student_number}</p>
        <div className="sl-card-tags">
          <span className="sl-dept-badge" style={{ color:dc.color, background:dc.bg }}>{dept}</span>
          <span className="sl-year-badge">{yearLabel(student.year_level)}</span>
          {student.sex && (
            <span className={"sl-sex-badge sl-sex-" + student.sex.toLowerCase()}>{student.sex}</span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── ImportModal ── */
const ImportModal = ({ rows, skipped, onConfirm, onCancel, loading }) => (
  <div className="sl-modal-backdrop" onClick={e => e.target === e.currentTarget && onCancel()}>
    <div className="sl-modal">
      <div className="sl-modal-header">
        <h3>Import Preview</h3>
        <button className="sl-modal-close" onClick={onCancel}>✕</button>
      </div>
      <p className="sl-modal-sub">
        <strong>{rows.length}</strong> valid records found.
        {skipped.length > 0 && <span className="sl-warn"> {skipped.length} row(s) skipped (missing required fields): rows {skipped.join(", ")}</span>}
      </p>
      <div className="sl-preview-table-wrap">
        <table className="sl-preview-table">
          <thead>
            <tr><th>Student No.</th><th>Name</th><th>Course</th><th>Year</th></tr>
          </thead>
          <tbody>
            {rows.slice(0,5).map((r,i) => (
              <tr key={i}>
                <td>{r.student_number}</td>
                <td>{r.full_name}</td>
                <td>{r.course}</td>
                <td>{r.year_level}</td>
              </tr>
            ))}
            {rows.length > 5 && <tr><td colSpan={4} style={{textAlign:"center",color:"#9ca3af",fontSize:".78rem"}}>+{rows.length-5} more…</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="sl-modal-actions">
        <button className="sl-btn sl-btn--ghost" onClick={onCancel} disabled={loading}>Cancel</button>
        <button className="sl-btn sl-btn--primary" onClick={onConfirm} disabled={loading}>
          {loading ? "Importing…" : `Import ${rows.length} Students`}
        </button>
      </div>
    </div>
  </div>
);

/* ── main page ── */
const StudentsPage = () => {
  const [students, setStudents]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState(null);
  const [search,   setSearch]     = useState("");
  const [dept,     setDept]       = useState("All");
  const [year,     setYear]       = useState("All");
  const [toast,    setToast]      = useState(null);

  /* import state */
  const [preview,  setPreview]    = useState(null); // { rows, skipped }
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();
  const [viewMode, setViewMode] = useState("list"); // "card" | "list"
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 24;

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStudents = async () => {
    setLoading(true); setError(null);
    try   { setStudents(await getAllStudents()); }
    catch (e) { setError(e.message); }
    finally   { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, []);

  /* debounced search */
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  /* stat counts */
  const counts = useMemo(() => {
    const c = { total:students.length, BSIS:0, "BTVTED-WFT":0, "BTVTED-CHS":0, BPA:0 };
    students.forEach(s => { const d = parseDept(s.course); if (c[d] !== undefined) c[d]++; });
    return c;
  }, [students]);

  /* filtered list */
  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return students.filter(s => {
      const matchSearch = !q || [s.full_name, s.student_number]
        .some(v => (v||"").toLowerCase().includes(q));
      const matchDept = dept === "All" || parseDept(s.course) === dept;
      const matchYear = year === "All" || String(s.year_level) === year;
      return matchSearch && matchDept && matchYear;
    });
  }, [students, debouncedSearch, dept, year]);

  /* pagination */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  /* parse file */
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const { rows, skipped } = await parseEnrollmentFile(file);
      if (!rows.length) { showToast("No valid student rows found.", "error"); return; }
      setPreview({ rows, skipped });
    } catch(err) {
      showToast("Failed to parse file: " + err.message, "error");
    }
  };

    const confirmImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const count = await upsertStudents(preview.rows);
      showToast(`Successfully imported ${count} student(s).`);
      setPreview(null);
      await fetchStudents();
    } catch(e) {
      showToast("Import failed: " + e.message, "error");
    } finally {
      setImporting(false);
    }
  };

  // Reset to page 0 when filters or view changes
  useEffect(() => { setPage(0); }, [debouncedSearch, dept, year, viewMode]);

  const clearFilters = () => { setSearch(""); setDept("All"); setYear("All"); };
  const hasFilters   = search || dept !== "All" || year !== "All";

  /* stat cards config */
  const STAT_CARDS = [
    { label:"Total Students",  value:counts.total,          color:"#002280", bg:"#eef1fb" },
    { label:"BSIS",            value:counts["BSIS"],         color:"#002280", bg:"#eef1fb" },
    { label:"BTVTED-WFT",     value:counts["BTVTED-WFT"],   color:"#C8960C", bg:"#fdf8ec" },
    { label:"BTVTED-CHS",     value:counts["BTVTED-CHS"],   color:"#7c3aed", bg:"#f5f0ff" },
    { label:"BPA",             value:counts["BPA"],          color:"#10813f", bg:"#edf7f1" },
  ];

  return (
    <div className="db-home-content" style={{ paddingBottom: "4rem" }}>

      {/* toast */}
      {toast && (
        <div className={`sl-toast sl-toast--${toast.type}`}>{toast.msg}</div>
      )}

      {/* stat cards */}
      <div className="sl-stats-row" style={{ marginBottom: "1.5rem" }}>
        {STAT_CARDS.map(s => (
          <div key={s.label} className="db-stat-card" style={{"--sc":s.color,"--sc-bg":s.bg}}>
            <div className="db-stat-icon" style={{background:s.bg,color:s.color}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div className="db-stat-body">
              <p className="db-stat-value">{loading ? "…" : s.value}</p>
              <p className="db-stat-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* toolbar */}
      <div className="sl-toolbar">
        <div className="sl-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="sl-search"
            placeholder="Search name or student no…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className="sl-select" value={dept} onChange={e => setDept(e.target.value)}>
          {DEPTS.map(d => <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>)}
        </select>

        <select className="sl-select" value={year} onChange={e => setYear(e.target.value)}>
          {YEARS.map(y => <option key={y} value={y}>{y === "All" ? "All Years" : YEAR_L[y]}</option>)}
        </select>

        <div className="sl-toolbar-right">
          {/* View toggle */}
          <div className="sl-view-toggle">
            <button
              className={"sl-view-btn" + (viewMode === "card" ? " sl-view-btn--active" : "")}
              onClick={() => setViewMode("card")}
              title="Card view"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button
              className={"sl-view-btn" + (viewMode === "list" ? " sl-view-btn--active" : "")}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/>
                <circle cx="3" cy="18" r="1" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <button className="sl-btn sl-btn--primary" onClick={() => fileRef.current?.click()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import Students
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.csv" style={{display:"none"}} onChange={handleFile}/>
        </div>
      </div>

      {/* results count */}
      {!loading && !error && (
        <div className="sl-count">
          Showing <strong>{filtered.length}</strong> of {students.length} students
          {hasFilters && (
            <button className="sl-clear-btn" onClick={clearFilters}>Clear filters</button>
          )}
        </div>
      )}

      {/* error */}
      {error && (
        <div className="sl-error">
          <p>Failed to load students: {error}</p>
          <button className="sl-btn sl-btn--ghost" onClick={fetchStudents}>Retry</button>
        </div>
      )}

      {/* grid */}
      {loading ? (
        <div className="sl-loading">
          {[...Array(8)].map((_,i) => <div key={i} className="sl-card sl-card--skeleton"/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="db-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
          <p>{hasFilters ? "No students match your filters." : "No students found."}</p>
          {hasFilters && <button className="sl-btn sl-btn--ghost" onClick={clearFilters}>Clear Filters</button>}
        </div>
      ) : viewMode === "card" ? (
        <div className="sl-grid">
          {paginated.map(s => <StudentCard key={s.student_number} student={s}/>)}
        </div>
      ) : (
        <div className="sl-list">
          {paginated.map((s, i) => {
            const globalI = page * PAGE_SIZE + i;
            const dept = parseDept(s.course);
            const dc   = DEPT_COLORS[dept] || DEPT_COLORS["Unknown"];
            const color = avatarColor(s.student_number);
            const parts = (s.full_name||"").split(",");
            const init  = ((parts[0]?.[0]||"")+(parts[1]?.trim()?.[0]||"")).toUpperCase()||"?";
            return (
              <div key={s.student_number} className="sl-list-row">
                <span className="sl-list-num">{globalI+1}</span>
                <div className="sl-list-avatar" style={{background:color}}>{init}</div>
                <div className="sl-list-info">
                  <p className="sl-list-name">{s.full_name||"—"}</p>
                  <p className="sl-list-sn">{s.student_number}</p>
                </div>
                <span className="sl-dept-badge" style={{color:dc.color,background:dc.bg}}>{dept}</span>
                <span className="sl-year-badge">{yearLabel(s.year_level)}</span>
                {s.sex && <span className={"sl-sex-badge sl-sex-" + s.sex.toLowerCase()}>{s.sex}</span>}
                <span className={"sl-status-badge sl-status-"+s.enrollment_status}>{s.enrollment_status}</span>
              </div>
            );
          })}
        </div>
      )}


      {/* pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="sl-pagination">
          <button
            className="sl-page-btn"
            onClick={() => setPage(0)}
            disabled={page === 0}
          >«</button>
          <button
            className="sl-page-btn"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >‹ Prev</button>

          <div className="sl-page-nums">
            {Array.from({ length: totalPages }, (_, i) => {
              // Show first, last, current ±1, and ellipsis
              if (
                i === 0 || i === totalPages - 1 ||
                Math.abs(i - page) <= 1
              ) {
                return (
                  <button
                    key={i}
                    className={"sl-page-num" + (i === page ? " sl-page-num--active" : "")}
                    onClick={() => setPage(i)}
                  >{i + 1}</button>
                );
              }
              if (Math.abs(i - page) === 2) {
                return <span key={i} className="sl-page-ellipsis">…</span>;
              }
              return null;
            })}
          </div>

          <button
            className="sl-page-btn"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >Next ›</button>
          <button
            className="sl-page-btn"
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
          >»</button>

          <span className="sl-page-info">
            Page {page + 1} of {totalPages} · {filtered.length} students
          </span>
        </div>
      )}
      {/* import modal */}
      {preview && (
        <ImportModal
          rows={preview.rows}
          skipped={preview.skipped}
          onConfirm={confirmImport}
          onCancel={() => setPreview(null)}
          loading={importing}
        />
      )}
    </div>
  );
};

export default StudentsPage;