import React from "react";
import { Gauge, Clock, AlertTriangle } from "lucide-react";

export default function Dashboard({ bestKPI, normalKPI, worstKPI, leftScenario, rightScenario, isSimulated }) {
  // Hardcoded baseline values if simulation hasn't run yet
  const allKpis = {
    best: isSimulated ? bestKPI : { avgSpeed: 24, speedChangePct: 0, delaySavedHrs: 0, congestionGrade: "D" },
    normal: isSimulated ? normalKPI : { avgSpeed: 22.5, speedChangePct: 0, delaySavedHrs: 0, congestionGrade: "D" },
    worst: isSimulated ? worstKPI : { avgSpeed: 21, speedChangePct: 0, delaySavedHrs: 0, congestionGrade: "E" }
  };

  const leftKpi = allKpis[leftScenario];
  const rightKpi = allKpis[rightScenario];

  const getScenarioLabel = (scenario) => {
    if (scenario === "best") return "Best Case (รถเดินทางสะดวกสุด)";
    if (scenario === "normal") return "Normal Case (จราจรปกติ)";
    return "Worst Case (จราจรแย่สุด)";
  };

  const getCongestionStatus = (grade) => {
    if (grade === "A" || grade === "B") return "จราจรคล่องตัว";
    if (grade === "C") return "จราจรชะลอตัว";
    if (grade === "D") return "จราจรหนาแน่น";
    return "ติดขัดวิกฤต (คอขวด)";
  };

  return (
    <footer className="dashboard">
      {/* Average Speed KPI */}
      <div className="kpi-card">
        <span className="kpi-title">
          <Gauge size={14} style={{ verticalAlign: "middle", marginRight: "6px" }} />
          ความเร็วเฉลี่ยย่านอารีย์ (Average Speed)
        </span>
        <div className="kpi-value-container">
          <div className="kpi-value-half">
            <span className="kpi-val best">{leftKpi.avgSpeed.toFixed(1)} <span className="kpi-unit">km/h</span></span>
            <span className="kpi-label">{getScenarioLabel(leftScenario)}</span>
            {isSimulated && (
              <span className={`kpi-compare-box ${leftKpi.speedChangePct < 0 ? 'negative' : ''}`}>
                {leftKpi.speedChangePct >= 0 ? "+" : ""}{leftKpi.speedChangePct.toFixed(0)}% {leftKpi.speedChangePct >= 0 ? "เร็วขึ้น" : "ช้าลง"}
              </span>
            )}
          </div>
          <div style={{ height: "40px", width: "1px", background: "var(--border-color)", alignSelf: "center" }} />
          <div className="kpi-value-half">
            <span className="kpi-val worst">{rightKpi.avgSpeed.toFixed(1)} <span className="kpi-unit">km/h</span></span>
            <span className="kpi-label">{getScenarioLabel(rightScenario)}</span>
            {isSimulated && (
              <span className={`kpi-compare-box ${rightKpi.speedChangePct < 0 ? 'negative' : ''}`}>
                {rightKpi.speedChangePct >= 0 ? "+" : ""}{rightKpi.speedChangePct.toFixed(0)}% {rightKpi.speedChangePct >= 0 ? "เร็วขึ้น" : "ช้าลง"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Delay Time Saved KPI */}
      <div className="kpi-card">
        <span className="kpi-title">
          <Clock size={14} style={{ verticalAlign: "middle", marginRight: "6px" }} />
          เวลาเดินทางที่ประหยัดได้รวม (Total Delay Saved)
        </span>
        <div className="kpi-value-container">
          <div className="kpi-value-half">
            <span className="kpi-val best" style={{ color: "var(--cyan)" }}>
              {isSimulated ? leftKpi.delaySavedHrs.toFixed(0) : "0"} <span className="kpi-unit">ชั่วโมง/วัน</span>
            </span>
            <span className="kpi-label">{getScenarioLabel(leftScenario)}</span>
          </div>
          <div style={{ height: "40px", width: "1px", background: "var(--border-color)", alignSelf: "center" }} />
          <div className="kpi-value-half">
            <span className="kpi-val worst" style={{ color: rightScenario === "worst" ? "var(--red)" : "var(--cyan)" }}>
              {isSimulated ? rightKpi.delaySavedHrs.toFixed(0) : "0"} <span className="kpi-unit">ชั่วโมง/วัน</span>
            </span>
            <span className="kpi-label">{getScenarioLabel(rightScenario)}</span>
          </div>
        </div>
      </div>

      {/* Congestion Index KPI */}
      <div className="kpi-card">
        <span className="kpi-title">
          <AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: "6px" }} />
          ดัชนีรถติดของย่าน (Congestion Index)
        </span>
        <div className="kpi-value-container" style={{ gap: "30px" }}>
          <div className="kpi-value-half" style={{ flexDirection: "row", gap: "10px", alignItems: "center" }}>
            <div className={`grade-circle ${leftKpi.congestionGrade}`}>
              {leftKpi.congestionGrade}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="kpi-label" style={{ fontSize: "9px" }}>{leftScenario.toUpperCase()} GRADE</span>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)" }}>
                {getCongestionStatus(leftKpi.congestionGrade)}
              </span>
            </div>
          </div>
          <div style={{ height: "40px", width: "1px", background: "var(--border-color)", alignSelf: "center" }} />
          <div className="kpi-value-half" style={{ flexDirection: "row", gap: "10px", alignItems: "center" }}>
            <div className={`grade-circle ${rightKpi.congestionGrade}`}>
              {rightKpi.congestionGrade}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="kpi-label" style={{ fontSize: "9px" }}>{rightScenario.toUpperCase()} GRADE</span>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)" }}>
                {getCongestionStatus(rightKpi.congestionGrade)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
