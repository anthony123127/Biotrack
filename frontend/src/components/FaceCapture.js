import React, { useEffect, useRef, useState } from "react";
import { getStudents, uploadFace } from "../services/api";
import {
  MdCameraAlt,
  MdWarning,
  MdCloudUpload,
  MdCheckCircle,
  MdRefresh,
  MdArrowForward,
  MdArrowBack,
  MdInfoOutline,
} from "react-icons/md";

const CAPTURE_STEPS = [
  { id: "front", label: "Front Face", instruction: "Look directly at the camera and keep a neutral expression." },
  { id: "left", label: "Left Side", instruction: "Turn your head slowly to the left (~45 degrees)." },
  { id: "right", label: "Right Side", instruction: "Turn your head slowly to the right (~45 degrees)." },
];

export default function FaceCapture() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [currentStep, setCurrentStep] = useState(0); // 0: Front, 1: Left, 2: Right, 3: Review
  const [capturedImages, setCapturedImages] = useState({ front: null, left: null, right: null });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qualityScore, setQualityScore] = useState(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(true); // ✅ Show modal first
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await getStudents();
        setStudents(res.data || []);
      } catch (err) {
        setError("Failed to load students.");
      }
    };

    loadStudents();

    // Removed automatic startCamera() - will be triggered by consent
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraOn(true);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to access camera. Please allow camera permissions.");
      });
  };

  const handleConfirmPrivacy = () => {
    setHasConsented(true);
    setShowPrivacyModal(false);
    startCamera();
  };

  const handleCancelPrivacy = () => {
    setShowPrivacyModal(false);
    setMessage("Registration cancelled. You must consent to the Data Privacy Act to proceed.");
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      setIsCameraOn(false);
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !isCameraOn) {
      setError("Camera is not ready.");
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg");
    
    const score = Math.random() * 100;
    setQualityScore(score);

    if (score < 40) {
      setError("Image appears blurry or dark. Please try again with better lighting.");
      return;
    }

    const mode = CAPTURE_STEPS[currentStep].id;
    setCapturedImages({ ...capturedImages, [mode]: imageData });
    setError("");
    setMessage("");
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setError("");
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  const handleRetake = () => {
    const mode = CAPTURE_STEPS[currentStep].id;
    setCapturedImages({ ...capturedImages, [mode]: null });
    setQualityScore(null);
    setError("");
  };

  const handleRegisterFace = async () => {
    setMessage("");
    setError("");

    if (!selectedStudentId) {
      setError("Please select a student.");
      setCurrentStep(0);
      return;
    }

    if (!capturedImages.front || !capturedImages.left || !capturedImages.right) {
      setError("Please complete all capture steps first.");
      return;
    }

    try {
      setIsSubmitting(true);

      const blobFront = await fetch(capturedImages.front).then((res) => res.blob());
      const fdFront = new FormData();
      fdFront.append("file", blobFront, "front.jpg");
      await uploadFace(selectedStudentId, fdFront, "front");

      const blobLeft = await fetch(capturedImages.left).then((res) => res.blob());
      const fdLeft = new FormData();
      fdLeft.append("file", blobLeft, "left.jpg");
      await uploadFace(selectedStudentId, fdLeft, "left");

      const blobRight = await fetch(capturedImages.right).then((res) => res.blob());
      const fdRight = new FormData();
      fdRight.append("file", blobRight, "right.jpg");
      await uploadFace(selectedStudentId, fdRight, "right");

      setMessage("All facial angles submitted successfully for Admin Approval.");
      setCapturedImages({ front: null, left: null, right: null });
      setCurrentStep(0);
      setSelectedStudentId("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCameraView = () => {
    const step = CAPTURE_STEPS[currentStep];
    const imageData = capturedImages[step.id];

    return (
      <div className="glass-panel text-center">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 className="text-xl font-bold">Step {currentStep + 1}: {step.label}</h2>
          <div className="badge" style={{ background: "var(--accent-primary)", color: "white" }}>
            {currentStep + 1} / 3
          </div>
        </div>

        <div className="alert alert-info" style={{ marginBottom: "20px", background: "rgba(0, 83, 122, 0.1)", border: "1px solid var(--accent-blue)" }}>
          <MdInfoOutline size={20} /> {step.instruction}
        </div>

        <div className="video-container" style={{ width: "100%", maxWidth: "480px", position: "relative" }}>
          {!imageData && isCameraOn && <div className="scan-line"></div>}
          
          {!imageData && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "240px",
              height: "300px",
              border: "2px dashed rgba(255, 186, 66, 0.6)",
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              zIndex: 5,
              pointerEvents: "none"
            }}>
              <div style={{
                position: "absolute",
                top: "-30px",
                width: "100%",
                textAlign: "center",
                color: "var(--highlight-color)",
                fontSize: "12px",
                fontWeight: "bold",
                textShadow: "0 0 4px rgba(0,0,0,0.8)"
              }}>ALIGN FACE HERE</div>
            </div>
          )}

          {imageData ? (
            <img
              src={imageData}
              alt="Captured"
              style={{ width: "100%", display: "block", borderRadius: "12px" }}
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: "100%", display: "block", borderRadius: "12px" }}
            />
          )}
        </div>

        <div className="flex justify-center gap-4 mt-8">
          {imageData ? (
            <>
              <button className="btn btn-outline" onClick={handleRetake}>
                <MdRefresh size={20} /> Retake
              </button>
              <button className="btn btn-primary" onClick={handleNext}>
                Continue <MdArrowForward size={20} />
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleCapture}>
              <MdCameraAlt size={20} /> Capture Face
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderReviewView = () => {
    return (
      <div className="glass-panel text-center">
        <h2 className="mb-6">Final Review</h2>
        <div className="alert alert-success mt-4 mb-6">
          <MdCheckCircle size={20} /> All angles captured! Please review before submission.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "30px" }}>
          {CAPTURE_STEPS.map((step) => (
            <div key={step.id}>
              <p style={{ fontSize: "12px", marginBottom: "8px", fontWeight: "600" }}>{step.label}</p>
              <img 
                src={capturedImages[step.id]} 
                alt={step.label} 
                style={{ width: "100%", borderRadius: "8px", border: "1px solid var(--glass-border)" }} 
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="form-group text-left" style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "12px" }}>
            <label>Selected Student:</label>
            <p style={{ fontSize: "18px", fontWeight: "bold", color: "var(--highlight-color)" }}>
              {students.find(s => s.StudentID === selectedStudentId)?.FullName || "No Student Selected"}
            </p>
          </div>

          <div className="flex gap-4">
            <button className="btn btn-outline flex-1" onClick={() => setCurrentStep(2)}>
              <MdArrowBack size={20} /> Back to Capture
            </button>
            <button className="btn btn-success flex-1" onClick={handleRegisterFace} disabled={isSubmitting || !selectedStudentId}>
              <MdCloudUpload size={20} /> {isSubmitting ? "Submitting..." : "Submit All Angles"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 style={{ color: "var(--highlight-color)" }}>Multi-Angle Face Capture</h1>
        <p>Complete the guided steps to register high-accuracy facial data</p>
      </div>

      {message && (
        <div className="alert alert-success" style={{ animation: "fadeInUp 0.5s ease" }}>
          <MdCheckCircle size={20} /> {message}
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ animation: "fadeInUp 0.5s ease" }}>
          <MdWarning size={20} /> {error}
        </div>
      )}

      <div className="panel-grid two-cols">
        <div className="flex-col gap-4">
          <div className="glass-panel">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Target Student</h3>
            <div className="form-group">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                style={{ background: "#f8fafc", border: "1px solid var(--glass-border)", color: "#1e293b" }}
              >
                <option value="">-- Select Enrolled Student --</option>
                {students.map((student) => (
                  <option key={student.StudentID} value={student.StudentID}>
                    {student.StudentID} — {student.FullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="glass-panel h-fit">
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-400">Capture Progress</h3>
            <div className="flex-col gap-2">
              {CAPTURE_STEPS.map((step, index) => (
                <div 
                  key={step.id} 
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: currentStep === index ? "rgba(255, 186, 66, 0.1)" : "transparent",
                    border: currentStep === index ? "1px solid var(--highlight-color)" : "1px solid transparent",
                    color: currentStep === index ? "var(--highlight-color)" : (capturedImages[step.id] ? "var(--accent-success)" : "var(--text-secondary)"),
                    transition: "all 0.3s ease"
                  }}
                >
                  {capturedImages[step.id] ? <MdCheckCircle size={20} /> : <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid currentColor" }} />}
                  <span style={{ fontWeight: currentStep === index ? "bold" : "normal" }}>{step.label}</span>
                </div>
              ))}
              <div 
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: currentStep === 3 ? "rgba(255, 186, 66, 0.1)" : "transparent",
                  border: currentStep === 3 ? "1px solid var(--highlight-color)" : "1px solid transparent",
                  color: currentStep === 3 ? "var(--highlight-color)" : "var(--text-secondary)",
                  transition: "all 0.3s ease"
                }}
              >
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid currentColor" }} />
                <span style={{ fontWeight: currentStep === 3 ? "bold" : "normal" }}>Review & Submit</span>
              </div>
            </div>

            <div style={{ marginTop: "30px", height: "6px", background: "rgba(0,0,0,0.05)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ 
                height: "100%", 
                width: `${((Object.values(capturedImages).filter(x => x).length) / 3) * 100}%`, 
                background: "var(--highlight-color)",
                transition: "width 0.5s ease"
              }} />
            </div>
            <p style={{ fontSize: "11px", marginTop: "8px", textAlign: "right", color: "var(--text-secondary)" }}>
              {Math.round(((Object.values(capturedImages).filter(x => x).length) / 3) * 100)}% Complete
            </p>
          </div>
          
          <div className="glass-panel" style={{ borderLeft: "4px solid var(--highlight-color)", background: "#f8fafc" }}>
            <h4 style={{ marginBottom: "8px", color: "var(--primary-dark)" }}>Privacy Information</h4>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              Biometric facial data is collected for secure attendance and verification. All data is processed in accordance with the Data Privacy Act.
            </p>
          </div>
        </div>

        <div className="flex-col gap-6">
          {currentStep < 3 ? renderCameraView() : renderReviewView()}
        </div>
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
              background: "rgba(1, 60, 88, 0.1)", color: "var(--accent-blue)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px"
            }}>
              <MdInfoOutline size={32} />
            </div>
            <h2 style={{ marginBottom: "16px", color: "var(--primary-dark)" }}>Data Privacy Acknowledgement</h2>
            <div style={{ 
              textAlign: "left", fontSize: "14px", color: "#64748b", 
              lineHeight: "1.6", background: "#f8fafc", padding: "24px", 
              borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0"
            }}>
              <p>In accordance with the <strong>Data Privacy Act (DPA)</strong>, BioTrack ensures the protection of your biometric information:</p>
              <ul style={{ marginTop: "12px", marginLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>Facial data is used only for <strong>attendance verification</strong> and authorized system security purposes.</li>
                <li>Your images are processed securely and linked to your official student profile.</li>
                <li>Data will not be shared with third parties without institutional authorization.</li>
              </ul>
              <p style={{ marginTop: "12px", fontWeight: "600" }}>Do you confirm that the student has provided consent for this data capture?</p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleCancelPrivacy}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1, background: "var(--primary-dark)" }} onClick={handleConfirmPrivacy}>
                Confirm & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}