import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentRegistration from './components/StudentRegistration';
import FaceCapture from './components/FaceCapture';
import MonitoringPanel from './components/MonitoringPanel';
import AttendanceLogs from './components/AttendanceLogs';
import Reports from './components/Reports';
import Login from './components/Login';
import PresenceBoard from "./components/PresenceBoard";
import StudentProfile from "./components/StudentProfile";
import ManualOverride from "./components/ManualOverride";
import StudentSelfRegistration from "./components/StudentSelfRegistration";
import { registerStudent, login, getStudents } from "./services/api";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '');
  const location = useLocation();

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
  };

  // RBAC Helper: Define allowed routes per role
  const isAllowed = (path) => {
    if (userRole === 'Admin') return true;
    
    const permissions = {
      'Registrar': ['/', '/students', '/face-capture', '/student-profile'],
      'Security Guard': ['/', '/monitoring', '/attendance', '/reports', '/presence'],
      'Admin': ['/', '/students', '/face-capture', '/student-profile', '/monitoring', '/attendance', '/reports', '/presence', '/override'],
    };

    const allowedPaths = permissions[userRole] || ['/'];
    return allowedPaths.includes(path);
  };

  if (!isAuthenticated && location.pathname !== '/login' && location.pathname !== '/register') {
    return <Navigate to="/login" replace />;
  }

  // Component to protect routes
  const ProtectedRoute = ({ element, path }) => {
    if (!isAllowed(path)) {
      return <Navigate to="/" replace />;
    }
    return element;
  };

  return (
    <div className="app-container">
      {isAuthenticated && <Sidebar onLogout={handleLogout} userRole={userRole} />}
      <main className={isAuthenticated ? "main-content" : ""}>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
          } />
          
          <Route path="/" element={<Dashboard />} />
          
          <Route path="/students" element={
            <ProtectedRoute path="/students" element={<StudentRegistration />} />
          } />
          
          <Route path="/face-capture" element={
            <ProtectedRoute path="/face-capture" element={<FaceCapture />} />
          } />
          
          <Route path="/monitoring" element={
            <ProtectedRoute path="/monitoring" element={<MonitoringPanel />} />
          } />
          
          <Route path="/attendance" element={
            <ProtectedRoute path="/attendance" element={<AttendanceLogs />} />
          } />

          <Route path="/presence" element={
            <ProtectedRoute path="/presence" element={<PresenceBoard />} />
          } />

          <Route path="/student-profile" element={
            <ProtectedRoute path="/student-profile" element={<StudentProfile />} />
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute path="/reports" element={<Reports />} />
          } />

          <Route path="/override" element={
            <ProtectedRoute path="/override" element={<ManualOverride />} />
          } />

          <Route path="/register" element={<StudentSelfRegistration />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
