import React, { useEffect, useState } from "react";
import { 
  getAttendanceStats, 
  exportAttendance, 
  searchReports, 
  getMonthlySummaries 
} from "../services/api";
import { 
  MdDownload, MdAssessment, MdWarning, MdFilterList, 
  MdSearch, MdHistory, MdTimeline, MdPieChart 
} from "react-icons/md";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Reports() {
  const [stats, setStats] = useState({
    activePopulation: 0,
    capturedToday: 0,
    unaccounted: 0,
    historicalScanVolume: 0,
    dailyAttendanceRate: 0,
    hourlyTrend: [],
    distribution: []
  });
  
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    studentId: "",
    course: "",
    grade_level: ""
  });

  const [searchParams, setSearchParams] = useState({
    name: "",
    grade_level: "",
    startDate: "",
    endDate: ""
  });

  const [searchResults, setSearchResults] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const loadData = async () => {
    try {
      const [statsRes, monthlyRes] = await Promise.all([
        getAttendanceStats(),
        getMonthlySummaries()
      ]);
      setStats(statsRes.data);
      setMonthlyData(monthlyRes.data);
    } catch (err) {
      setError("Failed to load report data.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearchChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const onSearch = async (e) => {
    if (e) e.preventDefault();
    setSearching(true);
    try {
      const res = await searchReports(searchParams);
      setSearchResults(res.data);
    } catch (err) {
      setError("Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await exportAttendance(filters);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to export report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: "40px" }}>
      <div className="page-header">
        <h1>Advanced Analytics & Reports</h1>
        <p>Comprehensive monitoring with visualization and historical search</p>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <MdWarning size={20} /> {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="panel-grid four-cols mb-6">
        <div className="glass-panel text-center">
          <p className="text-xs uppercase tracking-wider text-secondary mb-2">Rate Today</p>
          <h2 className="text-3xl font-bold text-primary">{stats.dailyAttendanceRate}%</h2>
        </div>
        <div className="glass-panel text-center">
          <p className="text-xs uppercase tracking-wider text-secondary mb-2">Active Students</p>
          <h2 className="text-3xl font-bold text-primary">{stats.activePopulation}</h2>
        </div>
        <div className="glass-panel text-center">
          <p className="text-xs uppercase tracking-wider text-secondary mb-2">Present Today</p>
          <h2 className="text-3xl font-bold text-success" style={{ color: "#10b981" }}>{stats.capturedToday}</h2>
        </div>
        <div className="glass-panel text-center">
          <p className="text-xs uppercase tracking-wider text-secondary mb-2">Total Scans</p>
          <h2 className="text-3xl font-bold text-primary">{stats.historicalScanVolume}</h2>
        </div>
      </div>

      {/* Graphs Section */}
      <div className="panel-grid" style={{ gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div className="glass-panel">
          <h3 className="mb-6 flex items-center gap-2">
            <MdTimeline color="var(--accent-primary)" /> Monthly Scan Volume
          </h3>
          <div style={{ width: "100%", height: "250px" }}>
            <ResponsiveContainer>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid var(--glass-border)", borderRadius: "8px" }}
                />
                <Bar dataKey="count" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel">
          <h3 className="mb-6 flex items-center gap-2">
            <MdPieChart color="var(--accent-primary)" /> Grade Distribution
          </h3>
          <div style={{ width: "100%", height: "250px" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={stats.distribution}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="panel-grid two-cols">
         {/* Search Student History */}
         <div className="glass-panel">
           <h2 className="mb-6 flex items-center gap-3">
             <MdHistory size={24} color="var(--accent-primary)" />
             Search Student History
           </h2>

           <form onSubmit={onSearch} className="standard-form mb-6">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="form-group">
                    <label style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.6 }}>Date From</label>
                    <input type="date" name="startDate" value={searchParams.startDate} onChange={handleSearchChange} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.6 }}>Date To</label>
                    <input type="date" name="endDate" value={searchParams.endDate} onChange={handleSearchChange} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      name="name"
                      placeholder="Student Full Name..."
                      value={searchParams.name}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={searching}>
                    {searching ? "..." : <MdSearch size={22} />}
                  </button>
                </div>
            </form>

           <div className="data-table-wrapper" style={{ maxHeight: "300px", overflowY: "auto" }}>
              <table className="data-table text-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Level</th>
                    <th>In</th>
                    <th>Out</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-10 opacity-50 italic">No search results</td></tr>
                  ) : (
                    searchResults.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontSize: "11px" }}>{r.date}</td>
                        <td style={{ fontWeight: 600 }}>{r.full_name}</td>
                        <td>{r.grade_level}</td>
                        <td style={{ color: "#10b981" }}>{r.time_in || "--"}</td>
                        <td style={{ color: "#f87171" }}>{r.time_out || "--"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
           </div>
         </div>

         {/* Enhanced Export Panel */}
         <div className="glass-panel">
           <h2 className="mb-6 flex items-center gap-3">
             <MdFilterList size={24} color="var(--accent-primary)" />
             Filtered Export
           </h2>
           <div className="standard-form">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="form-group">
                  <label>Grade/Year Level</label>
                  <select name="grade_level" value={filters.grade_level} onChange={handleFilterChange}>
                    <option value="">All Levels</option>
                    <option value="Kindergarten">Kindergarten</option>
                    <optgroup label="Basic Ed">
                      <option value="Grade 1">Grade 1</option>
                      <option value="Grade 6">Grade 6</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 12">Grade 12</option>
                    </optgroup>
                    <optgroup label="Higher Ed">
                      <option value="1st Year">1st Year</option>
                      <option value="4th Year">4th Year</option>
                    </optgroup>
                  </select>
                </div>
                <div className="form-group">
                  <label>Course</label>
                  <input type="text" name="course" placeholder="e.g. BSIT" value={filters.course} onChange={handleFilterChange} />
                </div>
              </div>
              <button 
                className="btn btn-primary w-full mt-6 py-4" 
                onClick={handleExport}
                disabled={loading}
              >
                {loading ? "Preparing File..." : <><MdDownload size={22} /> Export Final Report (CSV)</>}
              </button>
           </div>
         </div>
      </div>
    </div>
  );
}