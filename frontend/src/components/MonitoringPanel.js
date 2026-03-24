import React, { useEffect, useRef, useState } from "react";
import { recognizeFace } from "../services/api";
import { MdMonitor, MdStopCircle, MdVideoCameraFront, MdLogin, MdLogout, MdSettings } from "react-icons/md";

export default function MonitoringPanel() {
  const videoRefEntry = useRef(null);
  const videoRefExit = useRef(null);
  const canvasRef = useRef(null);
  
  const [devices, setDevices] = useState([]);
  const [entryDeviceId, setEntryDeviceId] = useState("");
  const [exitDeviceId, setExitDeviceId] = useState("");
  
  const [message, setMessage] = useState("");
  const [entries, setEntries] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatPHT = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Enumerate devices on mount
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(mediaDevices => {
        const videoDevices = mediaDevices.filter(({ kind }) => kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setEntryDeviceId(videoDevices[0].deviceId);
          if (videoDevices.length > 1) {
            setExitDeviceId(videoDevices[1].deviceId);
          } else {
            setExitDeviceId(videoDevices[0].deviceId);
          }
        }
      });
  }, []);

  // Set up Entry Camera
  useEffect(() => {
    if (!entryDeviceId) return;
    navigator.mediaDevices.getUserMedia({ video: { deviceId: entryDeviceId } })
      .then((stream) => {
        if (videoRefEntry.current) videoRefEntry.current.srcObject = stream;
      })
      .catch(() => setMessage("Failed to access Entry camera."));
  }, [entryDeviceId]);

  // Set up Exit Camera
  useEffect(() => {
    if (!exitDeviceId) return;
    navigator.mediaDevices.getUserMedia({ video: { deviceId: exitDeviceId } })
      .then((stream) => {
        if (videoRefExit.current) videoRefExit.current.srcObject = stream;
      })
      .catch(() => setMessage("Failed to access Exit camera."));
  }, [exitDeviceId]);

  // Dual Processing Loop
  useEffect(() => {
    if (!isRunning) return;

    const processFrame = async (video, sourceName, actionType) => {
      try {
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== 4) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg"));
        const formData = new FormData();
        formData.append("file", blob, "frame.jpg");

        const res = await recognizeFace(formData, sourceName, actionType);

        if (res.data.recognized_count > 0) {
          const match = res.data.matches.find(m => m.status === "Recognized & Logged");
          if (match) {
            setEntries((prev) => [
              {
                student_id: match.student_id,
                full_name: match.full_name,
                timestamp: new Date().toLocaleTimeString(),
                action: actionType,
                source: sourceName
              },
              ...prev.slice(0, 19),
            ]);
          }
        }
      } catch (err) {
        console.error(`Recognition failed for ${sourceName}:`, err);
      }
    };

    const interval = setInterval(() => {
      processFrame(videoRefEntry.current, "Camera 1 (Entry Gate)", "Entry");
      processFrame(videoRefExit.current, "Camera 2 (Exit Gate)", "Exit");
    }, 4000);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Dual-Gate Live Monitoring</h1>
          <div className="flex items-center gap-3">
             <p>Automated Entry & Exit tracking system</p>
             <span className="clock-badge">{formatPHT(currentTime)}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => setShowSettings(!showSettings)}>
             <MdSettings size={20} /> {showSettings ? "Hide Config" : "Camera Config"}
          </button>
          {!isRunning ? (
            <button className="btn btn-primary" onClick={() => setIsRunning(true)}>
              <MdMonitor size={20} /> Start All Streams
            </button>
          ) : (
            <button className="btn btn-danger" onClick={() => setIsRunning(false)}>
              <MdStopCircle size={20} /> Stop Monitoring
            </button>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="glass-panel mb-6" style={{ background: "rgba(30, 41, 59, 0.8)" }}>
           <h3 className="mb-4">Camera Assignments</h3>
           <div className="grid grid-cols-2 gap-6">
              <div className="form-group">
                <label>Entry Gate (Camera 1)</label>
                <select value={entryDeviceId} onChange={(e) => setEntryDeviceId(e.target.value)}>
                  {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,5)}`}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Exit Gate (Camera 2)</label>
                <select value={exitDeviceId} onChange={(e) => setExitDeviceId(e.target.value)}>
                  {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,5)}`}</option>)}
                </select>
              </div>
           </div>
        </div>
      )}

      <div className="panel-grid" style={{ gridTemplateColumns: "1fr 1fr 350px", gap: "20px" }}>
        {/* Entry Camera */}
        <div className="glass-panel text-center">
          <div className="flex items-center justify-center gap-2 mb-4" style={{ color: "#34d399" }}>
             <MdLogin size={20} />
             <h2 style={{ fontSize: "18px" }}>Entry Gate</h2>
          </div>
          <div className="video-container" style={{ width: "100%", borderRadius: "8px", overflow: "hidden", border: "2px solid rgba(16, 185, 129, 0.2)" }}>
             {isRunning && <div className="scan-line" style={{ background: "linear-gradient(to bottom, transparent, #10b981, transparent)" }}></div>}
             <video ref={videoRefEntry} autoPlay playsInline style={{ width: "100%", display: "block", transform: "scaleX(-1)" }} />
          </div>
        </div>

        {/* Exit Camera */}
        <div className="glass-panel text-center">
          <div className="flex items-center justify-center gap-2 mb-4" style={{ color: "#f87171" }}>
             <MdLogout size={20} />
             <h2 style={{ fontSize: "18px" }}>Exit Gate</h2>
          </div>
          <div className="video-container" style={{ width: "100%", borderRadius: "8px", overflow: "hidden", border: "2px solid rgba(239, 68, 68, 0.2)" }}>
             {isRunning && <div className="scan-line" style={{ background: "linear-gradient(to bottom, transparent, #ef4444, transparent)" }}></div>}
             <video ref={videoRefExit} autoPlay playsInline style={{ width: "100%", display: "block", transform: "scaleX(-1)" }} />
          </div>
        </div>

        {/* Live Ledger */}
        <div className="glass-panel">
          <h2 className="mb-6">Recent Scans</h2>
          <div className="list-view" style={{ maxHeight: "500px", overflowY: "auto" }}>
            {entries.length === 0 ? (
              <p className="text-secondary text-sm text-center py-10 italic">Waiting for subjects...</p>
            ) : (
              entries.map((entry, idx) => (
                <div key={idx} className="list-item" style={{ marginBottom: "12px", padding: "10px", borderBottom: "1px solid var(--glass-border)" }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{entry.full_name}</span>
                      <span style={{ fontSize: "10px", opacity: 0.6 }}>{entry.timestamp}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>ID: {entry.student_id}</span>
                      <span className={`badge ${entry.action === 'Entry' ? 'badge-present' : 'badge-absent'}`} style={{ fontSize: "10px" }}>
                        {entry.action === "Entry" ? "ENTRY" : "EXIT"}
                      </span>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}