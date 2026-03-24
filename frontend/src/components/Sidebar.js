import React from "react";
import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdPersonAdd,
  MdCameraAlt,
  MdMonitor,
  MdChecklist,
  MdAssessment,
  MdLogout,
  MdPeopleOutline,
  MdHistoryEdu,
  MdEditNote,
} from "react-icons/md";

const navItems = [
  {
    to: "/dashboard",
    icon: <MdDashboard />,
    label: "Dashboard",
    roles: ["Admin", "Registrar", "Security Guard"],
  },
  {
    to: "/students",
    icon: <MdPersonAdd />,
    label: "Student Registration",
    roles: ["Admin", "Registrar"],
  },
  {
    to: "/face-capture",
    icon: <MdCameraAlt />,
    label: "Face Capture",
    roles: ["Admin", "Registrar"],
  },
  {
    to: "/student-profile",
    icon: <MdHistoryEdu />,
    label: "Student Profiles",
    roles: ["Admin", "Registrar"],
  },
  {
    to: "/monitoring",
    icon: <MdMonitor />,
    label: "Live Monitoring",
    roles: ["Admin", "Security Guard"],
  },
  {
    to: "/presence",
    icon: <MdPeopleOutline />,
    label: "Presence Board",
    roles: ["Admin", "Security Guard"],
  },
  {
    to: "/attendance",
    icon: <MdChecklist />,
    label: "Attendance Logs",
    roles: ["Admin", "Security Guard"],
  },
  {
    to: "/reports",
    icon: <MdAssessment />,
    label: "Reports",
    roles: ["Admin", "Security Guard"],
  },
  {
    to: "/override",
    icon: <MdEditNote />,
    label: "Manual Override",
    roles: ["Admin"],
  },
];

function Sidebar({ onLogout, userRole }) {
  const role = userRole || localStorage.getItem("userRole") || "Security Guard";
  const userName = localStorage.getItem("userName") || "User";

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");

    if (onLogout) {
      onLogout();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ 
          background: "white", 
          padding: "5px", 
          borderRadius: "50%", 
          marginBottom: "20px", 
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "110px",
          height: "110px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
          margin: "0 auto 20px",
          overflow: "hidden"
        }}>
          <img 
            src="/logo.png" 
            alt="BioTrack Logo" 
            style={{ width: "100%", height: "100%", objectFit: "contain" }} 
          />
        </div>
        <h1 style={{ 
          fontSize: "20px", 
          fontWeight: "800", 
          color: "var(--sidebar-text)", 
          lineHeight: "1.2",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          Lyceum of <br /> San Pedro
        </h1>
        <p style={{ 
          fontSize: "11px", 
          color: "var(--highlight-color)", 
          marginTop: "6px", 
          fontWeight: "600",
          letterSpacing: "1px",
          opacity: 0.9
        }}>
          BIOTRACK SYSTEM
        </p>

        <div
          style={{
            marginTop: "10px",
            fontSize: "11px",
            background: "rgba(255,255,255,0.1)",
            padding: "4px 8px",
            borderRadius: "4px",
            display: "inline-block",
            color: "var(--sidebar-text-secondary)"
          }}
        >
          Role: <strong style={{ color: "#FFFFFF" }}>{role}</strong>
        </div>
      </div>

      <nav className="sidebar-nav">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div
        className="sidebar-footer"
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <button
          onClick={handleLogout}
          className="btn btn-outline"
          style={{
            width: "100%",
            justifyContent: "center",
            borderColor: "rgba(239, 68, 68, 0.3)",
            color: "#f87171",
          }}
        >
          <MdLogout size={18} /> Sign Out
        </button>

        <div style={{ textAlign: "center", opacity: 0.5, fontSize: "10px" }}>
          LSP BioTrack &mdash; {userName}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;