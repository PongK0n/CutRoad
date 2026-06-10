// Canvas-based Traffic Particle Simulator for Leaflet Map Overlays

export class ParticleSimulator {
  constructor(canvas, map, nodes, edges) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.map = map;
    this.nodes = nodes;
    this.edges = edges;
    this.particles = [];
    this.animationId = null;
    this.isRunning = false;
    this.lastTime = 0;
    this.showRoadLabels = true;

    this.initParticles();
  }

  updateData(nodes, edges) {
    this.nodes = nodes;
    this.edges = edges;
    this.initParticles();
  }

  initParticles() {
    this.particles = [];
    
    this.edges.forEach(edge => {
      // Create particles proportional to traffic flow.
      // E.g., 1 particle per 8 units of traffic volume. Minimum 1 particle if there's any flow.
      const numParticles = edge.currentFlow > 0 
        ? Math.max(1, Math.round(edge.currentFlow / 8))
        : 0;

      for (let i = 0; i < numParticles; i++) {
        // Space out particles along the edge path initially
        const progress = i / numParticles + Math.random() * (1 / numParticles);
        
        this.particles.push({
          edge,
          progress: progress % 1.0,
          // Individual particle slight speed variation
          speedModifier: 0.9 + Math.random() * 0.2
        });
      }
    });
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    const loop = (time) => {
      if (!this.isRunning) return;
      this.tick(time);
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  tick(time) {
    const dt = (time - this.lastTime) / 1000; // in seconds
    this.lastTime = time;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw Road network underneath particles
    this.drawRoads();

    // 2. Update and Draw Particles
    this.particles.forEach(p => {
      // Speed of particle: based on road speed (km/h) converted to a relative visual scale
      // Convert km/h to simulation progress change speed.
      // speed (km/h) / 3600 (seconds) / road distance (km) gives progress increment per second
      const speedKmPerS = (p.edge.currentSpeed * p.speedModifier) / 3600;
      let progressIncrement = speedKmPerS / p.edge.distance;

      // Adjust particle speeds to visually slow down near intersections (ends of roads) if congested
      // This creates a realistic queueing effect at intersections!
      if (p.edge.currentDensity > 0.7 && p.progress > 0.8) {
        // Reduce speed as it gets closer to the end of the road (wait in queue)
        progressIncrement *= 0.2;
      }

      p.progress += progressIncrement * dt * 80; // Scaled up to make simulation fast-forward
      if (p.progress >= 1) {
        p.progress = 0; // Loop around on the same edge
      }

      this.drawParticle(p);
    });

    // 3. Draw Lane & Speed Limit Labels for Roads
    this.drawRoadLabels();
  }

  drawRoads() {
    const zoom = this.map.getZoom();
    // Dynamically adjust road width based on zoom level
    const baseWidth = zoom >= 15 ? 4.5 : zoom >= 14 ? 3 : 1.5;

    this.edges.forEach(edge => {
      const fromNode = this.nodes[edge.from];
      const toNode = this.nodes[edge.to];
      if (!fromNode || !toNode) return;

      const pFrom = this.map.latLngToContainerPoint([fromNode.lat, fromNode.lng]);
      const pTo = this.map.latLngToContainerPoint([toNode.lat, toNode.lng]);

      // Draw road line
      this.ctx.beginPath();
      this.ctx.moveTo(pFrom.x, pFrom.y);
      this.ctx.lineTo(pTo.x, pTo.y);
      this.ctx.lineWidth = baseWidth * (edge.isNew ? 1.5 : 1.0);
      this.ctx.lineCap = "round";
      
      // Disable shadow blur for crisp rendering on light map
      this.ctx.shadowBlur = 0;
      
      // Semi-transparent to let map labels show through
      this.ctx.globalAlpha = edge.isNew ? 0.9 : 0.7;
      this.ctx.strokeStyle = edge.congestionColor;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1.0; // Reset
      
      // Draw a subtle border around the new road to highlight it
      if (edge.isNew) {
        this.ctx.beginPath();
        this.ctx.moveTo(pFrom.x, pFrom.y);
        this.ctx.lineTo(pTo.x, pTo.y);
        this.ctx.lineWidth = baseWidth * 1.5 + 2;
        this.ctx.strokeStyle = "rgba(6, 182, 212, 0.4)"; // Cyan highlight border
        this.ctx.stroke();
      }
    });
  }

  drawParticle(p) {
    const fromNode = this.nodes[p.edge.from];
    const toNode = this.nodes[p.edge.to];
    if (!fromNode || !toNode) return;

    const pFrom = this.map.latLngToContainerPoint([fromNode.lat, fromNode.lng]);
    const pTo = this.map.latLngToContainerPoint([toNode.lat, toNode.lng]);

    // Interpolate particle position
    const x = pFrom.x + p.progress * (pTo.x - pFrom.x);
    const y = pFrom.y + p.progress * (pTo.y - pFrom.y);

    const zoom = this.map.getZoom();
    const particleRadius = zoom >= 15 ? 2.5 : zoom >= 14 ? 1.8 : 1.2;

    // Crisp circular car particle
    this.ctx.beginPath();
    this.ctx.arc(x, y, particleRadius, 0, Math.PI * 2);
    
    // Choose particle color - optimized for light background
    let particleColor = "#1e293b"; // Dark Slate for normal cars (highly visible on light map!)
    if (p.edge.isNew) {
      particleColor = "#0891b2"; // Dark Cyan for new road cars
    } else if (p.edge.currentDensity > 0.95) {
      particleColor = "#dc2626"; // Solid red for bottleneck queues
    } else if (p.edge.currentDensity > 0.7) {
      particleColor = "#d97706"; // Amber orange/yellow for slow traffic
    }

    this.ctx.fillStyle = particleColor;
    this.ctx.shadowBlur = 0; // Disable glow for light background readability
    
    this.ctx.fill();
  }

  drawRoundedRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  drawRoadLabels() {
    if (!this.showRoadLabels) return;
    const zoom = this.map.getZoom();
    if (zoom < 13) return; // Do not render at low zoom levels to prevent clutter

    // Render configuration based on zoom (smaller font/padding for existing roads to save space)
    const fontSize = zoom >= 15 ? 9 : 8;
    const paddingX = zoom >= 15 ? 6 : 5;
    const paddingY = zoom >= 15 ? 3 : 2;
    const badgeHeight = fontSize + paddingY * 2;
    const radius = 4;

    this.edges.forEach(edge => {
      const fromNode = this.nodes[edge.from];
      const toNode = this.nodes[edge.to];
      if (!fromNode || !toNode) return;

      const pFrom = this.map.latLngToContainerPoint([fromNode.lat, fromNode.lng]);
      const pTo = this.map.latLngToContainerPoint([toNode.lat, toNode.lng]);

      // Calculate midpoint
      const midX = (pFrom.x + pTo.x) / 2;
      const midY = (pFrom.y + pTo.y) / 2;

      // Label text content based on new/existing
      let text = "";
      let borderColor = "";
      let textColor = "";
      let borderThickness = 1.0;

      if (edge.isNew) {
        text = `🛣️ ${edge.name || 'ถนนโครงการ'}: ${edge.lanes} เลน (${edge.speedLimit} km/h)`;
        borderColor = "#0891b2"; // Cyan
        textColor = "#0891b2";
        borderThickness = 1.5;
      } else {
        text = `🚗 ${edge.name || 'ถนนเดิม'}: ${edge.lanes} เลน (${edge.speedLimit} km/h)`;
        borderColor = "#64748b"; // Slate-500
        textColor = "#475569"; // Slate-600
        borderThickness = 1.0;
      }

      this.ctx.font = `bold ${fontSize}px 'Outfit', sans-serif`;
      const textMetrics = this.ctx.measureText(text);
      const textWidth = textMetrics.width;
      const badgeWidth = textWidth + paddingX * 2;
      
      const badgeX = midX - badgeWidth / 2;
      const badgeY = midY - badgeHeight / 2;

      // Save context state for shadow configuration
      this.ctx.save();

      // Shadow overlay
      this.ctx.shadowColor = "rgba(15, 23, 42, 0.1)";
      this.ctx.shadowBlur = 4;
      this.ctx.shadowOffsetY = 1.5;

      // Badge background: Clean white
      this.ctx.fillStyle = "#ffffff";
      this.drawRoundedRect(badgeX, badgeY, badgeWidth, badgeHeight, radius);
      this.ctx.fill();

      // Restore to remove shadow for border/text drawing
      this.ctx.restore();

      // Badge border
      this.ctx.beginPath();
      this.drawRoundedRect(badgeX, badgeY, badgeWidth, badgeHeight, radius);
      this.ctx.lineWidth = borderThickness;
      this.ctx.strokeStyle = borderColor;
      this.ctx.stroke();

      // Badge text
      this.ctx.fillStyle = textColor;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(text, midX, midY + 0.5);
    });
  }
}
