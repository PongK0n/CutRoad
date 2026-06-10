---
name: CutRoad Sandbox
description: A clean minimal traffic simulator comparing best vs worst case road proposals side-by-side.
colors:
  primary: "#0284c7"
  primary-hover: "#0369a1"
  primary-light: "#e0f2fe"
  neutral-bg: "#f8fafc"
  neutral-surface: "#ffffff"
  neutral-border: "#e2e8f0"
  neutral-text: "#0f172a"
  neutral-muted: "#64748b"
  emerald: "#10b981"
  emerald-light: "#d1fae5"
  amber: "#f59e0b"
  amber-light: "#fef3c7"
  red: "#ef4444"
  red-light: "#fee2e2"
typography:
  display:
    fontFamily: "Outfit, Inter, system-ui, -apple-system, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Outfit, Inter, system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
---

# Design System: CutRoad Sandbox

## 1. Overview

**Creative North Star: "The Pristine Canvas"**

The CutRoad Sandbox design system is built to facilitate immediate, clear comprehension of complex urban traffic dynamics. By presenting a clean, daylight-inspired interface, the system ensures that urban planners and transit architects can compare scenario impacts without unnecessary cognitive load. The visuals prioritize structural clarity, crisp typography, and an airy layout that feels lightweight and highly professional.

This design system explicitly rejects the cyberpunk dark mode cliché, neon glows, and heavy GIS data dumps that distract from core decision-making variables. Instead, it utilizes a bright canvas with deliberate tonal layering to define boundaries, using vibrant color only to denote traffic conditions and interactive actions.

**Key Characteristics:**
- **Bright & Comforting Ambient Tone**: A daylight canvas that reduces eye strain during prolonged modeling sessions.
- **Tonal Contrast Hierarchy**: Elevation is defined by card background shifts instead of heavy drop shadows.
- **Restrained Semantic Anchoring**: Pure gray and slate tones construct the app shell, keeping green, yellow, and red status indicators highly distinct and meaningful.
- **Task-Focused Layout**: A fixed-pixel sidebar and bottom dashboard wrap around a dominant dual-map panel.

## 2. Colors

A precise Slate-based neutral palette paired with sky-blue actions and sharp status-based traffic density colors.

### Primary
- **Sky Blue** (#0284c7 / oklch(60.15% 0.165 244.38)): The color for active controls, interactive tools, and main CTA actions.
- **Sky Blue Deep** (#0369a1 / oklch(50.5% 0.155 245.2)): Used for hover states on primary interactive elements.
- **Sky Highlight** (#e0f2fe / oklch(92.9% 0.04 243.8)): Light background highlight for active selections or chips.

### Neutral
- **Canvas BG** (#f8fafc / oklch(98.3% 0.004 247.8)): The overall workspace background, representing the daylight ambient color.
- **Panel BG** (#ffffff / oklch(100% 0 0)): Pure white background used for containers, cards, and floating UI panels.
- **Slate Border** (#e2e8f0 / oklch(92.8% 0.007 243.4)): The clean, low-contrast border line that structures sidebars and cards.
- **Obsidian Text** (#0f172a / oklch(19.2% 0.015 247.3)): The primary text color, delivering optimal contrast (>= 7:1) for body text and labels.
- **Slate Muted** (#64748b / oklch(54.4% 0.019 244.6)): The label and helper text color, remaining legible while staying secondary.

### Semantic Status
- **Emerald Green** (#10b981 / oklch(69.8% 0.198 153.2)): Best Case flow, clear traffic, and positive KPIs.
- **Amber Yellow** (#f59e0b / oklch(76.5% 0.188 77.2)): Warning states, moderate traffic speed.
- **Crimson Red** (#ef4444 / oklch(62.7% 0.22 28.9)): Worst Case flow, heavy congestion, and bottlenecks.

### Named Rules
**The Rarity of Color Rule.** Color represents state or interactive potential only. Saturated colors are never used decoratively or on background wrappers. A screen must be 90% neutral slate/white, allowing the traffic map and KPIs to draw the eye immediately.

## 3. Typography

**Display Font:** Outfit (fallback: Inter, system-ui, sans-serif)
**Body Font:** Outfit (fallback: Inter, system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (fallback: monospace)

The typography is built on a tight, fixed-rem scale using a single geometric sans-serif family to ensure familiarity and eliminate layout noise. Display headers are kept compact to maximize map screen real estate.

### Hierarchy
- **Display** (Bold, 20px (1.25rem), Line-height: 1.2): Title headers for panels and primary sidebar branding.
- **Headline** (Semi-bold, 15px (0.9375rem), Line-height: 1.3): Scenario sub-sections and parameter panel titles.
- **Title** (Medium, 14px (0.875rem), Line-height: 1.4): Active controls and key KPI text headers.
- **Body** (Regular, 13px (0.8125rem), Line-height: 1.5): Standard paragraphs, tool descriptions, and list items.
- **Label** (Semi-bold, 11px (0.6875rem), Letter-spacing: 0.1em, Uppercase): Sidebar headers and table labels.

### Named Rules
**The Fixed scale rule.** Fluid clamp sizing is prohibited. Layout density is maintained using rigid layout breakpoints rather than fluid font scaling, ensuring crisp alignment at all viewport widths.

## 4. Elevation

The system relies on tonal layering and border lines rather than depth shadows. Card containers match the document canvas color when flat, or sit on a white background with a thin slate border to signal elevation.

### Named Rules
**The Border-Driven Depth Rule.** All card containers, overlays, and panel boundaries are defined by a solid 1px border (#e2e8f0) and subtle background shifts. Box-shadows are prohibited except as a soft, ambient glow on hovering active map markers or sliders.

## 5. Components

### Buttons
- **Shape:** Moderate rounded corners (8px radius) for standard buttons.
- **Primary:** Sky Blue (#0284c7) background with Obsidian Text (#0f172a) replaced by white text (#ffffff) for optimal contrast. Padding: 12px 16px.
- **Hover / Focus:** Transitions to Sky Blue Deep (#0369a1) over 150ms. Focus state adds a double-ring offset.
- **Secondary / Option:** White (#ffffff) background with Slate Border (#e2e8f0) and Obsidian Text (#0f172a). Highlights active state using Sky Highlight (#e0f2fe) background and Sky Blue (#0284c7) border.

### Parameter Cards / Containers
- **Corner Style:** Medium rounded corners (8px radius).
- **Background:** Pure white (#ffffff) surface.
- **Border:** Slate Border (#e2e8f0), 1px solid.
- **Internal Padding:** Spaced evenly with 16px padding to maintain visual breathing room.

### Form Inputs & Sliders
- **Style:** Background of light slate (#f8fafc) with a Slate Border (#e2e8f0).
- **Focus:** Border shifts to Sky Blue (#0284c7) with a subtle sky highlight ring.
- **Slider Track:** Sky Highlight (#e0f2fe) track with a 16px solid Sky Blue (#0284c7) thumb, scale-transitioning to 1.1x on hover.

### Navigation / Map Headers
- **Scenario Badge:** Small, solid status badge (emerald, amber, or red) representing the scenario type.
- **Static Headers:** Map headers display read-only scenario titles and subtitles. Clicks on the header overlay are bypassed with `pointer-events: none` to prevent Leaflet viewport drag-blocking.
- **Segmented Control Buttons:** All user selections in the sidebar are controlled using standard button-based horizontal and vertical segmented panels, replacing browser-native select dropdowns.

## 6. Do's and Don'ts

### Do:
- **Do** ensure text on white backgrounds uses Obsidian Text (#0f172a) to exceed WCAG AA contrast ratios (>= 4.5:1).
- **Do** use tonal shifts (Canvas BG #f8fafc vs. Panel BG #ffffff) to distinguish structural zones like sidebars and the map.
- **Do** style active map editor tools with Sky Highlight (#e0f2fe) and a Sky Blue border to denote current active status.
- **Do** provide smooth, brief transitions (150ms to 200ms) for UI state changes and interactive buttons.

### Don't:
- **Don't** use dark mode backgrounds, neon green/cyan text glows, or heavy tech-cyberpunk styling.
- **Don't** use gradient text backgrounds, colored left/right stripes on cards, or heavy drop shadows.
- **Don't** animate vehicles or map nodes on page-load; transitions must be responsive to user interactions only.
- **Don't** allow map tool panels to overlay Leaflet zoom controls or legends without proper padding.
