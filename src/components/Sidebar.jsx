import React from "react";
import { 
  Compass, 
  PenTool, 
  Play, 
  HelpCircle,
  Wrench,
  Map,
  Layers
} from "lucide-react";

export default function Sidebar({
  selectedDistrict,
  setSelectedDistrict,
  isDrawMode,
  setIsDrawMode,
  hasNewRoad,
  onRunSimulation,
  isSimulated,
  onReset,
  setShowParams,
  isEditMode,
  setIsEditMode,
  onCopyCoordinates,
  // Map Editor Props
  edges = [],
  editorMode,
  setEditorMode,
  onDeleteEdge,
  onClearMap,
  onResetMap,
  onExportMapCode,
  // Scenario comparison props
  leftScenario,
  rightScenario,
  onLeftScenarioChange,
  onRightScenarioChange
}) {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <Compass className="brand-logo" size={28} />
        <h1 className="brand-title">CutRoad Sandbox</h1>
      </div>

      {/* 1. District Selector */}
      <div className="sidebar-section" style={{ marginBottom: "16px" }}>
        <label className="sidebar-label" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--cyan)" }}>
          🌐 เลือกพื้นที่นำร่อง (District Sandbox)
        </label>
        <div className="segmented-control vertical" style={{ marginTop: "6px" }}>
          <button 
            type="button"
            className={`segmented-btn ${selectedDistrict === "ari" ? "active" : ""}`}
            onClick={() => setSelectedDistrict("ari")}
            aria-pressed={selectedDistrict === "ari"}
          >
            อารีย์ (Ari Sandbox)
          </button>
          <button 
            type="button"
            className={`segmented-btn ${selectedDistrict === "ladprao" ? "active" : ""}`}
            onClick={() => setSelectedDistrict("ladprao")}
            aria-pressed={selectedDistrict === "ladprao"}
          >
            ลาดพร้าว (Phase 2) 🔒
          </button>
          <button 
            type="button"
            className={`segmented-btn ${selectedDistrict === "onnut" ? "active" : ""}`}
            onClick={() => setSelectedDistrict("onnut")}
            aria-pressed={selectedDistrict === "onnut"}
          >
            อ่อนนุช (Phase 2) 🔒
          </button>
        </div>
      </div>

      {/* CATEGORY A: Base Map Setup */}
      <div className="sidebar-section" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "14px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <Map size={14} className="brand-logo" />
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", textTransform: "uppercase" }}>
            หมวด A: ออกแบบแผนที่ฐาน (Base Map)
          </span>
        </div>
        
        {/* Geographic Alignment (Tool 3) */}
        <button 
          className={`tool-btn ${isEditMode ? 'active' : ''}`}
          onClick={() => {
            setIsEditMode(!isEditMode);
            setIsDrawMode(false);
            setEditorMode(null);
          }}
          style={{ marginBottom: "8px", fontSize: "11px", justifyContent: "flex-start", padding: "10px" }}
        >
          <Wrench size={14} />
          {isEditMode ? '🔧 กำลังแก้ไขพิกัด (คลิกลากสี่แยก)' : '🛠️ ปรับแต่งตำแหน่งสี่แยก (Drag Nodes)'}
        </button>
        
        {isEditMode && (
          <button 
            className="tool-btn"
            onClick={onCopyCoordinates}
            style={{ 
              background: "rgba(16, 185, 129, 0.1)", 
              borderColor: "var(--emerald)",
              color: "var(--emerald)",
              fontSize: "11px",
              padding: "8px",
              marginBottom: "12px"
            }}
          >
            📋 คัดลอกพิกัดใหม่ไปลงโค้ด (Copy JSON)
          </button>
        )}

        {/* Network Editor (Tool 4) */}
        <div style={{ background: "var(--bg-primary)", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "8px" }}>
            เครื่องมือแก้ไขและวาดเส้นถนนจำลอง (Map Editor):
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
            <button 
              className={`tool-btn ${editorMode === "add_node" ? "active" : ""}`}
              onClick={() => {
                setEditorMode(editorMode === "add_node" ? null : "add_node");
                setIsDrawMode(false);
                setIsEditMode(false);
              }}
              style={{ fontSize: "10px", padding: "6px" }}
            >
              ➕ เพิ่มแยกใหม่
            </button>
            
            <button 
              className={`tool-btn ${editorMode === "add_edge" ? "active" : ""}`}
              onClick={() => {
                setEditorMode(editorMode === "add_edge" ? null : "add_edge");
                setIsDrawMode(false);
                setIsEditMode(false);
              }}
              style={{ fontSize: "10px", padding: "6px" }}
            >
              🔗 เชื่อมเส้นถนน
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px" }}>
            <button 
              className={`tool-btn ${editorMode === "delete_node" ? "active" : ""}`}
              onClick={() => {
                setEditorMode(editorMode === "delete_node" ? null : "delete_node");
                setIsDrawMode(false);
                setIsEditMode(false);
              }}
              style={{ fontSize: "10px", padding: "6px", borderColor: "rgba(239, 68, 68, 0.3)", color: "var(--red)" }}
            >
              ❌ ลบทางแยก
            </button>

            <button 
              className="tool-btn"
              onClick={onExportMapCode}
              style={{ fontSize: "10px", padding: "6px", color: "var(--cyan)" }}
            >
              💾 เซฟแผนที่ (Export)
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px" }}>
            <button 
              className="tool-btn"
              onClick={onClearMap}
              style={{ fontSize: "10px", padding: "5px", color: "var(--text-muted)", borderStyle: "dashed" }}
            >
              🗑️ ล้างแผนที่ว่าง
            </button>

            <button 
              className="tool-btn"
              onClick={onResetMap}
              style={{ fontSize: "10px", padding: "5px", color: "var(--text-muted)", borderStyle: "dashed" }}
            >
              🔄 รีเซ็ตดั้งเดิม
            </button>
          </div>

          {/* List of System Roads */}
          {edges.length > 0 && (
            <div style={{ maxHeight: "100px", overflowY: "auto", background: "rgba(15, 23, 42, 0.04)", borderRadius: "4px", padding: "6px", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "9px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "4px" }}>เส้นถนนที่มีอยู่ ({edges.length} เส้น):</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {edges.map((edge, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "9px", background: "#ffffff", padding: "3px 4px", borderRadius: "3px", border: "1px solid var(--border-color)" }}>
                    <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "150px" }}>
                      🛣️ {edge.name || "ถนนไม่มีชื่อ"}
                    </span>
                    <button 
                      onClick={() => onDeleteEdge(idx)}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0 2px" }}
                      title="ลบถนนเส้นนี้"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CATEGORY B: New Road Proposal Sandbox */}
      <div className="sidebar-section" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "14px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <Layers size={14} className="brand-logo" />
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", textTransform: "uppercase" }}>
            หมวด B: เสนอโครงการตัดถนนใหม่
          </span>
        </div>

        {/* Propose New Road (Tool 2) */}
        <button 
          className={`tool-btn ${isDrawMode ? 'active' : ''}`}
          onClick={() => {
            setIsDrawMode(!isDrawMode);
            setIsEditMode(false);
            setEditorMode(null);
            if (!isDrawMode) {
              setShowParams(false);
            }
          }}
          style={{ marginBottom: "8px", fontSize: "11px", justifyContent: "flex-start", padding: "10px" }}
        >
          <PenTool size={14} />
          {isDrawMode ? 'คลิกทางแยกเพื่อเสนอทางลัดใหม่...' : '✏️ วาดข้อเสนอถนนใหม่ (Draw Proposal)'}
        </button>
      </div>

      {/* หมวด C: เปรียบเทียบแผนที่จำลอง */}
      <div className="sidebar-section" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "14px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <Layers size={14} style={{ color: "var(--amber)" }} />
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", textTransform: "uppercase" }}>
            หมวด C: เปรียบเทียบแผนที่จำลอง
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
              📍 แผนที่ฝั่งซ้าย (Left Map)
            </label>
            <div className="segmented-control">
              <button 
                type="button"
                className={`segmented-btn ${leftScenario === "best" ? "active" : ""}`}
                onClick={() => onLeftScenarioChange("best")}
                title="Best Case (รถเดินทางสะดวกสุด)"
                aria-pressed={leftScenario === "best"}
              >
                <span className="scenario-badge scenario-best" />
                Best
              </button>
              <button 
                type="button"
                className={`segmented-btn ${leftScenario === "normal" ? "active" : ""}`}
                onClick={() => onLeftScenarioChange("normal")}
                title="Normal Case (จราจรปกติ)"
                aria-pressed={leftScenario === "normal"}
              >
                <span className="scenario-badge scenario-normal" />
                Normal
              </button>
              <button 
                type="button"
                className={`segmented-btn ${leftScenario === "worst" ? "active" : ""}`}
                onClick={() => onLeftScenarioChange("worst")}
                title="Worst Case (จราจรแย่สุด)"
                aria-pressed={leftScenario === "worst"}
              >
                <span className="scenario-badge scenario-worst" />
                Worst
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
              📍 แผนที่ฝั่งขวา (Right Map)
            </label>
            <div className="segmented-control">
              <button 
                type="button"
                className={`segmented-btn ${rightScenario === "best" ? "active" : ""}`}
                onClick={() => onRightScenarioChange("best")}
                title="Best Case (รถเดินทางสะดวกสุด)"
                aria-pressed={rightScenario === "best"}
              >
                <span className="scenario-badge scenario-best" />
                Best
              </button>
              <button 
                type="button"
                className={`segmented-btn ${rightScenario === "normal" ? "active" : ""}`}
                onClick={() => onRightScenarioChange("normal")}
                title="Normal Case (จราจรปกติ)"
                aria-pressed={rightScenario === "normal"}
              >
                <span className="scenario-badge scenario-normal" />
                Normal
              </button>
              <button 
                type="button"
                className={`segmented-btn ${rightScenario === "worst" ? "active" : ""}`}
                onClick={() => onRightScenarioChange("worst")}
                title="Worst Case (จราจรแย่สุด)"
                aria-pressed={rightScenario === "worst"}
              >
                <span className="scenario-badge scenario-worst" />
                Worst
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Help Box */}
      <div className="sidebar-section" style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: "16px" }}>
        <h3 style={{ fontSize: '12px', margin: '0 0 6px 0', color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <HelpCircle size={14} /> วิธีจำลองผลกระทบ:
        </h3>
        <ul style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li><b>ขั้นตอน A:</b> ออกแบบทางแยกและถนนเส้นเดิมใน <b>หมวด A</b> ให้ถูกต้องเรียบร้อย</li>
          <li><b>ขั้นตอน B:</b> วาดเสนอแนวถนนลัดสายใหม่ใน <b>หมวด B</b> (คลิกที่เครื่องมือแล้วเลือกจุด A และ B)</li>
          <li><b>ขั้นตอน C:</b> ตั้งค่าขนาดช่องเลนและความเร็วจำกัดของถนนโครงการ</li>
          <li><b>ขั้นตอน D:</b> กดปุ่ม <b>เริ่มจำลองผล (Run Sim)</b> เพื่อประมวลผลเปรียบเทียบ</li>
        </ul>
      </div>

      {/* Run Simulation */}
      <button 
        className="sim-btn"
        disabled={!hasNewRoad && !isSimulated}
        onClick={isSimulated ? onReset : onRunSimulation}
        style={{
          background: isSimulated 
            ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' 
            : 'linear-gradient(135deg, var(--cyan) 0%, #0891b2 100%)',
          boxShadow: isSimulated 
            ? '0 4px 15px rgba(239, 68, 68, 0.3)' 
            : '0 4px 15px rgba(6, 182, 212, 0.4)'
        }}
      >
        <Play size={18} fill="currentColor" />
        {isSimulated ? 'เคลียร์ผลจำลอง (Reset)' : 'เริ่มจำลองผล (Run Sim)'}
      </button>
    </aside>
  );
}
