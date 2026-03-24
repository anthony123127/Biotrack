import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdLock, MdPerson, MdLogin, MdError } from "react-icons/md";
import { login as loginApi } from "../services/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await loginApi({ username, password });

      const user = res.data.user;
      const role = user.role;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userRole", role);
      localStorage.setItem("userName", user.username);

      onLogin(role);

      if (role === "Registrar") {
        navigate("/students");
      } else if (role === "Security Guard") {
        navigate("/monitoring");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div
      className="login-page"
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-color)",
        backgroundImage: "var(--gradient-bg)",
      }}
    >
      <div className="glass-panel" style={{ width: "100%", maxWidth: "400px", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <img 
            src="/logo.png" 
            alt="BioTrack Logo" 
            style={{ width: "100px", height: "auto", marginBottom: "16px" }} 
          />
          <h1 className="gradient-text" style={{ fontSize: "32px", marginBottom: "8px" }}>
            BioTrack
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Lyceum of San Pedro
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "24px" }}>
            <MdError size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="standard-form w-full">
          <div className="form-group">
            <label style={{ color: "var(--text-primary)" }}>Username</label>
            <div style={{ position: "relative" }}>
              <MdPerson
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                }}
              />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={{ paddingLeft: "40px" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ color: "var(--text-primary)" }}>Password</label>
            <div style={{ position: "relative" }}>
              <MdLock
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                }}
              />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ paddingLeft: "40px" }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary mt-6 w-full py-4">
            <MdLogin size={20} /> Sign In
          </button>
        </form>

        <div
          style={{
            marginTop: "32px",
            textAlign: "center",
            fontSize: "12px",
            color: "var(--text-secondary)",
          }}
        >
          BioTrack Automated Attendance System v1.0.0
        </div>
      </div>
    </div>
  );
}