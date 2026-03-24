import React, { useEffect, useState } from "react";
import {
  getAttendanceStats,
  getDailyAttendance,
  getPendingFaces,
  approveFace,
  rejectFace,
} from "../services/api";
import {
  MdPeople,
  MdCheckCircle,
  MdCancel,
  MdLibraryBooks,
  MdPending,
} from "react-icons/md";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    totalRecords: 0,
  });

  const [todayLogs, setTodayLogs] = useState([]);
  const [pendingFaces, setPendingFaces] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const userRole = localStorage.getItem("userRole");

  const getImageUrl = (photoPath) => {
    if (!photoPath) return "";
    const normalizedPath = photoPath.replace(/\\/g, "/");
    if (normalizedPath.startsWith("uploads/")) {
      return `http://127.0.0.1:8000/${normalizedPath}`;
    }
    return `http://127.0.0.1:8000/uploads/faces/${normalizedPath.split("/").pop()}`;
  };

  const loadDashboard = async () => {
    try {
      const statsRes = await getAttendanceStats();
      setStats(statsRes.data);

      const today = new Date().toISOString().split("T")[0];
      const dailyRes = await getDailyAttendance(today);
      setTodayLogs(dailyRes.data || []);
    } catch (err) {
      setError("Failed to load dashboard.");
    }
  };

  const loadPendingFaces = async () => {
    if (userRole !== "Admin") return;

    try {
      setPendingLoading(true);
      const res = await getPendingFaces();
      setPendingFaces(res.data || []);
    } catch (err) {
      console.error("Failed to load pending faces", err);
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadPendingFaces();
  }, []);

  const handleApprove = async (studentId) => {
    try {
      setActionMessage("");
      setActionError("");
      await approveFace(studentId);
      setActionMessage(`Face approved for ${studentId}`);
      await loadPendingFaces();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to approve face.");
    }
  };

  const handleReject = async (studentId) => {
    try {
      setActionMessage("");
      setActionError("");
      await rejectFace(studentId);
      setActionMessage(`Face rejected for ${studentId}`);
      await loadPendingFaces();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to reject face.");
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "center", gap: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "24px", marginBottom: "32px" }}>
        <img src="/logo.png" alt="Logo" style={{ width: "80px", height: "auto" }} />
        <div>
          <h1 style={{ color: "var(--primary-dark)", fontSize: "32px" }}>Dashboard</h1>
          <p style={{ color: "var(--text-secondary)" }}>Lyceum of San Pedro — Attendance Overview</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <MdCancel size={20} />
          {error}
        </div>
      )}

      {/* Student Portal Banner */}
      <div className="glass-panel" style={{ 
        background: "linear-gradient(135deg, var(--primary-dark), var(--accent-blue))",
        color: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "24px 32px",
        borderRadius: "20px",
        border: "none",
        boxShadow: "0 10px 30px rgba(11, 30, 51, 0.2)",
        marginBottom: "32px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative background element */}
        <div style={{
          position: "absolute",
          top: "-50%",
          right: "-10%",
          width: "300px",
          height: "300px",
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: "50%",
          pointerEvents: "none"
        }} />

        <div style={{ zIndex: 1 }}>
          <h2 style={{ color: "white", marginBottom: "8px", fontSize: "20px" }}>Student Self-Registration Portal</h2>
          <p style={{ opacity: 0.9, fontSize: "14px" }}>
            Share this link with students for mobile Face ID registration:
            <br />
            <code style={{ 
              display: "inline-block",
              marginTop: "10px",
              background: "rgba(0,0,0,0.2)",
              padding: "4px 12px",
              borderRadius: "6px",
              color: "var(--highlight-color)",
              fontSize: "16px",
              letterSpacing: "0.5px"
            }}>
              {window.location.origin}/register
            </code>
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ 
            background: "var(--highlight-color)", 
            color: "var(--primary-dark)", 
            fontWeight: "bold",
            padding: "12px 24px",
            zIndex: 1
          }}
          onClick={() => window.open("/register", "_blank")}
        >
          Open Portal
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon blue">
            <MdPeople />
          </div>
          <div className="stat-info">
            <h3>{stats.totalStudents}</h3>
            <p>Total Enrolled</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon green">
            <MdCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{stats.presentToday}</h3>
            <p>Present Today</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon red">
            <MdCancel />
          </div>
          <div className="stat-info">
            <h3>{stats.absentToday}</h3>
            <p>Absent Today</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon purple">
            <MdLibraryBooks />
          </div>
          <div className="stat-info">
            <h3>{stats.totalRecords}</h3>
            <p>Total Records</p>
          </div>
        </div>
      </div>

      {userRole === "Admin" && (
        <div className="glass-panel" style={{ marginTop: "24px", marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-dark)" }}>
              <MdPending /> Pending Face Approvals
            </h2>
            <div className="history-count">{pendingFaces.length} Pending</div>
          </div>

          {actionMessage && (
            <div className="alert alert-success" style={{ marginBottom: "12px" }}>
              <MdCheckCircle size={20} /> {actionMessage}
            </div>
          )}

          {actionError && (
            <div className="alert alert-error" style={{ marginBottom: "12px" }}>
              <MdCancel size={20} /> {actionError}
            </div>
          )}

          {pendingLoading ? (
            <p>Loading pending face submissions...</p>
          ) : pendingFaces.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No pending face submissions.</p>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Student ID</th>
                    <th>Full Name</th>
                    <th>Year</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingFaces.map((student) => (
                    <tr key={student.student_id}>
                      <td>
                        {student.photo_path ? (
                          <img
                            src={getImageUrl(student.photo_path)}
                            alt={student.full_name}
                            style={{
                              width: "64px",
                              height: "64px",
                              objectFit: "cover",
                              borderRadius: "10px",
                              border: "1px solid rgba(255,255,255,0.15)",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "64px",
                              height: "64px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "10px",
                              background: "rgba(255,255,255,0.05)",
                              color: "var(--text-secondary)",
                              fontSize: "12px",
                            }}
                          >
                            No Image
                          </div>
                        )}
                      </td>
                      <td>{student.student_id}</td>
                      <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                        {student.full_name}
                      </td>
                      <td>{student.year}</td>
                      <td>{student.course || "N/A"}</td>
                      <td>
                        <span className="badge badge-warning">Pending</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            className="btn btn-success"
                            onClick={() => handleApprove(student.student_id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ borderColor: "#ef4444", color: "#ef4444" }}
                            onClick={() => handleReject(student.student_id)}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="glass-panel" style={{ borderTop: "4px solid var(--accent-blue)" }}>
        <h2 style={{ marginBottom: "20px", color: "var(--primary-dark)" }}>Today's Live Attendance</h2>

        {todayLogs.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>
            No attendance records logged for today.
          </p>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.student_id}</td>
                    <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                      {log.full_name}
                    </td>
                    <td>{log.timestamp}</td>
                    <td>
                      <span className="badge badge-present">Present</span>
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