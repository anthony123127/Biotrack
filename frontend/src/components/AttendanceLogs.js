import React, { useEffect, useState } from "react";
import { getAttendanceLogs, exportAttendance } from "../services/api";
import { MdDownload, MdWarning, MdSearch, MdFilterList } from "react-icons/md";

export default function AttendanceLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    grade_level: "",
    year_level: "",
    search: ""
  });

  const loadLogs = async () => {
    setLoading(true);
    try {
      // We'll filter client-side for "search" but server-side for grade/year if implemented, 
      // or just filter all client-side for better UX if the dataset isn't huge.
      const res = await getAttendanceLogs({
        grade_level: filters.grade_level,
        year_level: filters.year_level
      });
      setLogs(res.data || []);
    } catch (err) {
      setError("Failed to load attendance logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filters.grade_level, filters.year_level]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredLogs = logs.filter(log => 
    log.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
    log.student_id.toLowerCase().includes(filters.search.toLowerCase())
  );

  const handleExport = async () => {
    try {
      const res = await exportAttendance(filters);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to export attendance data.");
    }
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Attendance Logs</h1>
          <p>Historical record of student attendance scans</p>
        </div>
        <button className="btn btn-primary" onClick={handleExport}>
          <MdDownload size={20} /> Export to CSV
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <MdWarning size={20} /> {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-panel mb-6 flex flex-wrap gap-4 items-end">
        <div className="form-group mb-0" style={{ flex: 1, minWidth: "200px" }}>
          <label className="flex items-center gap-2"><MdSearch /> Search Student</label>
          <input 
            type="text" 
            name="search" 
            placeholder="Name or ID..." 
            value={filters.search} 
            onChange={handleFilterChange} 
          />
        </div>
        
        <div className="form-group mb-0" style={{ width: "180px" }}>
          <label className="flex items-center gap-2"><MdFilterList /> Grade Level</label>
          <select name="grade_level" value={filters.grade_level} onChange={handleFilterChange}>
            <option value="">All Grades</option>
            <option value="Kindergarten">Kindergarten</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 2">Grade 2</option>
            <option value="Grade 3">Grade 3</option>
            <option value="Grade 4">Grade 4</option>
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 6">Grade 6</option>
            <option value="Grade 7">Grade 7</option>
            <option value="Grade 8">Grade 8</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </select>
        </div>

        <div className="form-group mb-0" style={{ width: "180px" }}>
          <label className="flex items-center gap-2"><MdFilterList /> Year Level</label>
          <select name="year_level" value={filters.year_level} onChange={handleFilterChange}>
            <option value="">All Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>

        <button className="btn btn-outline" onClick={loadLogs} style={{ height: "42px" }}>
           Refresh
        </button>
      </div>

      <div className="glass-panel w-full">
        <div className="flex justify-between items-center mb-6">
           <h2>Global Attendance Ledger</h2>
           <span className="text-secondary text-sm">{filteredLogs.length} records found</span>
        </div>
        
        {loading ? (
          <div className="text-center py-20">Loading records...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-700 rounded-xl">
            <p style={{ color: "var(--text-secondary)" }}>No attendance records found matching your filters.</p>
          </div>
        ) : (
          <div className="data-table-wrapper" style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>Level</th>
                  <th>Date</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: "500", color: "var(--accent-primary)" }}>{log.student_id}</td>
                    <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{log.full_name}</td>
                    <td>{log.grade_level}</td>
                    <td>{log.date}</td>
                    <td style={{ color: "#10b981" }}>{log.time_in || "--:--:--"}</td>
                    <td style={{ color: "#f87171" }}>{log.time_out || "--:--:--"}</td>
                    <td>
                      <div className="flex gap-2">
                        {log.entry_status && <span className="badge badge-present">In</span>}
                        {log.exit_status && <span className="badge badge-absent">Out</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}