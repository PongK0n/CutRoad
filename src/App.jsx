import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import MapContainer from "./components/MapContainer";
import Dashboard from "./components/Dashboard";
import { 
  DEFAULT_NODES, 
  DEFAULT_EDGES, 
  BASELINE_DEMANDS, 
  simulateTraffic, 
  calculateKPIs 
} from "./simulation/network";
import { Terminal, Lock, Settings, X, Edit3 } from "lucide-react";

export default function App() {
  const [selectedDistrict, setSelectedDistrict] = useState("ari");
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Load nodes into state to allow real-time dragging alignment edits
  const [nodes, setNodes] = useState(DEFAULT_NODES);
  const [edges, setEdges] = useState(DEFAULT_EDGES);
  const [editorMode, setEditorMode] = useState(null); // null | "add_node" | "add_edge" | "delete_node"
  const [editorDrawStartNode, setEditorDrawStartNode] = useState(null);

  const [newRoad, setNewRoad] = useState(null);
  const [newRoadParams, setNewRoadParams] = useState({ lanes: 2, speedLimit: 50 });
  const [hasNewRoad, setHasNewRoad] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [showParams, setShowParams] = useState(false);
  const [leftScenario, setLeftScenario] = useState("best");
  const [rightScenario, setRightScenario] = useState("worst");
  
  // Draggable parameters panel positioning state
  const [panelPos, setPanelPos] = useState({ x: 360, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Loading Simulation state
  const [showLoader, setShowLoader] = useState(false);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [loaderConsoleLines, setLoaderConsoleLines] = useState([]);

  // Locked District Modal state
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [lockedDistrictName, setLockedDistrictName] = useState("");

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null
  });

  // Ref to hold simulation interval for abortability
  const simIntervalRef = useRef(null);

  // Sync newRoad parameter modifications dynamically
  useEffect(() => {
    if (newRoad) {
      setNewRoad(prev => ({
        ...prev,
        lanes: newRoadParams.lanes,
        speedLimit: newRoadParams.speedLimit
      }));
    }
  }, [newRoadParams]);

  // Handle District Selector Changes
  const handleDistrictChange = (district) => {
    if (district !== "ari") {
      const names = {
        ladprao: "ลาดพร้าว (Ladprao Sandbox)",
        onnut: "อ่อนนุช (On Nut Sandbox)"
      };
      setLockedDistrictName(names[district] || district);
      setShowLockedModal(true);
    } else {
      setSelectedDistrict("ari");
    }
  };

  // Close District Lock Modal and reset select to Ari
  const handleCloseLockedModal = () => {
    setShowLockedModal(false);
    setSelectedDistrict("ari");
  };

  // Callback when user draws a new road on the map
  const handleRoadDrawn = (fromNodeId, toNodeId) => {
    setNewRoad({
      from: fromNodeId,
      to: toNodeId,
      lanes: newRoadParams.lanes,
      speedLimit: newRoadParams.speedLimit
    });
    setHasNewRoad(true);
    setShowParams(true); // Open settings overlay when drawing completes
    setIsSimulated(false); // Reset simulated state to force fresh simulation run
  };

  const handleCancelDrawing = () => {
    setNewRoad(null);
    setHasNewRoad(false);
    setShowParams(false);
  };

  // Callback when user drags a node to a new location in edit mode
  const handleNodeDragged = (nodeId, lat, lng) => {
    setNodes(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        lat,
        lng
      }
    }));
  };

  // Map Editor handlers
  const handleAddNode = (lat, lng) => {
    const id = `node_${Date.now()}`;
    const name = `แยกใหม่ที่ #${Object.keys(nodes).length + 1}`;
    setNodes(prev => ({
      ...prev,
      [id]: { id, name, lat, lng, type: "minor" }
    }));
  };

  const handleDeleteNode = (nodeId) => {
    const newNodes = { ...nodes };
    delete newNodes[nodeId];
    setNodes(newNodes);
    setEdges(prev => prev.filter(edge => edge.from !== nodeId && edge.to !== nodeId));
    if (newRoad && (newRoad.from === nodeId || newRoad.to === nodeId)) {
      setNewRoad(null);
      setHasNewRoad(false);
      setShowParams(false);
    }
  };

  const handleAddEdge = (from, to) => {
    const exists = edges.some(e => 
      (e.from === from && e.to === to) || (e.bidir && e.from === to && e.to === from)
    );
    if (exists) {
      alert("⚠️ ถนนระหว่างคู่นี้มีอยู่แล้วในระบบ");
      setEditorDrawStartNode(null);
      return;
    }
    const newEdge = {
      from,
      to,
      name: `ถนนซอยใหม่ #${edges.length + 1}`,
      lanes: 2,
      speedLimit: 40,
      bidir: true
    };
    setEdges(prev => [...prev, newEdge]);
    setEditorDrawStartNode(null);
  };

  const handleDeleteEdge = (index) => {
    setEdges(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearMap = () => {
    setConfirmModal({
      show: true,
      title: "ล้างแผนที่ว่าง (Clear Map)",
      message: "🗑️ คุณต้องการลบโครงร่างถนนทั้งหมดเพื่อเริ่มวาดใหม่ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้",
      onConfirm: () => {
        setNodes({});
        setEdges([]);
        setNewRoad(null);
        setHasNewRoad(false);
        setShowParams(false);
        setIsSimulated(false);
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const handleResetMap = () => {
    setConfirmModal({
      show: true,
      title: "รีเซ็ตแผนที่เริ่มต้น (Reset Map)",
      message: "🔄 ต้องการรีเซ็ตกลับเป็นแผนที่เครือข่ายย่านอารีย์เริ่มต้นใช่หรือไม่? ข้อเสนอและถนนที่แก้ไขทั้งหมดจะถูกยกเลิก",
      onConfirm: () => {
        setNodes(DEFAULT_NODES);
        setEdges(DEFAULT_EDGES);
        setNewRoad(null);
        setHasNewRoad(false);
        setShowParams(false);
        setIsSimulated(false);
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const handleExportMapCode = () => {
    const nodesStr = JSON.stringify(nodes, null, 2);
    const edgesStr = JSON.stringify(edges, null, 2);
    const code = `// วางแทนที่ DEFAULT_NODES และ DEFAULT_EDGES ในไฟล์ network.js ได้ทันที

export const DEFAULT_NODES = ${nodesStr};

export const DEFAULT_EDGES = ${edgesStr};
`;
    navigator.clipboard.writeText(code)
      .then(() => {
        alert("📋 คัดลอกโค้ดแผนที่ทั้งหมด (Nodes & Edges) ลง Clipboard สำเร็จ!\nคุณสามารถนำไปวางทับในไฟล์ src/simulation/network.js เพื่อจัดเก็บแผนที่นี้อย่างถาวรได้ทันทีครับ");
      })
      .catch(err => {
        console.error("Failed to copy code: ", err);
      });
  };

  // Copy coordinates JSON format to clipboard
  const handleCopyCoordinates = () => {
    const formattedNodes = JSON.stringify(nodes, null, 2);
    navigator.clipboard.writeText(formattedNodes)
      .then(() => {
        alert("📋 คัดลอกโครงร่างพิกัดใหม่ในรูปแบบ JSON ลง Clipboard สำเร็จ!\nคุณสามารถนำไปวางทับตัวแปร DEFAULT_NODES ในไฟล์ src/simulation/network.js เพื่อเซฟตำแหน่งนี้ถาวรได้ทันทีครับ");
      })
      .catch((err) => {
        console.error("Clipboard copy failed: ", err);
      });
  };

  // Simulation runner triggering a futuristic terminal progress bar
  const handleRunSimulation = () => {
    setShowLoader(true);
    setLoaderProgress(0);
    setLoaderConsoleLines([]);

    const logSteps = [
      { prg: 10, msg: "🤖 [INIT] Initializing SUMO Demand Model interface..." },
      { prg: 25, msg: "🗺️ [GRID] Importing OpenStreetMap data for Ari District..." },
      { prg: 40, msg: "🚗 [TRIPS] Generating random trips using randomTrips.py script..." },
      { prg: 60, msg: `🛣️ [ROAD] Appending new custom link connection (Lanes: ${newRoadParams.lanes}, Speed Limit: ${newRoadParams.speedLimit} km/h)...` },
      { prg: 75, msg: "🧪 [SCENARIO A] Simulating traffic behavior for BEST CASE (Volume: 100%)..." },
      { prg: 90, msg: "⚠️ [SCENARIO B] Simulating traffic behavior for WORST CASE (Induced Demand: +40%)..." },
      { prg: 100, msg: "🏁 [COMPLETE] Plotting traffic matrix data and updating maps..." }
    ];

    let currentStepIdx = 0;

    simIntervalRef.current = setInterval(() => {
      if (currentStepIdx < logSteps.length) {
        const step = logSteps[currentStepIdx];
        setLoaderProgress(step.prg);
        setLoaderConsoleLines(prev => [...prev, step.msg]);
        currentStepIdx++;
      } else {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
        setTimeout(() => {
          setShowLoader(false);
          setIsSimulated(true);
        }, 600); // Small pause to show completion
      }
    }, 450);
  };

  // Keydown listener for Esc to abort simulation loader or cancel drawing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showLoader) {
          if (simIntervalRef.current) {
            clearInterval(simIntervalRef.current);
            simIntervalRef.current = null;
          }
          setShowLoader(false);
          setLoaderProgress(0);
          setLoaderConsoleLines([]);
        } else if (isDrawMode) {
          handleCancelDrawing();
        } else if (editorMode) {
          setEditorMode(null);
          setEditorDrawStartNode(null);
        } else if (confirmModal.show) {
          setConfirmModal(prev => ({ ...prev, show: false }));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLoader, isDrawMode, editorMode, confirmModal.show]);

  const handleReset = () => {
    setIsSimulated(false);
    setNewRoad(null);
    setHasNewRoad(false);
    setShowParams(false);
  };

  // Draggable dragging mouse handlers
  const handleMouseDown = (e) => {
    if (e.target.closest(".params-header-drag")) {
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX - panelPos.x,
        y: e.clientY - panelPos.y
      };
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    // Constrain within window viewport bounds
    setPanelPos({
      x: Math.max(20, Math.min(window.innerWidth - 300, newX)),
      y: Math.max(20, Math.min(window.innerHeight - 300, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, panelPos]);

  // Get current active network edges based on simulation state
  const bestEdges = simulateTraffic(
    nodes,
    edges,
    BASELINE_DEMANDS,
    "best",
    isSimulated ? newRoad : null
  );

  const normalEdges = simulateTraffic(
    nodes,
    edges,
    BASELINE_DEMANDS,
    "normal",
    isSimulated ? newRoad : null
  );

  const worstEdges = simulateTraffic(
    nodes,
    edges,
    BASELINE_DEMANDS,
    "worst",
    isSimulated ? newRoad : null
  );

  // Compute live KPIs
  const bestKPI = calculateKPIs(nodes, edges, BASELINE_DEMANDS, "best", newRoad);
  const normalKPI = calculateKPIs(nodes, edges, BASELINE_DEMANDS, "normal", newRoad);
  const worstKPI = calculateKPIs(nodes, edges, BASELINE_DEMANDS, "worst", newRoad);

  return (
    <>
      <Sidebar
        selectedDistrict={selectedDistrict}
        setSelectedDistrict={handleDistrictChange}
        isDrawMode={isDrawMode}
        setIsDrawMode={setIsDrawMode}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        onCopyCoordinates={handleCopyCoordinates}
        hasNewRoad={hasNewRoad}
        onRunSimulation={handleRunSimulation}
        isSimulated={isSimulated}
        onReset={handleReset}
        setShowParams={setShowParams}
        // Map Editor Props
        edges={edges}
        editorMode={editorMode}
        setEditorMode={setEditorMode}
        onDeleteEdge={handleDeleteEdge}
        onClearMap={handleClearMap}
        onResetMap={handleResetMap}
        onExportMapCode={handleExportMapCode}
        // Scenario comparison props
        leftScenario={leftScenario}
        rightScenario={rightScenario}
        onLeftScenarioChange={setLeftScenario}
        onRightScenarioChange={setRightScenario}
      />

      <MapContainer
        nodes={nodes}
        leftEdges={leftScenario === "best" ? bestEdges : leftScenario === "normal" ? normalEdges : worstEdges}
        rightEdges={rightScenario === "best" ? bestEdges : rightScenario === "normal" ? normalEdges : worstEdges}
        leftScenario={leftScenario}
        rightScenario={rightScenario}
        onLeftScenarioChange={setLeftScenario}
        onRightScenarioChange={setRightScenario}
        isDrawMode={isDrawMode}
        setIsDrawMode={setIsDrawMode}
        isEditMode={isEditMode}
        onNodeDragged={handleNodeDragged}
        onRoadDrawn={handleRoadDrawn}
        newRoad={newRoad}
        onCancelDrawing={handleCancelDrawing}
        // Map Editor Props
        editorMode={editorMode}
        setEditorMode={setEditorMode}
        editorDrawStartNode={editorDrawStartNode}
        setEditorDrawStartNode={setEditorDrawStartNode}
        onAddNode={handleAddNode}
        onDeleteNode={handleDeleteNode}
        onAddEdge={handleAddEdge}
      />

      <Dashboard
        bestKPI={bestKPI}
        normalKPI={normalKPI}
        worstKPI={worstKPI}
        leftScenario={leftScenario}
        rightScenario={rightScenario}
        isSimulated={isSimulated}
      />

      {/* Floating indicator when editing nodes */}
      {isEditMode && (
        <div 
          className="draw-instructions-banner" 
          style={{ background: "rgba(245, 158, 11, 0.95)", color: "#000", boxShadow: "var(--shadow-lg)" }}
        >
          <Edit3 size={16} />
          <span>โหมดปรับแต่งสี่แยก: คลิกลากจุดสีส้มบนแผนที่ไปวางทับถนนจริงให้ตรงตำแหน่ง</span>
        </div>
      )}

      {/* Draggable parameter settings dialog rendered at viewport-root level */}
      {showParams && (
        <div 
          className="params-panel"
          style={{
            position: "fixed",
            left: `${panelPos.x}px`,
            top: `${panelPos.y}px`,
            width: "280px",
            zIndex: 999,
            cursor: isDragging ? "grabbing" : "default"
          }}
          onMouseDown={handleMouseDown}
        >
          <div 
            className="params-header-drag"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "grab",
              paddingBottom: "10px",
              borderBottom: "1px solid var(--border-color)",
              marginBottom: "12px"
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
              <Settings size={14} className="brand-logo" />
              การตั้งค่าถนนใหม่
            </span>
            <button 
              onClick={() => setShowParams(false)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}
            >
              <X size={16} />
            </button>
          </div>

          <div className="param-group">
            <div className="param-header">
              <span>จำนวนเลนเดินรถ</span>
              <span className="param-val">{newRoadParams.lanes} เลน</span>
            </div>
            <div className="option-group">
              <button 
                className={`option-btn ${newRoadParams.lanes === 2 ? 'active' : ''}`}
                onClick={() => setNewRoadParams(prev => ({ ...prev, lanes: 2 }))}
              >
                2 เลน (ไป-กลับ)
              </button>
              <button 
                className={`option-btn ${newRoadParams.lanes === 4 ? 'active' : ''}`}
                onClick={() => setNewRoadParams(prev => ({ ...prev, lanes: 4 }))}
              >
                4 เลน (ไป-กลับ)
              </button>
            </div>
          </div>

          <div className="param-group">
            <div className="param-header">
              <span>ความเร็วจำกัด (Speed Limit)</span>
              <span className="param-val">{newRoadParams.speedLimit} km/h</span>
            </div>
            <input 
              type="range"
              min="30"
              max="80"
              step="10"
              className="param-slider"
              value={newRoadParams.speedLimit}
              onChange={(e) => setNewRoadParams(prev => ({ ...prev, speedLimit: parseInt(e.target.value) }))}
            />
          </div>
          
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'center' }}>
            *แดร็กที่ส่วนหัวเพื่อย้ายแผงควบคุมนี้ได้อิสระ
          </div>
        </div>
      )}

      {/* Futuristic Simulation Loader Overlay */}
      {showLoader && (
        <div className="sim-loader-overlay">
          <div className="sim-loader-box">
            <h2 className="sim-loader-title">
              <Terminal size={20} className="brand-logo" />
              SUMO Simulation Console
            </h2>
            <div className="sim-loader-progress-bar">
              <div 
                className="sim-loader-progress-fill" 
                style={{ width: `${loaderProgress}%` }}
              />
            </div>
            <div className="sim-loader-console">
              {loaderConsoleLines.map((line, idx) => (
                <div key={idx} className="console-line">
                  {line}
                </div>
              ))}
            </div>
            <button 
              className="locked-btn" 
              style={{ marginTop: "20px", width: "100%", background: "#ef4444", color: "#ffffff" }}
              onClick={() => {
                if (simIntervalRef.current) {
                  clearInterval(simIntervalRef.current);
                  simIntervalRef.current = null;
                }
                setShowLoader(false);
                setLoaderProgress(0);
                setLoaderConsoleLines([]);
              }}
            >
              ยกเลิกการจำลอง (Abort Simulation) [Esc]
            </button>
          </div>
        </div>
      )}

      {/* System District Locked Modal */}
      {showLockedModal && (
        <div className="locked-modal-overlay">
          <div className="locked-modal">
            <div className="locked-icon-box">
              <Lock size={32} />
            </div>
            <h2 className="locked-title">ล็อกพื้นที่นำร่อง (District Sandbox Locked)</h2>
            <p className="locked-desc">
              ระบบจำลองย่าน <strong>{lockedDistrictName}</strong> อยู่ในแผนงานพัฒนาเฟสถัดไป (Roadmap Phase 2)
              <br /><br />
              <span style={{ color: "var(--cyan)", fontWeight: "600" }}>
                *ปัจจุบันเปิดทดลองเฉพาะระบบนำร่อง ย่านอารีย์ (Ari Sandbox) เท่านั้น
              </span>
            </p>
            <button className="locked-btn" onClick={handleCloseLockedModal}>
              ตกลง (ย้อนกลับสู่อารีย์)
            </button>
          </div>
        </div>
      )}
      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div className="locked-modal-overlay">
          <div className="locked-modal">
            <h2 className="locked-title">{confirmModal.title}</h2>
            <p className="locked-desc">{confirmModal.message}</p>
            <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "center", marginTop: "8px" }}>
              <button 
                className="locked-btn" 
                style={{ background: "#ef4444", color: "#ffffff" }} 
                onClick={confirmModal.onConfirm}
              >
                ยืนยัน (Confirm)
              </button>
              <button 
                className="locked-btn" 
                style={{ background: "#cbd5e1", color: "var(--text-primary)" }} 
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
              >
                ยกเลิก (Cancel)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
