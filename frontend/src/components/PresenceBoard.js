import React, { useState, useEffect } from "react";
import { getPresenceStatus } from "../services/api";
import { MdSearch, MdPeople, MdCheckCircle, MdExitToApp, MdHourglassEmpty } from "react-icons/md";

function PresenceBoard() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPresence = async () => {
    try {
      const res = await getPresenceStatus();
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch presence", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresence();
    const interval = setInterval(fetchPresence, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const filtered = students.filter(s => 
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id.includes(search)
  );

  const stats = {
    inside: students.filter(s => s.status === "Inside").length,
    timedOut: students.filter(s => s.status === "Timed Out").length,
    absent: students.filter(s => s.status === "Absent").length
  };

  if (loading) return <div className="loading">Loading Presence Board...</div>;

  return (
    <div className="presence-container">
      <div className="page-header">
        <h1><MdPeople /> Real-Time Presence Board</h1>
        <div className="search-bar">
          <MdSearch />
          <input 
            placeholder="Search student name or ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card inside">
          <MdCheckCircle />
          <div className="info">
            <h3>{stats.inside}</h3>
            <p>Currently Inside</p>
          </div>
        </div>
        <div className="stat-card timed-out">
          <MdExitToApp />
          <div className="info">
            <h3>{stats.timedOut}</h3>
            <p>Timed Out</p>
          </div>
        </div>
        <div className="stat-card absent">
          <MdHourglassEmpty />
          <div className="info">
            <h3>{stats.absent}</h3>
            <p>Absent / No Record</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="presence-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Full Name</th>
              <th>Grade/Year</th>
              <th>Status</th>
              <th>Time In</th>
              <th>Time Out</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.student_id} className={`status-${s.status.toLowerCase().replace(' ', '-')}`}>
                <td>{s.student_id}</td>
                <td>{s.full_name}</td>
                <td>{s.grade_level}</td>
                <td>
                  <span className={`status-badge ${s.status.toLowerCase().replace(' ', '-')}`}>
                    {s.status}
                  </span>
                </td>
                <td>{s.time_in || "--:--"}</td>
                <td>{s.time_out || "--:--"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PresenceBoard;
