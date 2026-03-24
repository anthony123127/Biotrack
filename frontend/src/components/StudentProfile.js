import React, { useState, useEffect } from "react";
import { getStudents, getStudentHistoryReport } from "../services/api";
import { MdPerson, MdHistory, MdSearch } from "react-icons/md";

function StudentProfile() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await getStudents();
        setStudents(res.data || []);
      } catch (err) {
        console.error("Failed to load students", err);
      }
    };

    loadStudents();
  }, []);

  const handleSelect = async (student) => {
    setSelectedStudent(student);
    setLoading(true);

    try {
      const res = await getStudentHistoryReport(student.StudentID);
      setHistory(res.data.logs || []);
    } catch (err) {
      console.error("Failed to load history", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.FullName.toLowerCase().includes(search.toLowerCase()) ||
      s.StudentID.includes(search)
  );

  const getFaceStatusBadge = (student) => {
    const status = student.face_status || "pending";

    if (status === "approved") {
      return <span className="status-badge-premium timed-out">Approved</span>;
    }

    if (status === "rejected") {
      return <span className="status-badge-premium partial">Rejected</span>;
    }

    return <span className="status-badge-premium inside">Pending</span>;
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-sidebar glass-panel">
        <div className="sidebar-header-compact">
          <h3>
            <MdPerson /> Students
          </h3>
          <div className="search-box-pill">
            <MdSearch />
            <input
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="student-list">
          {filtered.length === 0 ? (
            <div className="empty-search">No students found</div>
          ) : (
            filtered.map((s) => (
              <div
                key={s.StudentID}
                className={`student-item ${
                  selectedStudent?.StudentID === s.StudentID ? "active" : ""
                }`}
                onClick={() => handleSelect(s)}
              >
                <div className="student-mini-info">
                  <div className="name">{s.FullName}</div>
                  <div className="id">{s.StudentID}</div>
                  <div style={{ marginTop: "6px" }}>{getFaceStatusBadge(s)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="profile-content">
        {selectedStudent ? (
          <>
            <div className="profile-hero-card glass-panel animate-fade-in">
              <div className="hero-avatar">{selectedStudent.FullName.charAt(0)}</div>

              <div className="hero-details">
                <div className="hero-header">
                  <h1>{selectedStudent.FullName}</h1>
                  <span
                    className={`education-badge ${
                      selectedStudent.Year.includes("Grade") ? "basic" : "higher"
                    }`}
                  >
                    {selectedStudent.Year.includes("Grade") ? "Basic Ed" : "Higher Ed"}
                  </span>
                </div>

                <div className="details-grid-premium">
                  <div className="detail-box">
                    <label>Student ID</label>
                    <p>{selectedStudent.StudentID}</p>
                  </div>

                  <div className="detail-box">
                    <label>Level / Year</label>
                    <p>{selectedStudent.Year}</p>
                  </div>

                  <div className="detail-box">
                    <label>Course / Program</label>
                    <p>{selectedStudent.Course || "Not Applicable"}</p>
                  </div>

                  <div className="detail-box">
                    <label>Face Status</label>
                    <p>{selectedStudent.face_status || "pending"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="history-section-premium animate-slide-up">
              <div className="section-header">
                <h3>
                  <MdHistory /> Attendance History
                </h3>
                <div className="history-count">{history.length} Records Found</div>
              </div>

              {loading ? (
                <div className="loading-spinner-container">
                  <div className="spinner"></div>
                  <p>Fetching attendance history...</p>
                </div>
              ) : history.length > 0 ? (
                <div className="table-container">
                  <table className="presence-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Scan Details</th>
                        <th>Camera Source</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((log, i) => (
                        <tr
                          key={i}
                          className={`status-row ${log.time_out ? "complete" : "partial"}`}
                        >
                          <td>
                            <div className="date-display">
                              <span className="day">
                                {new Date(log.date).toLocaleDateString("en-US", {
                                  weekday: "short",
                                })}
                              </span>
                              <span className="full-date">{log.date}</span>
                            </div>
                          </td>

                          <td>
                            <div className="time-display-group">
                              <div className="time-block in">
                                <label>IN</label>
                                <span>{log.time_in || "--:--"}</span>
                              </div>
                              <div className="time-block out">
                                <label>OUT</label>
                                <span>{log.time_out || "--:--"}</span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="source-info">
                              <span className="source-label">{log.camera_source}</span>
                            </div>
                          </td>

                          <td>
                            <span
                              className={`status-badge-premium ${
                                log.time_out ? "timed-out" : "inside"
                              }`}
                            >
                              {log.time_out ? "Completed Scan" : "Entry Recorded"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="glass-panel text-center py-20 opacity-50">
                  <MdHistory size={48} className="mb-4" />
                  <p>No attendance records exist for this student yet.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state-container glass-panel">
            <div className="empty-icon">
              <MdPerson size={80} />
            </div>
            <h2>Student Profile Viewer</h2>
            <p>
              Select a student from the directory on the left to view their complete
              academic and attendance profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentProfile;