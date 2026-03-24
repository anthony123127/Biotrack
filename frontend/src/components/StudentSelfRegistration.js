import React, { useState, useEffect, useRef } from "react";
import { registerStudent, uploadFace } from "../services/api";
import {
  MdPerson,
  MdSchool,
  MdLayers,
  MdCheckCircle,
  MdWarning,
  MdCameraAlt,
  MdInfoOutline,
  MdSecurity,
} from "react-icons/md";

const CAPTURE_STEPS = [
  { id: "front", label: "Front Face", instruction: "Look directly at the camera." },
  { id: "left", label: "Left Side", instruction: "Turn your head to the left." },
  { id: "right", label: "Right Side", instruction: "Turn your head to the right." },
];

export default function StudentSelfRegistration() {
  const [formData, setFormData] = useState({
    StudentID: "",
    FullName: "",
    EducationLevel: "", // "Basic" or "Higher"
    Course: "",
    Year: "",
    privacy_consent: false,
  });

  const [currentStep, setCurrentStep] = useState(0); // 0: Form, 1-3: Capture, 4: Finish
  const [capturedImages, setCapturedImages] = useState({ front: null, left: null, right: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tempStudentId, setTempStudentId] = useState("");
  const [showPrivacyModal, setShowPrivacyModal] = useState(false); // ✅ Added missing state

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      }
    } catch (err) {
      setError("Please allow camera access to complete registration.");
    }
  };

  const handleConfirmPrivacy = () => {
    setShowPrivacyModal(false);
    setCurrentStep(1);
    startCamera();
  };

  const handleCancelPrivacy = () => {
    setShowPrivacyModal(false);
    setError("You must consent to the Data Privacy Act to proceed.");
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraOn(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newFormData = { ...formData, [name]: type === "checkbox" ? checked : value };
    
    // Auto-fill Course for Basic Education
    if (name === "EducationLevel") {
      newFormData.Year = ""; // Reset Year/Grade on switch
      if (value === "Basic") {
        newFormData.Course = "Basic Education";
      } else {
        newFormData.Course = "";
      }
    }
    
    setFormData(newFormData);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!tempStudentId && !formData.StudentID) {
      setError("Please provide a Student ID.");
      return;
    }
    setError("");
    setTempStudentId(formData.StudentID);
    setShowPrivacyModal(true); // ✅ Trigger modal instead of starting immediately
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, 640, 480);
    const imageData = canvas.toDataURL("image/jpeg");

    const angle = CAPTURE_STEPS[currentStep - 1].id;
    setCapturedImages({ ...capturedImages, [angle]: imageData });
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      finalizeRegistration();
    }
  };

  const finalizeRegistration = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      // 1. Register basic info
      await registerStudent({
        ...formData,
        consent_timestamp: new Date().toISOString(),
      });

      // 2. Upload 3 photos
      const angles = ["front", "left", "right"];
      for (const angle of angles) {
        const blob = await fetch(capturedImages[angle]).then(r => r.blob());
        const fd = new FormData();
        fd.append("file", blob, `${angle}.jpg`);
        await uploadFace(formData.StudentID, fd, angle);
      }

      setCurrentStep(4);
      setMessage("Registration Success! Your profile is pending Admin Approval.");
      stopCamera();
    } catch (err) {
      setError(err?.response?.data?.detail || "Registration failed. Please contact registrar.");
      setIsSubmitting(false);
    }
  };

  if (currentStep === 4) {
    return (
      <div className="mobile-reg-container" style={{ padding: "40px 20px", textAlign: "center" }}>
        <div className="glass-panel" style={{ padding: "40px" }}>
          <MdCheckCircle size={80} color="var(--accent-success)" />
          <h1 style={{ marginTop: "20px", color: "white" }}>Done!</h1>
          <p style={{ color: "var(--text-secondary)", margin: "20px 0" }}>{message}</p>
          <button className="btn btn-primary w-full" onClick={() => window.location.reload()}>Finish</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-reg-container" style={{ 
      minHeight: "100vh", 
      background: "var(--bg-color)",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <img src="/logo.png" alt="Logo" style={{ width: "80px", marginBottom: "15px" }} />
        <h1 style={{ fontSize: "24px", color: "var(--highlight-color)" }}>Student Portal</h1>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>E-Enrollment & Face ID Link</p>
      </div>

      <div className="glass-panel" style={{ width: "100%", maxWidth: "450px", padding: "24px" }}>
        {error && (
          <div className="alert alert-error mb-4">
            <MdWarning size={20} /> {error}
          </div>
        )}

        {currentStep === 0 && (
          <form onSubmit={handleFormSubmit}>
            <h2 className="mb-6 text-xl">Self-Registration</h2>
            <div className="form-group mb-4">
              <label><MdPerson /> Student ID</label>
              <input name="StudentID" required onChange={handleChange} placeholder="e.g. 2023-0001" />
            </div>
            <div className="form-group mb-4">
              <label><MdPerson /> Full Name</label>
              <input name="FullName" required onChange={handleChange} placeholder="Firstname Lastname" />
            </div>
            <div className="form-group mb-4">
              <label><MdLayers /> Education Level</label>
              <select name="EducationLevel" required value={formData.EducationLevel} onChange={handleChange}>
                <option value="">-- Select Level --</option>
                <option value="Basic">Basic Education (Elementary/HS)</option>
                <option value="Higher">Higher Education (College)</option>
              </select>
            </div>

            {formData.EducationLevel === "Higher" && (
              <div className="form-group mb-4">
                <label><MdSchool /> Course</label>
                <input 
                  name="Course" 
                  required 
                  value={formData.Course} 
                  onChange={handleChange} 
                  placeholder="e.g. BSCS, BSIT, BSBA"
                />
              </div>
            )}

            <div className="form-group mb-4">
              <label><MdLayers /> {formData.EducationLevel === "Basic" ? "Grade Level" : "Year Level"}</label>
              <select name="Year" required value={formData.Year} onChange={handleChange}>
                <option value="">-- Select {formData.EducationLevel === "Basic" ? "Grade" : "Year"} --</option>
                {formData.EducationLevel === "Basic" ? (
                  <>
                    <option value="Kindergarten">Kindergarten</option>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                      <option key={g} value={`Grade ${g}`}>Grade {g}</option>
                    ))}
                  </>
                ) : (
                  <>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </>
                )}
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginTop: "20px" }}>
              <button type="submit" className="btn btn-primary w-full">Sign Up & Link Face ID</button>
            </div>
          </form>
        )}

        {/* Privacy Confirmation Modal (Self-Registration) */}
        {showPrivacyModal && (
          <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(11, 30, 51, 0.9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: "20px"
          }}>
            <div className="glass-panel" style={{ 
              maxWidth: "400px", width: "100%", padding: "24px", 
              background: "white", color: "#1e293b",
              textAlign: "center"
            }}>
              <MdInfoOutline size={48} color="var(--highlight-color)" style={{ marginBottom: "16px" }} />
              <h2 className="mb-4">Privacy Disclosure</h2>
              <p style={{ fontSize: "14px", color: "#64748b", textAlign: "left", marginBottom: "20px", lineHeight: "1.5" }}>
                BioTrack collects facial biometric data for attendance and identification. 
                This data is used solely for school verification purposes and is protected under the 
                <strong> Data Privacy Act</strong>.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleCancelPrivacy}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConfirmPrivacy}>Confirm</button>
              </div>
            </div>
          </div>
        )}

        {currentStep > 0 && currentStep <= 3 && (
          <div className="text-center">
            <h2 className="mb-2">Capture {CAPTURE_STEPS[currentStep - 1].label}</h2>
            <p className="text-sm text-gray-400 mb-6">{CAPTURE_STEPS[currentStep - 1].instruction}</p>

            <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", border: "2px solid var(--accent-blue)" }}>
              {capturedImages[CAPTURE_STEPS[currentStep - 1].id] ? (
                <img src={capturedImages[CAPTURE_STEPS[currentStep - 1].id]} alt="Capture" style={{ width: "100%" }} />
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline style={{ width: "100%", background: "#000" }} />
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "200px",
                    height: "260px",
                    border: "2px dashed var(--highlight-color)",
                    borderRadius: "50%",
                    pointerEvents: "none"
                  }} />
                </>
              )}
            </div>

            <div className="mt-8 flex gap-4">
              {capturedImages[CAPTURE_STEPS[currentStep - 1].id] ? (
                <>
                  <button className="btn btn-outline flex-1" onClick={() => {
                    const angle = CAPTURE_STEPS[currentStep - 1].id;
                    setCapturedImages({ ...capturedImages, [angle]: null });
                  }}>Retake</button>
                  <button className="btn btn-primary flex-1" onClick={nextStep} disabled={isSubmitting}>
                    {currentStep === 3 ? (isSubmitting ? "Finalizing..." : "Finish") : "Next Angle"}
                  </button>
                </>
              ) : (
                <button className="btn btn-primary w-full" onClick={handleCapture}>
                  <MdCameraAlt /> Capture Photo
                </button>
              )}
            </div>
            
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ 
                  width: "12px", 
                  height: "12px", 
                  borderRadius: "50%", 
                  background: currentStep === i ? "var(--highlight-color)" : "rgba(255,255,255,0.1)" 
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: "auto", padding: "20px", textAlign: "center", opacity: 0.6 }}>
        <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          <MdSecurity size={12} /> Data Encrypted & Compliant with DPA Section 12
        </p>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Privacy Notification Modal */}
      {showPrivacyModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(11, 30, 51, 0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "20px", backdropFilter: "blur(4px)"
        }}>
          <div className="glass-panel" style={{ 
            maxWidth: "500px", width: "100%", padding: "32px", 
            background: "white", color: "#1e293b",
            textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
          }}>
            <div style={{ 
              width: "64px", height: "64px", borderRadius: "50%", 
              background: "rgba(255, 186, 66, 0.1)", color: "var(--highlight-color)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px"
            }}>
              <MdInfoOutline size={32} />
            </div>
            <h2 style={{ marginBottom: "16px", color: "var(--primary-dark)" }}>Privacy Acknowledgement</h2>
            <div style={{ 
              textAlign: "left", fontSize: "14px", color: "#64748b", 
              lineHeight: "1.6", background: "#f8fafc", padding: "20px", 
              borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0"
            }}>
              <p>In compliance with the <strong>Data Privacy Act</strong>, please be informed that BioTrack will collect and process your facial biometric data.</p>
              <ul style={{ marginTop: "10px", marginLeft: "20px" }}>
                <li>Facial data will be used solely for <strong>attendance, identity verification</strong>, and authorized system purposes.</li>
                <li>Data is securely encrypted and stored locally.</li>
                <li>Strict access controls are in place to prevent unauthorized use.</li>
              </ul>
              <p style={{ marginTop: "10px" }}>By clicking <strong>Confirm</strong>, you acknowledge these terms and consent to the capture process.</p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button className="btn btn-outline" style={{ flex: 1, color: "#64748b" }} onClick={handleCancelPrivacy}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1, background: "var(--primary-dark)" }} onClick={handleConfirmPrivacy}>
                Confirm & Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
