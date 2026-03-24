import React, { useState, useEffect } from "react";
import { getStudents, registerStudent, deleteStudent } from "../services/api";
import { MdPersonAdd, MdDelete, MdCheckCircle, MdCancel } from "react-icons/md";

function StudentRegistration() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    StudentID: "",
    FullName: "",
    Course: "",
    Year: "",
    privacy_consent: false,
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await getStudents();
      setStudents(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let newForm = {
      ...form,
      [name]: type === "checkbox" ? checked : value,
    };

    // If Year (Education Level) changed, check if it's Basic Ed
    if (name === "Year") {
      const basicEdLevels = [
        "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", 
        "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
      ];
      
      if (basicEdLevels.includes(value)) {
        newForm.Course = ""; // Auto-clear Course for Basic Ed
      }
    }

    setForm(newForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.privacy_consent) {
      setError("You must agree to the data privacy policy.");
      return;
    }

    try {
      await registerStudent({
        StudentID: form.StudentID,
        FullName: form.FullName,
        Course: form.Course,
        Year: form.Year,
        privacy_consent: form.privacy_consent,
      });

      setMessage("Student registered successfully");
      setForm({ StudentID: "", FullName: "", Course: "", Year: "" });
      loadStudents();
    } catch (err) {
      console.error(err);
      setError("Registration failed");
    }
  };

  const removeStudent = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await deleteStudent(studentToDelete.StudentID);
      loadStudents();
      setShowDeleteModal(false);
      setStudentToDelete(null);
      setMessage("Student record removed safely.");
    } catch (err) {
      setError("Failed to delete student.");
      setShowDeleteModal(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Student Registration</h1>
        <p>Enroll new students into the system to begin face capture</p>
      </div>

      {message && (
        <div className="alert alert-success">
          <MdCheckCircle size={20} /> {message}
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <MdCancel size={20} /> {error}
        </div>
      )}

      <div className="panel-grid two-cols">
        {/* Form Panel */}
        <div className="glass-panel h-fit">
          <h2 className="mb-6">Register Student</h2>
          <form className="standard-form w-full" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Student ID</label>
              <input
                name="StudentID"
                placeholder="e.g. 2023-0001"
                value={form.StudentID}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label>Full Name</label>
              <input
                name="FullName"
                placeholder="e.g. John Doe"
                value={form.FullName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Course {
                [
                  "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", 
                  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
                ].includes(form.Year) && <span style={{ color: "var(--text-secondary)", fontSize: "11px", marginLeft: "10px" }}>(Not Applicable for Basic Ed)</span>
              }</label>
              <input
                name="Course"
                placeholder="e.g. BSCS, BSIT"
                value={form.Course}
                onChange={handleChange}
                disabled={[
                  "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", 
                  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
                ].includes(form.Year)}
              />
            </div>

            <div className="form-group">
              <label>Education Level</label>
              <select name="Year" value={form.Year} onChange={handleChange}>
                <option value="">Select Level</option>
                <optgroup label="Basic Education">
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
                </optgroup>
                <optgroup label="Higher Education">
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </optgroup>
              </select>
            </div>

            <div className="form-group checkbox-group" style={{ 
              background: "rgba(0, 83, 122, 0.05)", 
              padding: "16px", 
              borderRadius: "12px", 
              marginTop: "20px",
              border: "1px solid rgba(0, 83, 122, 0.1)"
            }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  name="privacy_consent"
                  id="privacy_consent"
                  checked={form.privacy_consent}
                  onChange={handleChange}
                  style={{ width: "18px", height: "18px", marginTop: "2px", cursor: "pointer" }}
                />
                <label htmlFor="privacy_consent" style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.5", cursor: "pointer" }}>
                  <strong>Data Privacy Disclosure:</strong> I hereby consent to the collection and secure processing of my biometric facial data by BioTrack for student attendance and school identification purposes, in strict compliance with the <strong>Data Privacy Act</strong>.
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary mt-4">
              <MdPersonAdd size={20} /> Register Student
            </button>
          </form>
        </div>

        {/* List Panel */}
        <div className="glass-panel h-fit">
          <h2 className="mb-6">Enrolled Students ({students.length})</h2>
          
          {students.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No students found.</p>
          ) : (
            <ul className="list-view" style={{ maxHeight: "500px", overflowY: "auto", paddingRight: "4px" }}>
              {students.map((s) => (
                <li key={s.StudentID} className="list-item">
                  <div className="list-item-content">
                    <div className="avatar">
                      {s.FullName.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ color: "var(--text-primary)", fontWeight: 600 }}>{s.FullName}</h4>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {s.StudentID} • {s.Course} {s.Year}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeStudent(s)}
                    className="btn btn-outline"
                    style={{ padding: "8px 12px", color: "#f87171", borderColor: "rgba(239, 68, 68, 0.3)" }}
                  >
                    <MdDelete size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <DeleteConfirmationModal 
          student={studentToDelete}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

// Internal Modal Component for Deletion Confirmation
function DeleteConfirmationModal({ student, onConfirm, onCancel }) {
  if (!student) return null;
  
  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(11, 30, 51, 0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000, padding: "20px", backdropFilter: "blur(4px)"
    }}>
      <div className="glass-panel" style={{ 
        maxWidth: "450px", width: "100%", padding: "32px", 
        background: "white", color: "#1e293b",
        textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
      }}>
        <div style={{ 
          width: "64px", height: "64px", borderRadius: "50%", 
          background: "rgba(239, 68, 68, 0.1)", color: "#ef4444",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px"
        }}>
          <MdDelete size={32} />
        </div>
        <h2 style={{ marginBottom: "16px", color: "var(--primary-dark)" }}>Remove Student?</h2>
        <p style={{ color: "#64748b", marginBottom: "24px", lineHeight: "1.6" }}>
          Are you sure you want to remove <strong>{student.FullName}</strong> ({student.StudentID})? 
          This action cannot be undone and will remove all associated biometric data.
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" style={{ flex: 1, background: "#ef4444", border: "none" }} onClick={onConfirm}>
            Yes, Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentRegistration;