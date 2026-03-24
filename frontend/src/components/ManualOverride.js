import React, { useState, useEffect } from "react";
import { getStudents, manualOverride } from "../services/api";
import { MdEditNote, MdSave, MdPerson, MdCalendarToday, MdAccessTime, MdCheckCircle, MdError } from "react-icons/md";

function ManualOverride() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    student_id: "",
    date: new Date().toISOString().split('T')[0],
    time_in: "",
    time_out: ""
  });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await getStudents();
        setStudents(res.data);
      } catch (err) {
        console.error("Failed to load students", err);
      }
    };
    fetchStudents();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    // Simple validation: time format HH:MM:SS
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (form.time_in && !timeRegex.test(form.time_in)) {
      setMsg({ type: "error", text: "Time In must be in HH:MM:SS format" });
      return;
    }
    if (form.time_out && !timeRegex.test(form.time_out)) {
      setMsg({ type: "error", text: "Time Out must be in HH:MM:SS format" });
      return;
    }

    setLoading(true);
    try {
      await manualOverride(form);
      setMsg({ type: "success", text: "Record updated successfully!" });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.detail || "Failed to update record" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="override-container animate-fade-in">
      <div className="page-header">
        <h1><MdEditNote /> Manual Attendance Override</h1>
        <p>Admin tool to manually correct or add attendance logs.</p>
      </div>

      <div className="override-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><MdPerson /> Student</label>
            <select name="student_id" value={form.student_id} onChange={handleChange} required>
              <option value="">Select a student...</option>
              {students.map(s => (
                <option key={s.StudentID} value={s.StudentID}>
                  {s.FullName} ({s.StudentID})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><MdCalendarToday /> Date</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><MdAccessTime /> Time In (HH:MM:SS)</label>
              <input 
                name="time_in" 
                placeholder="08:00:00" 
                value={form.time_in} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label><MdAccessTime /> Time Out (HH:MM:SS)</label>
              <input 
                name="time_out" 
                placeholder="17:00:00" 
                value={form.time_out} 
                onChange={handleChange} 
              />
            </div>
          </div>

          {msg.text && (
            <div className={`message-box ${msg.type}`}>
              {msg.type === "success" ? <MdCheckCircle /> : <MdError />}
              <span>{msg.text}</span>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : <><MdSave /> Save Changes</>}
          </button>
        </form>
      </div>

      <div className="override-guidelines">
        <h3><MdInfo /> Guidelines</h3>
        <ul>
          <li>Use 24-hour format (e.g., 14:30:00 for 2:30 PM).</li>
          <li>Leave Time In or Time Out empty if not applicable.</li>
          <li>Manual changes are logged with "Manual Override" as the source.</li>
        </ul>
      </div>
    </div>
  );
}

const MdInfo = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path></svg>;

export default ManualOverride;
