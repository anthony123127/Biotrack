import axios from "axios";

const getBaseURL = () => {
  const { hostname } = window.location;
  // If accessing via IP or other hostname, use that for the API too
  const API_BASE_URL = "http://localhost:8000/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Add role header for backend RBAC
api.interceptors.request.use((config) => {
  const role = localStorage.getItem("userRole");

  if (role) {
    config.headers["user-role"] = role;
  }

  return config;
});

// Students
export const getStudents = () => api.get("/students/");
export const registerStudent = (data) => api.post("/students/", data);
export const deleteStudent = (studentId) => api.delete(`/students/${studentId}`);
export const uploadFace = (studentId, formData, angle = "front") =>
  api.post(`/students/${studentId}/face`, formData, { params: { angle } });

export const getPendingFaces = () => api.get("/students/pending-faces");
export const approveFace = (studentId) => api.post(`/students/${studentId}/approve-face`);
export const rejectFace = (studentId) => api.post(`/students/${studentId}/reject-face`);

// Recognition
export const recognizeFace = (formData, camera_source = "Camera 1", action = "Entry") => {
  if (camera_source) formData.append("camera_source", camera_source);
  if (action) formData.append("action", action);
  return api.post("/recognition/recognize", formData);
};

// Attendance
export const getAttendanceLogs = (params) => api.get("/attendance/", { params });
export const getDailyAttendance = (date) =>
  api.get("/attendance/daily", {
    params: { date },
  });

export const getPresenceStatus = () => api.get("/attendance/presence");
export const manualOverride = (data) => api.post("/attendance/override", data);

// Auth
export const login = (credentials) => api.post("/auth/login", credentials);

// Reports
export const getAttendanceStats = () => api.get("/reports/stats");

export const exportAttendance = (params) =>
  api.get("/reports/export", {
    params,
    responseType: "blob",
  });

export const searchReports = (params) => api.get("/reports/search", { params });

export const getDailySummaries = (days = 30) =>
  api.get("/reports/summaries/daily", {
    params: { days },
  });

export const getMonthlySummaries = () => api.get("/reports/summaries/monthly");

export const getStudentHistoryReport = (studentId) =>
  api.get(`/reports/summaries/student/${studentId}`);

export default api;