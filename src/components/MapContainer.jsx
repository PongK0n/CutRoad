import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { ParticleSimulator } from "../simulation/particles";
import { Link2, Sparkles, AlertTriangle } from "lucide-react";

export default function MapContainer({
  nodes,
  leftEdges,
  rightEdges,
  leftScenario,
  rightScenario,
  onLeftScenarioChange,
  onRightScenarioChange,
  isDrawMode,
  setIsDrawMode,
  onRoadDrawn,
  newRoad,
  onCancelDrawing,
  isEditMode,
  onNodeDragged,
  // Map Editor Props
  editorMode,
  setEditorMode,
  editorDrawStartNode,
  setEditorDrawStartNode,
  onAddNode,
  onDeleteNode,
  onAddEdge
}) {
  const mapLeftRef = useRef(null);
  const mapRightRef = useRef(null);
  const containerLeftRef = useRef(null);
  const containerRightRef = useRef(null);
  const canvasLeftRef = useRef(null);
  const canvasRightRef = useRef(null);
  const svgOverlayRef = useRef(null);

  const [mapLeftInstance, setMapLeftInstance] = useState(null);
  const [mapRightInstance, setMapRightInstance] = useState(null);

  // Drawing state
  const [drawStartNode, setDrawStartNode] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Simulators
  const simulatorLeftRef = useRef(null);
  const simulatorRightRef = useRef(null);

  // Sync state helper to prevent infinite loop
  const isSyncing = useRef(false);

  // Node coordinate positions translated to pixels for SVG drawing
  const [pixelNodes, setPixelNodes] = useState({});

  // Collapsible legend state
  const [showLegend, setShowLegend] = useState(true);
  const [showRoadLabels, setShowRoadLabels] = useState(true);

  // 1. Initialize maps
  useEffect(() => {
    if (!containerLeftRef.current || !containerRightRef.current) return;

    // Bangkok Ari Center Coordinates
    const ariCenter = [13.7812, 100.5400];
    const initialZoom = 15;

    // Left Map (Best Case)
    const mapLeft = L.map(containerLeftRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView(ariCenter, initialZoom);

    // Right Map (Worst Case)
    const mapRight = L.map(containerRightRef.current, {
      zoomControl: false, // Only left map has zoom buttons to keep UI clean
      attributionControl: false
    }).setView(ariCenter, initialZoom);

    // Standard colored OpenStreetMap tiles
    const tileLayerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    L.tileLayer(tileLayerUrl, { maxZoom: 19 }).addTo(mapLeft);
    L.tileLayer(tileLayerUrl, { maxZoom: 19 }).addTo(mapRight);

    setMapLeftInstance(mapLeft);
    setMapRightInstance(mapRight);

    // Cleanup on unmount
    return () => {
      mapLeft.remove();
      mapRight.remove();
    };
  }, []);

  // 2. Synchronize Map Views (Pan & Zoom)
  useEffect(() => {
    if (!mapLeftInstance || !mapRightInstance) return;

    const syncMaps = (sourceMap, targetMap) => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      const center = sourceMap.getCenter();
      const zoom = sourceMap.getZoom();
      targetMap.setView(center, zoom, { animate: false });
      isSyncing.current = false;

      // Update pixel positions of nodes on pan/zoom
      updateNodePixelPositions();
    };

    const handleLeftMove = () => syncMaps(mapLeftInstance, mapRightInstance);
    const handleRightMove = () => syncMaps(mapRightInstance, mapLeftInstance);

    mapLeftInstance.on("move", handleLeftMove);
    mapRightInstance.on("move", handleRightMove);

    // Initial positioning update
    setTimeout(updateNodePixelPositions, 200);

    return () => {
      mapLeftInstance.off("move", handleLeftMove);
      mapRightInstance.off("move", handleRightMove);
    };
  }, [mapLeftInstance, mapRightInstance, nodes]);

  // Helper to translate GPS node locations to pixel coordinates
  const updateNodePixelPositions = () => {
    if (!mapLeftInstance) return;
    const pixels = {};
    Object.keys(nodes).forEach(id => {
      const node = nodes[id];
      const point = mapLeftInstance.latLngToContainerPoint([node.lat, node.lng]);
      pixels[id] = { x: point.x, y: point.y };
    });
    setPixelNodes(pixels);
  };

  // 3. Setup Canvas particle simulation animations and handle resizing/projections
  useEffect(() => {
    if (!mapLeftInstance || !mapRightInstance || !canvasLeftRef.current || !canvasRightRef.current) return;

    const resizeCanvas = () => {
      if (!containerLeftRef.current || !containerRightRef.current) return;
      const leftRect = containerLeftRef.current.getBoundingClientRect();
      const rightRect = containerRightRef.current.getBoundingClientRect();
      
      if (canvasLeftRef.current && canvasRightRef.current) {
        canvasLeftRef.current.width = leftRect.width;
        canvasLeftRef.current.height = leftRect.height;
        canvasRightRef.current.width = rightRect.width;
        canvasRightRef.current.height = rightRect.height;
      }

      // Force recalculation of projection bounds
      mapLeftInstance.invalidateSize();
      mapRightInstance.invalidateSize();
      updateNodePixelPositions();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize simulators
    simulatorLeftRef.current = new ParticleSimulator(canvasLeftRef.current, mapLeftInstance, nodes, leftEdges);
    simulatorLeftRef.current.showRoadLabels = showRoadLabels;
    simulatorRightRef.current = new ParticleSimulator(canvasRightRef.current, mapRightInstance, nodes, rightEdges);
    simulatorRightRef.current.showRoadLabels = showRoadLabels;

    simulatorLeftRef.current.start();
    simulatorRightRef.current.start();

    // Map listeners to trigger canvas redraw on pan/zoom
    const onMapMove = () => {
      updateNodePixelPositions();
    };

    mapLeftInstance.on("move", onMapMove);
    mapRightInstance.on("move", onMapMove);

    // Force initial invalidation after container has settled in Grid layout
    const layoutTimer = setTimeout(() => {
      resizeCanvas();
    }, 400);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      clearTimeout(layoutTimer);
      if (simulatorLeftRef.current) simulatorLeftRef.current.stop();
      if (simulatorRightRef.current) simulatorRightRef.current.stop();
      
      if (mapLeftInstance) mapLeftInstance.off("move", onMapMove);
      if (mapRightInstance) mapRightInstance.off("move", onMapMove);
    };
  }, [mapLeftInstance, mapRightInstance]);

  // 4. Update simulator data when network changes (Best vs Worst Case)
  useEffect(() => {
    if (simulatorLeftRef.current) {
      simulatorLeftRef.current.updateData(nodes, leftEdges);
    }
  }, [leftEdges, nodes]);

  useEffect(() => {
    if (simulatorRightRef.current) {
      simulatorRightRef.current.updateData(nodes, rightEdges);
    }
  }, [rightEdges, nodes]);

  // Sync road labels visibility
  useEffect(() => {
    if (simulatorLeftRef.current) {
      simulatorLeftRef.current.showRoadLabels = showRoadLabels;
    }
    if (simulatorRightRef.current) {
      simulatorRightRef.current.showRoadLabels = showRoadLabels;
    }
  }, [showRoadLabels]);

  // 5. Drawing and Node Dragging handlers
  const [activeDragNode, setActiveDragNode] = useState(null);

  const handleSvgMouseMove = (e) => {
    if (!svgOverlayRef.current) return;
    const rect = svgOverlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if ((isDrawMode && drawStartNode) || (editorMode === "add_edge" && editorDrawStartNode)) {
      setMousePos({ x, y });
    }

    if (isEditMode && activeDragNode && mapLeftInstance) {
      // Convert pixel position back to LatLng on the map
      const latlng = mapLeftInstance.containerPointToLatLng([x, y]);
      onNodeDragged(activeDragNode, latlng.lat, latlng.lng);
    }
  };

  const handleNodeClick = (nodeId) => {
    if (isDrawMode) {
      if (!drawStartNode) {
        // First click: Select start node
        setDrawStartNode(nodeId);
        const startPoint = pixelNodes[nodeId];
        setMousePos(startPoint);
      } else {
        // Second click: Select end node
        if (drawStartNode === nodeId) {
          setDrawStartNode(null);
          return;
        }
        
        // Complete road drawing
        onRoadDrawn(drawStartNode, nodeId);
        setDrawStartNode(null);
        setIsDrawMode(false);
      }
    } else if (editorMode === "add_edge") {
      if (!editorDrawStartNode) {
        setEditorDrawStartNode(nodeId);
        const startPoint = pixelNodes[nodeId];
        setMousePos(startPoint);
      } else {
        if (editorDrawStartNode === nodeId) {
          setEditorDrawStartNode(null);
          return;
        }
        onAddEdge(editorDrawStartNode, nodeId);
        setEditorDrawStartNode(null);
        setEditorMode(null); // Reset mode
      }
    } else if (editorMode === "delete_node") {
      onDeleteNode(nodeId);
      setEditorMode(null); // Reset mode
    }
  };

  const handleSvgClick = (e) => {
    if (!svgOverlayRef.current || !mapLeftInstance) return;
    if (editorMode !== "add_node") return;

    const rect = svgOverlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const latlng = mapLeftInstance.containerPointToLatLng([x, y]);
    onAddNode(latlng.lat, latlng.lng);
    setEditorMode(null); // Reset mode after adding node
  };

  const handleNodeDragStart = (e, nodeId) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setActiveDragNode(nodeId);
  };

  const handleNodeDragEnd = () => {
    setActiveDragNode(null);
  };

  const handleCancel = () => {
    setDrawStartNode(null);
    setIsDrawMode(false);
    onCancelDrawing();
  };

  return (
    <main className="maps-split-container">
      {/* Floating Instructions when drawing */}
      {isDrawMode && (
        <div className="draw-instructions-banner">
          <Sparkles size={16} />
          <span>
            {!drawStartNode 
              ? "คลิกเลือก จุดเริ่มต้น (ซอย/สี่แยก A)" 
              : "คลิกลากเพื่อเชื่อม จุดสิ้นสุด (ซอย/สี่แยก B)"}
          </span>
          <button 
            onClick={handleCancel}
            style={{
              background: "rgba(0,0,0,0.2)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "10px",
              fontWeight: "bold"
            }}
          >
            ✕
          </button>
        </div>
      )}

      {editorMode && (
        <div className="draw-instructions-banner" style={{ background: editorMode === "delete_node" ? "rgba(239, 68, 68, 0.95)" : "rgba(6, 182, 212, 0.95)", color: "#fff", boxShadow: "0 4px 15px rgba(0,0,0,0.25)" }}>
          <Sparkles size={16} />
          <span>
            {editorMode === "add_node" && "➕ โหมดเพิ่มสี่แยก: คลิกตรงไหนบนแผนที่ขวาก็ได้ เพื่อเพิ่มจุดทางแยกใหม่"}
            {editorMode === "add_edge" && (!editorDrawStartNode 
              ? "🔗 โหมดเชื่อมถนน: คลิกแยกเริ่มต้น (A) เพื่อลากเส้นถนนใหม่" 
              : "🔗 โหมดเชื่อมถนน: คลิกแยกปลายทาง (B) เพื่อสร้างถนนเชื่อม")}
            {editorMode === "delete_node" && "❌ โหมดลบสี่แยก: คลิกแยกสีแดงที่ต้องการลบออกจากระบบ"}
          </span>
          <button 
            onClick={() => {
              setEditorMode(null);
              setEditorDrawStartNode(null);
            }}
            style={{
              background: "rgba(0,0,0,0.2)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "10px",
              fontWeight: "bold"
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Sync map link indicator */}
      <div className="zoom-sync-indicator">
        <Link2 size={12} /> Sync Viewports
      </div>

      {/* Left Map: Best Case */}
      <div className="map-wrapper">
        <div className="map-header">
          <span className={`scenario-badge scenario-${leftScenario}`} />
          <div style={{ flex: 1 }}>
            <div className="map-header-title">
              {leftScenario === "best" && "Best Case (รถเดินทางสะดวกสุด)"}
              {leftScenario === "normal" && "Normal Case (จราจรปกติ)"}
              {leftScenario === "worst" && "Worst Case (จราจรแย่สุด)"}
            </div>
            <div className="map-header-subtitle">
              {leftScenario === "best" && "ปริมาณรถน้อย การจราจรคล่องตัวตามเส้นทาง"}
              {leftScenario === "normal" && "ปริมาณรถปานกลาง จราจรไหลลื่นสลับหยุดนิ่งปกติ"}
              {leftScenario === "worst" && "ปริมาณรถสูงขึ้น 40% รถสะสมตามคอขวดทางแยก"}
            </div>
          </div>
        </div>

        {/* Dedicated Leaflet container */}
        <div ref={containerLeftRef} className="leaflet-map-div" style={{ width: "100%", height: "100%" }} />

        {/* Canvas overlay for drawing particles */}
        <canvas 
          className="simulation-canvas" 
          ref={canvasLeftRef} 
          role="img" 
          aria-label="แผนที่จำลองการเคลื่อนตัวของรถยนต์ย่านอารีย์ (กรณีปริมาณรถปกติ Best Case)"
        />

        {showLegend ? (
          <div 
            className="map-legend" 
            style={{ pointerEvents: "auto" }}
            ref={(el) => {
              if (el) {
                L.DomEvent.disableClickPropagation(el);
                L.DomEvent.disableScrollPropagation(el);
              }
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px", marginBottom: "8px", gap: "20px" }}>
              <span style={{ fontWeight: "700", fontSize: "11px", color: "var(--text-primary)" }}>คำอธิบายความหนาแน่น (Legend)</span>
              <button 
                onClick={() => setShowLegend(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "10px", padding: 0 }}
                title="ซ่อนคำอธิบาย"
              >
                ย่อ ✕
              </button>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: "#10b981" }} />
              <span>จราจรโล่ง (วิ่งเร็วปกติ)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: "#f59e0b" }} />
              <span>ชะลอตัว (ชะลอสะสมแยก)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: "#ef4444" }} />
              <span>หนาแน่น (จราจรติดขัด)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", borderTop: "1px solid var(--border-color)", paddingTop: "8px" }}>
              <input 
                type="checkbox" 
                id="toggle-road-labels-left" 
                checked={showRoadLabels} 
                onChange={(e) => setShowRoadLabels(e.target.checked)} 
                style={{ cursor: "pointer", width: "13px", height: "13px" }}
              />
              <label htmlFor="toggle-road-labels-left" style={{ cursor: "pointer", fontSize: "10px", fontWeight: "600", color: "var(--text-primary)" }}>
                🛣️ แสดงป้ายข้อมูลถนน (OSM)
              </label>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowLegend(true)}
            className="map-legend"
            style={{ 
              padding: "8px 12px", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: "6px",
              pointerEvents: "auto",
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              fontWeight: "700",
              fontSize: "11px",
              color: "var(--cyan)",
              borderRadius: "8px",
              boxShadow: "var(--shadow-lg)"
            }}
            ref={(el) => {
              if (el) {
                L.DomEvent.disableClickPropagation(el);
                L.DomEvent.disableScrollPropagation(el);
              }
            }}
          >
            <span>ℹ️ คำอธิบายแผนที่</span>
          </button>
        )}
      </div>

      {/* Right Map: Worst Case */}
      <div className="map-wrapper">
        <div className="map-header">
          <span className={`scenario-badge scenario-${rightScenario}`} />
          <div style={{ flex: 1 }}>
            <div className="map-header-title">
              {rightScenario === "best" && "Best Case (รถเดินทางสะดวกสุด)"}
              {rightScenario === "normal" && "Normal Case (จราจรปกติ)"}
              {rightScenario === "worst" && "Worst Case (จราจรแย่สุด)"}
            </div>
            <div className="map-header-subtitle">
              {rightScenario === "best" && "ปริมาณรถน้อย การจราจรคล่องตัวตามเส้นทาง"}
              {rightScenario === "normal" && "ปริมาณรถปานกลาง จราจรไหลลื่นสลับหยุดนิ่งปกติ"}
              {rightScenario === "worst" && "ปริมาณรถสูงขึ้น 40% รถสะสมตามคอขวดทางแยก"}
            </div>
          </div>
        </div>

        {/* Dedicated Leaflet container */}
        <div ref={containerRightRef} className="leaflet-map-div" style={{ width: "100%", height: "100%" }} />

        {/* Canvas overlay for drawing particles */}
        <canvas 
          className="simulation-canvas" 
          ref={canvasRightRef} 
          role="img" 
          aria-label="แผนที่จำลองการเคลื่อนตัวของรถยนต์ย่านอารีย์ (กรณีรถหนาแน่นสะสม Induced Demand)"
        />

        {/* Overlay SVG for drawing intersections and rubberband lines */}
        {(isDrawMode || isEditMode || editorMode) && (
          <svg 
            className="interaction-svg" 
            ref={svgOverlayRef}
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleNodeDragEnd}
            onMouseLeave={handleNodeDragEnd}
            onClick={handleSvgClick}
            role="application"
            aria-label="เครื่องมือวาดเส้นถนนจำลองและปรับพิกัดทางแยก"
          >
            {/* Rubberband line */}
            {isDrawMode && drawStartNode && pixelNodes[drawStartNode] && (
              <line 
                x1={pixelNodes[drawStartNode].x} 
                y1={pixelNodes[drawStartNode].y} 
                x2={mousePos.x} 
                y2={mousePos.y} 
                className="drawing-rubberband"
              />
            )}

            {editorMode === "add_edge" && editorDrawStartNode && pixelNodes[editorDrawStartNode] && (
              <line 
                x1={pixelNodes[editorDrawStartNode].x} 
                y1={pixelNodes[editorDrawStartNode].y} 
                x2={mousePos.x} 
                y2={mousePos.y} 
                className="drawing-rubberband"
                style={{ stroke: "var(--cyan)", strokeDasharray: "4,4" }}
              />
            )}

            {/* Clickable snap intersections / Draggable handles */}
            {Object.keys(pixelNodes).map(id => {
              const node = pixelNodes[id];
              const isStart = drawStartNode === id || editorDrawStartNode === id;
              const isActiveEditor = editorMode === "add_edge" || editorMode === "delete_node";
              
              return (
                <circle 
                  key={id}
                  cx={node.x}
                  cy={node.y}
                  r={isStart ? 10 : (isEditMode || isActiveEditor) ? 9 : 7}
                  className={`snap-marker ${isStart || isEditMode || isActiveEditor ? 'active' : ''}`}
                  style={{ 
                    cursor: isEditMode ? "grab" : "pointer",
                    fill: editorMode === "delete_node" ? "#ef4444" : undefined 
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`ทางแยก ${nodes[id].name}${isEditMode ? " (คลิกลากเพื่อย้ายตำแหน่ง)" : ""}`}
                  onMouseDown={(e) => handleNodeDragStart(e, id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeClick(id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleNodeClick(id);
                    }
                  }}
                >
                  <title>{nodes[id].name} {isEditMode ? "(คลิกลากเพื่อปรับตำแหน่ง)" : ""}</title>
                </circle>
              );
            })}
          </svg>
        )}

        {showLegend ? (
          <div 
            className="map-legend" 
            style={{ pointerEvents: "auto" }}
            ref={(el) => {
              if (el) {
                L.DomEvent.disableClickPropagation(el);
                L.DomEvent.disableScrollPropagation(el);
              }
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px", marginBottom: "8px", gap: "20px" }}>
              <span style={{ fontWeight: "700", fontSize: "11px", color: "var(--text-primary)" }}>คำอธิบายความหนาแน่น (Legend)</span>
              <button 
                onClick={() => setShowLegend(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "10px", padding: 0 }}
                title="ซ่อนคำอธิบาย"
              >
                ย่อ ✕
              </button>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: "#ef4444" }} />
              <span>จราจรหนาแน่น (ติดขัดปกติ)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: "#7f1d1d" }} />
              <span style={{ color: "var(--red)", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                <AlertTriangle size={11} /> คอขวดสะสม ( Induced Demand )
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", borderTop: "1px solid var(--border-color)", paddingTop: "8px" }}>
              <input 
                type="checkbox" 
                id="toggle-road-labels-right" 
                checked={showRoadLabels} 
                onChange={(e) => setShowRoadLabels(e.target.checked)} 
                style={{ cursor: "pointer", width: "13px", height: "13px" }}
              />
              <label htmlFor="toggle-road-labels-right" style={{ cursor: "pointer", fontSize: "10px", fontWeight: "600", color: "var(--text-primary)" }}>
                🛣️ แสดงป้ายข้อมูลถนน (OSM)
              </label>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowLegend(true)}
            className="map-legend"
            style={{ 
              padding: "8px 12px", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: "6px",
              pointerEvents: "auto",
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              fontWeight: "700",
              fontSize: "11px",
              color: "var(--cyan)",
              borderRadius: "8px",
              boxShadow: "var(--shadow-lg)"
            }}
            ref={(el) => {
              if (el) {
                L.DomEvent.disableClickPropagation(el);
                L.DomEvent.disableScrollPropagation(el);
              }
            }}
          >
            <span>ℹ️ คำอธิบายแผนที่</span>
          </button>
        )}
      </div>
    </main>
  );
}
