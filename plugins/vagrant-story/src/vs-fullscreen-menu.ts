// @ts-ignore — bundled as data URL by esbuild
import ashleyPortraitUrl from "./assets/ashley-portrait.png";
// @ts-ignore — bundled as data URL by esbuild
import locationEntranceUrl from "./assets/location-entrance-to-darkness.png";
// @ts-ignore — bundled as data URL by esbuild
import locationEntranceGifUrl from "./assets/location-entrance-to-darkness.gif";

/**
 * RSK-uxvs: Vagrant Story fullscreen menu overlay.
 *
 * Triggered by `d` key (Triangle button equivalent).
 * Reads live HP/MP/Risk from PS1 RAM via VagrantStoryRam.
 * Vanilla TS + inline CSS — no framework, IIFE bundle.
 */

import { VagrantStoryRam, type PeekFn } from "./ram/index.js";

type Host = { peek?: PeekFn };

function getHost(): Host | undefined {
  return (globalThis as { __riskbreakerEmulatorHost?: Host }).__riskbreakerEmulatorHost;
}

function getRam(): VagrantStoryRam | undefined {
  const host = getHost();
  if (!host?.peek) return undefined;
  return new VagrantStoryRam(host.peek);
}

// ── CSS ───────────────────────────────────────────────────────────────────────

// Inline PS button SVGs (colors match PS controller)
const SVG_CROSS    = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" width="14" height="14"><line stroke="#7CB2E8" stroke-width="2" x1="2" y1="2" x2="13" y2="13"/><line stroke="#7CB2E8" stroke-width="2" x1="13" y1="2" x2="2" y2="13"/></svg>`;
const SVG_SQUARE   = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" width="14" height="14"><rect x="2" y="2" width="11" height="11" fill="none" stroke="#FF69F8" stroke-width="2"/></svg>`;
const SVG_CIRCLE   = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" width="14" height="14"><circle cx="7.5" cy="7.5" r="5.5" fill="none" stroke="#FF6666" stroke-width="2"/></svg>`;
const SVG_TRIANGLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 15" width="14" height="12"><path fill="#40E2A0" d="m9 3.991 5.191 8.998H3.808L9 3.991M9-.011l-8.654 15h17.309L9-.011z"/></svg>`;

// PS button icon inside a grey ring — used for ability rows
function btnRing(svg: string): string {
  return `<span class="vs-ability-ring">${svg}</span>`;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

#vs-menu-root {
  position: fixed;
  top: 0;
  left: 0;
  /* zoom: 1.5 enlarges content; set logical size to viewport/1.5 so zoomed result = 100vw/vh */
  width: calc(100vw / 1.5);
  height: calc(100vh / 1.5);
  zoom: 1.5;
  z-index: 9000;
  background: #0a0b0d;
  color: #d4c8a8;
  font-family: 'Crimson Text', Georgia, serif;
  display: none;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.2s ease;
}

#vs-menu-root.vs-open {
  display: flex;
}

#vs-menu-scaled {
  display: contents;
}

/* ── Tab bar ── */
.vs-tabs {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid #252018;
  padding: 0 0;
  gap: 0;
  flex-shrink: 0;
  position: relative;
}

/* L1/R1: corner indicators */
.vs-tab-trigger {
  font-family: 'Cinzel', serif;
  font-size: 8px;
  letter-spacing: 0.08em;
  color: #3a3428;
  padding: 0 16px;
  display: flex;
  align-items: flex-end;
  padding-bottom: 10px;
  white-space: nowrap;
  user-select: none;
  position: relative;
}

.vs-tab-trigger::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 10px;
  width: 10px;
  height: 10px;
  border-top: 1px solid #3a3428;
  border-left: 1px solid #3a3428;
}

.vs-tab-trigger.right {
  margin-left: auto;
}

.vs-tab-trigger.right::before {
  left: auto;
  right: 10px;
  border-left: none;
  border-right: 1px solid #3a3428;
}

.vs-tab-nav {
  font-family: 'Cinzel', serif;
  font-size: 10px;
  letter-spacing: 0.14em;
  color: #3a3428;
  padding: 14px 20px;
  cursor: default;
  font-weight: 400;
  text-transform: uppercase;
  white-space: nowrap;
}

.vs-tab-name {
  font-family: 'Cinzel', serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #d4c8a8;
  padding: 14px 24px 14px 20px;
  text-transform: uppercase;
  border-bottom: 2px solid #c8a84a;
  margin-bottom: -1px;
  white-space: nowrap;
}

/* ── Body layout ── */
.vs-body {
  flex: 1;
  display: grid;
  grid-template-columns: 270px 1fr 250px;
  min-height: 0;
}

/* ── Left column ── */
.vs-left {
  padding: 16px 14px 16px 20px;
  border-right: 1px solid #1a1810;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}

.vs-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.vs-section-label {
  font-size: 11px;
  letter-spacing: 0.02em;
  color: #c8bea0;
  margin-bottom: 0;
  margin-top: 12px;
  font-weight: 400;
}

.vs-section-label:first-child { margin-top: 0; }

.vs-section-value {
  font-size: 11px;
  color: #7a6e54;
  letter-spacing: 0.04em;
}

.vs-section-value-right {
  font-size: 11px;
  color: #c8a030;
  letter-spacing: 0.04em;
  text-align: right;
}

.vs-full-bar-track {
  width: 100%;
  height: 2px;
  background: #1e1c14;
  margin-top: 4px;
  margin-bottom: 10px;
}

.vs-full-bar-fill {
  height: 100%;
  transition: width 0.4s ease;
}
.vs-full-bar-fill.rank     { background: #c8bea0; width: 33%; }
.vs-full-bar-fill.cond     { background: #c8a030; width: 50%; }

.vs-divider {
  height: 1px;
  background: #1a1810;
  margin: 10px 0;
}

/* ── Inline stats row ── */
.vs-stats-inline {
  display: flex;
  align-items: baseline;
  gap: 0;
  margin-top: 8px;
}

.vs-stat-group {
  flex: 1;
}

.vs-stat-group-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.vs-stat-label {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: #c8bea0;
  text-transform: uppercase;
  font-weight: 600;
}

.vs-stat-value {
  font-size: 11px;
  color: #7a6e54;
  letter-spacing: 0.01em;
}

.vs-stat-bar-track {
  margin-top: 5px;
  height: 2px;
  background: #1e1c14;
}

.vs-stat-bar-fill {
  height: 100%;
  transition: width 0.4s ease;
}

.vs-stat-bar-fill.hp   { background: #5aaa5a; }
.vs-stat-bar-fill.mp   { background: #5a7ab8; }
.vs-stat-bar-fill.risk { background: #c85a2a; }

/* ── Loadout panel ── */
.vs-loadout {
  display: flex;
  gap: 0;
  min-height: 0;
}

.vs-loadout-tabs {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
  padding-right: 0;
}

.vs-loadout-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #2a2518;
  background: #0d0c0a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #3a3428;
  transition: border-color 0.15s, color 0.15s;
  flex-shrink: 0;
}

.vs-loadout-btn.active {
  border-color: #5a5040;
  color: #c8bea0;
  background: #141210;
}

.vs-loadout-content {
  flex: 1;
  padding-left: 10px;
  border-left: 1px solid #1e1c14;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
}

.vs-equip-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 0 2px;
}

.vs-equip-icon {
  color: #c8bea0;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.vs-weapon-name {
  font-family: 'Cinzel', serif;
  font-size: 12px;
  font-weight: 700;
  color: #d4c8a8;
  letter-spacing: 0.04em;
  flex: 1;
}

.vs-weapon-slot {
  font-family: 'Cinzel', serif;
  font-size: 8px;
  letter-spacing: 0.1em;
  color: #4a4030;
  text-transform: uppercase;
  white-space: nowrap;
}

.vs-weapon-divider {
  display: flex;
  align-items: center;
  margin: 2px 0 4px;
  gap: 0;
}

.vs-weapon-divider-line {
  flex: 1;
  height: 0;
  border-top: 1px dashed #252018;
}

.vs-weapon-divider-diamond {
  width: 5px;
  height: 5px;
  background: #3a3428;
  transform: rotate(45deg);
  flex-shrink: 0;
  margin-left: 3px;
}

.vs-weapon-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.vs-bar-group {
  display: flex;
  align-items: center;
  gap: 5px;
}

.vs-bar-label {
  font-family: 'Cinzel', serif;
  font-size: 7px;
  letter-spacing: 0.1em;
  color: #4a4030;
  text-transform: uppercase;
  flex-shrink: 0;
}

.vs-bar-track {
  width: 52px;
  height: 2px;
  background: #1e1c14;
}

.vs-bar-fill {
  height: 100%;
}
.vs-bar-fill.dp { background: #5aaa5a; width: 65%; }
.vs-bar-fill.pp { background: #5a7ab8; width: 45%; }

.vs-weapon-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 8px;
  color: #5a5040;
  letter-spacing: 0.04em;
}

.vs-weapon-tag-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #5a5040;
}

/* ── Statistics row ── */
.vs-stats-diamonds {
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: 4px;
}

.vs-stat-diamond-wrap {
  display: flex;
  align-items: center;
  gap: 0;
}

.vs-stat-dashes {
  flex: 1;
  height: 0;
  border-top: 1px dashed #1e1c14;
  min-width: 8px;
}

.vs-stat-diamond {
  display: flex;
  align-items: center;
  gap: 4px;
}

.vs-stat-diamond-badge {
  width: 26px;
  height: 26px;
  background: #d4c8a8;
  transform: rotate(45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vs-stat-diamond-badge-inner {
  transform: rotate(-45deg);
  font-family: 'Cinzel', serif;
  font-size: 9px;
  font-weight: 700;
  color: #0a0b0d;
  line-height: 1;
  white-space: nowrap;
}

.vs-stat-diamond-name {
  font-family: 'Cinzel', serif;
  font-size: 8px;
  letter-spacing: 0.1em;
  color: #3a3428;
  text-transform: uppercase;
}

.vs-stats-label {
  font-family: 'Cinzel', serif;
  font-size: 8px;
  letter-spacing: 0.1em;
  color: #3a3428;
  text-transform: uppercase;
  margin-left: 4px;
  white-space: nowrap;
}

/* ── Ability lists ── */
.vs-abilities-section {
  margin-top: 8px;
}

.vs-abilities-headers {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-bottom: 6px;
}

.vs-abilities-col-label {
  font-family: 'Cinzel', serif;
  font-size: 7px;
  letter-spacing: 0.14em;
  color: #5a5040;
  text-transform: uppercase;
  padding-bottom: 5px;
  border-bottom: 1px solid #3a3428;
  display: flex;
  align-items: center;
  gap: 5px;
}

.vs-abilities-col-label.dim {
  color: #2e2820;
  border-bottom-color: #1e1c14;
}

.vs-ability {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid #161410;
}

.vs-ability:last-child {
  border-bottom: none;
}

.vs-ability-ring {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #3a3830;
  background: #111010;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vs-ability-name {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  font-weight: 600;
  color: #c8bea0;
  letter-spacing: 0.04em;
  flex: 1;
}

.vs-ability-desc {
  font-size: 9px;
  color: #5a5040;
  text-align: right;
  line-height: 1.4;
  max-width: 120px;
}

/* ── Centre: portrait ── */
.vs-portrait-col {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}

.vs-portrait-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 45% at 50% 100%, #1a140a 0%, #0a0b0d 65%);
}

.vs-portrait {
  position: relative;
  z-index: 1;
  height: 95%;
  object-fit: contain;
  object-position: bottom center;
  /* fade all edges into the dark background */
  mask-image: linear-gradient(to top, transparent 0%, black 6%, black 88%, transparent 100%),
              linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
  mask-composite: intersect;
  -webkit-mask-image: linear-gradient(to top, transparent 0%, black 6%, black 88%, transparent 100%),
                      linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
  -webkit-mask-composite: source-in;
}

/* ── Right column: location ── */
.vs-right {
  border-left: 1px solid #1a1810;
  padding: 16px 18px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.vs-location-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #0d0f14;
  overflow: hidden;
  cursor: default;
  flex-shrink: 0;
}

.vs-location-thumb img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.75;
  transition: opacity 0.35s ease;
}

.vs-location-thumb .vs-location-gif {
  opacity: 0;
}

.vs-location-thumb:hover .vs-location-still {
  opacity: 0;
}

.vs-location-thumb:hover .vs-location-gif {
  opacity: 0.85;
}

.vs-location-title {
  font-family: 'Cinzel', serif;
  font-size: 13px;
  font-weight: 600;
  color: #d4c8a8;
  letter-spacing: 0.07em;
  line-height: 1.3;
}

.vs-location-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 5px;
}

.vs-location-tag {
  font-family: 'Cinzel', serif;
  font-size: 7px;
  letter-spacing: 0.1em;
  color: #4a4030;
  text-transform: uppercase;
  border: 1px solid #252016;
  padding: 2px 5px;
}

.vs-location-desc {
  font-size: 10px;
  color: #4a4030;
  line-height: 1.65;
}

/* ── Footer hint ── */
.vs-footer {
  border-top: 1px solid #1a1810;
  padding: 7px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  flex-shrink: 0;
}

.vs-hint {
  font-family: 'Cinzel', serif;
  font-size: 8px;
  letter-spacing: 0.12em;
  color: #3a3020;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* ── Loading state ── */
.vs-loading {
  color: #3a3020;
  font-family: 'Cinzel', serif;
  font-size: 8px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
`;

// ── HTML skeleton ─────────────────────────────────────────────────────────────

function buildMenu(): HTMLElement {
  const root = document.createElement("div");
  root.id = "vs-menu-root";
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Vagrant Story Menu");

  root.innerHTML = `<div id="vs-menu-scaled">
    <!-- Tab bar -->
    <div class="vs-tabs">
      <span class="vs-tab-trigger">L1</span>
      <span class="vs-tab-name">Ashley</span>
      <span class="vs-tab-nav" data-tab="items">Items</span>
      <span class="vs-tab-nav" data-tab="equipment">Equipment</span>
      <span class="vs-tab-nav" data-tab="leamonde">Lea Monde</span>
      <span class="vs-tab-nav" data-tab="abilities">Abilities</span>
      <span class="vs-tab-nav" data-tab="magick">Magick</span>
      <span class="vs-tab-nav" data-tab="story">Story</span>
      <span class="vs-tab-trigger right">R1</span>
    </div>

    <!-- Body -->
    <div class="vs-body">

      <!-- Left: stats -->
      <div class="vs-left">
        <!-- Rank -->
        <div class="vs-meta-row" style="margin-top:0">
          <span class="vs-section-label" style="margin:0">Rank: Normal Agent</span>
          <span class="vs-section-value">165,000 • 500,000</span>
        </div>
        <div class="vs-full-bar-track"><div class="vs-full-bar-fill rank"></div></div>

        <!-- Overall Condition -->
        <div class="vs-meta-row">
          <span class="vs-section-label" style="margin:0">Overall Condition</span>
          <span class="vs-section-value-right" id="vs-condition">—</span>
        </div>
        <div class="vs-full-bar-track"><div class="vs-full-bar-fill cond" id="vs-cond-bar"></div></div>

        <!-- HP / MP / Risk inline -->
        <div class="vs-stats-inline">
          <div class="vs-stat-group">
            <div class="vs-stat-group-row">
              <span class="vs-stat-label">HP</span>
              <span class="vs-stat-value" id="vs-hp-val"><span class="vs-loading">…</span></span>
            </div>
            <div class="vs-stat-bar-track"><div class="vs-stat-bar-fill hp" id="vs-hp-bar" style="width:100%"></div></div>
          </div>
          <div style="width:16px"></div>
          <div class="vs-stat-group">
            <div class="vs-stat-group-row">
              <span class="vs-stat-label">MP</span>
              <span class="vs-stat-value" id="vs-mp-val"><span class="vs-loading">…</span></span>
            </div>
            <div class="vs-stat-bar-track"><div class="vs-stat-bar-fill mp" id="vs-mp-bar" style="width:100%"></div></div>
          </div>
          <div style="width:16px"></div>
          <div class="vs-stat-group">
            <div class="vs-stat-group-row">
              <span class="vs-stat-label">Risk</span>
              <span class="vs-stat-value" id="vs-risk-val"><span class="vs-loading">…</span></span>
            </div>
            <div class="vs-stat-bar-track"><div class="vs-stat-bar-fill risk" id="vs-risk-bar" style="width:0%"></div></div>
          </div>
        </div>

        <div class="vs-divider"></div>

        <!-- Loadout panel -->
        <div class="vs-loadout">
          <!-- 3 loadout selector buttons -->
          <div class="vs-loadout-tabs">
            <div class="vs-loadout-btn active" title="Loadout 1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6.5 2 2 6.5l5 5-3.5 3.5L9 21l10-10L13.5 5l3.5-3.5zm0 2.83 2.17 2.17-3.17 3.17L3.33 8z"/></svg>
            </div>
            <div class="vs-loadout-btn" title="Loadout 2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M15.5 2.1 13.41 4.19l1.4 1.4-7.37 7.38-1.41-1.41L4 13.56l1.41 1.41L4 16.38V20h3.62l1.41-1.41L10.44 20l2.01-2.01-1.41-1.41 7.37-7.37 1.41 1.41L21.9 8.5z"/></svg>
            </div>
            <div class="vs-loadout-btn" title="Loadout 3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M10.5 1.5c-1.2 0-2.4.3-3.5.9L4.5 0 3 1.5l2.1 2.1C4 4.8 3 6.6 3 8.5c0 4.1 3.4 7.5 7.5 7.5S18 12.6 18 8.5 14.6 1.5 10.5 1.5zm0 13C7.5 14.5 5 12 5 9s2.5-5.5 5.5-5.5S16 6 16 9s-2.5 5.5-5.5 5.5z"/></svg>
            </div>
          </div>

          <!-- Active loadout content -->
          <div class="vs-loadout-content">
            <!-- Weapon -->
            <div class="vs-equip-row">
              <span class="vs-equip-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M6.5 2 2 6.5l5 5-3.5 3.5L9 21l10-10L13.5 5l3.5-3.5zm0 2.83 2.17 2.17-3.17 3.17L3.33 8z"/></svg></span>
              <span id="vs-weapon-name" class="vs-weapon-name">Fandango</span>
              <span class="vs-weapon-slot">Main (R)</span>
            </div>
            <div class="vs-weapon-divider"><div class="vs-weapon-divider-line"></div><div class="vs-weapon-divider-diamond"></div></div>
            <div id="vs-weapon-stats" class="vs-weapon-stats">
              <div class="vs-bar-group"><span class="vs-bar-label">DP</span><div class="vs-bar-track"><div id="vs-weapon-dp-bar" class="vs-bar-fill dp"></div></div></div>
              <div class="vs-bar-group"><span class="vs-bar-label">PP</span><div class="vs-bar-track"><div id="vs-weapon-pp-bar" class="vs-bar-fill pp"></div></div></div>
              <div id="vs-weapon-mat" class="vs-weapon-tag"><div class="vs-weapon-tag-dot"></div><div class="vs-weapon-tag-dot"></div><div class="vs-weapon-tag-dot"></div> Bronze</div>
              <div class="vs-weapon-tag" style="margin-left:4px">/// Edged</div>
            </div>

            <!-- Shield -->
            <div class="vs-equip-row">
              <span class="vs-equip-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5z"/></svg></span>
              <span id="vs-shield-name" class="vs-weapon-name">Buckler</span>
              <span class="vs-weapon-slot">Offhand (L)</span>
            </div>
            <div class="vs-weapon-divider"><div class="vs-weapon-divider-line"></div><div class="vs-weapon-divider-diamond"></div></div>
            <div id="vs-shield-stats" class="vs-weapon-stats">
              <div class="vs-bar-group"><span class="vs-bar-label">DP</span><div class="vs-bar-track"><div id="vs-shield-dp-bar" class="vs-bar-fill dp" style="width:80%"></div></div></div>
              <div class="vs-bar-group"><span class="vs-bar-label">PP</span><div class="vs-bar-track"><div id="vs-shield-pp-bar" class="vs-bar-fill pp" style="width:20%"></div></div></div>
              <div id="vs-shield-mat" class="vs-weapon-tag"><div class="vs-weapon-tag-dot"></div><div class="vs-weapon-tag-dot"></div><div class="vs-weapon-tag-dot"></div> Wood</div>
            </div>

            <!-- Statistics -->
            <div class="vs-stats-diamonds">
              <div class="vs-stat-diamond">
                <div class="vs-stat-diamond-badge"><div class="vs-stat-diamond-badge-inner">110</div></div>
                <span class="vs-stat-diamond-name">STR</span>
              </div>
              <div class="vs-stat-dashes"></div>
              <div class="vs-stat-diamond">
                <div class="vs-stat-diamond-badge"><div class="vs-stat-diamond-badge-inner">102</div></div>
                <span class="vs-stat-diamond-name">INT</span>
              </div>
              <div class="vs-stat-dashes"></div>
              <div class="vs-stat-diamond">
                <div class="vs-stat-diamond-badge"><div class="vs-stat-diamond-badge-inner">96</div></div>
                <span class="vs-stat-diamond-name">AGL</span>
              </div>
              <div class="vs-stat-dashes"></div>
              <span class="vs-stats-label">Statistics</span>
            </div>
          </div>
        </div>

        <div class="vs-divider"></div>

        <!-- Abilities -->
        <div class="vs-abilities-section">
          <div class="vs-abilities-headers">
            <div class="vs-abilities-col-label">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10" fill="currentColor" style="opacity:0.7"><path d="M6.5 2 2 6.5l5 5-3.5 3.5L9 21l10-10L13.5 5l3.5-3.5L11.5 0zm0 2.83 2.17 2.17L5.5 10.17 3.33 8z"/></svg>
              Chain Abilities
            </div>
            <div class="vs-abilities-col-label dim">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10" fill="currentColor" style="opacity:0.4"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5z"/></svg>
              Defense Abilities
            </div>
          </div>
          <div class="vs-ability">
            ${btnRing(SVG_CIRCLE)}
            <span class="vs-ability-name">Heavy Shot</span>
            <span class="vs-ability-desc">Deals 70% damage to foe.</span>
          </div>
          <div class="vs-ability">
            ${btnRing(SVG_TRIANGLE)}
            <span class="vs-ability-name">Snake Venom</span>
            <span class="vs-ability-desc">Poisons foe.</span>
          </div>
          <div class="vs-ability">
            ${btnRing(SVG_SQUARE)}
            <span class="vs-ability-name">Temper</span>
            <span class="vs-ability-desc">Deals 40% damage to foe and repairs small amount weapon DP.</span>
          </div>
        </div>
      </div>

      <!-- Centre: portrait -->
      <div class="vs-portrait-col">
        <div class="vs-portrait-bg"></div>
        <img class="vs-portrait" src="${ashleyPortraitUrl}" alt="Ashley Riot" />
      </div>

      <!-- Right: location -->
      <div class="vs-right">
        <div class="vs-location-thumb">
          <img class="vs-location-still" src="${locationEntranceUrl}" alt="Entrance to Darkness" />
          <img class="vs-location-gif" src="${locationEntranceGifUrl}" alt="Entrance to Darkness animated" />
        </div>
        <div>
          <div class="vs-location-title">Entrance to Darkness</div>
          <div class="vs-location-meta">
            <span class="vs-location-tag">Ch 1</span>
            <span class="vs-location-tag">Catacombs</span>
            <span class="vs-location-tag">11:26 A.M.</span>
          </div>
        </div>
        <div class="vs-location-desc">
          Ashley and Callo arrive on the outskirts of Lea Monde. Abandoned after
          a great earthquake, the only way in is through an underground network
          of catacombs, starting with the city's prized wine cellars.
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="vs-footer">
      <span class="vs-hint">${SVG_TRIANGLE} Exit Menu</span>
    </div>
  </div>`;

  return root;
}

// ── Live stat update ──────────────────────────────────────────────────────────

async function refreshStats(root: HTMLElement): Promise<void> {
  const ram = getRam();
  if (!ram) return;

  try {
    const { hpCur, hpMax, mpCur, mpMax, risk } = await ram.ashley.vitals();

    const hpPct   = hpMax > 0 ? Math.round((hpCur / hpMax) * 100) : 0;
    const mpPct   = mpMax > 0 ? Math.round((mpCur / mpMax) * 100) : 0;
    const riskPct = Math.min(risk, 100);

    const hpBar   = root.querySelector<HTMLElement>("#vs-hp-bar");
    const mpBar   = root.querySelector<HTMLElement>("#vs-mp-bar");
    const riskBar = root.querySelector<HTMLElement>("#vs-risk-bar");

    if (hpBar)   hpBar.style.width   = `${hpPct}%`;
    if (mpBar)   mpBar.style.width   = `${mpPct}%`;
    if (riskBar) riskBar.style.width = `${riskPct}%`;

    const set = (id: string, text: string) => {
      const el = root.querySelector<HTMLElement>(id);
      if (el) el.textContent = text;
    };

    set("#vs-hp-val",   `${hpCur} • ${hpMax}`);
    set("#vs-mp-val",   `${mpCur} • ${mpMax}`);
    set("#vs-risk-val", `${risk}%`);

    const cond = hpPct > 75 ? "Good" : hpPct > 40 ? "Average" : hpPct > 15 ? "Poor" : "Critical";
    set("#vs-condition", cond);
    const condBar = root.querySelector<HTMLElement>("#vs-cond-bar");
    if (condBar) condBar.style.width = `${hpPct}%`;
  } catch {
    // worker not active yet — leave loading indicators
  }
}

async function refreshEquipment(root: HTMLElement): Promise<void> {
  const ram = getRam();
  if (!ram) return;

  try {
    const [weaponName, blade, shield] = await Promise.all([
      ram.ashley.equip.weaponName(),
      ram.ashley.equip.weaponBlade(),
      ram.ashley.equip.shield(),
    ]);

    const sel = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`);
    const dots = `<div class="vs-weapon-tag-dot"></div><div class="vs-weapon-tag-dot"></div><div class="vs-weapon-tag-dot"></div>`;

    const weaponNameEl = sel("vs-weapon-name");
    if (weaponNameEl) weaponNameEl.textContent = weaponName || "—";

    const wDpBar = sel("vs-weapon-dp-bar");
    const wPpBar = sel("vs-weapon-pp-bar");
    const wMatEl = sel("vs-weapon-mat");
    if (wDpBar) wDpBar.style.width = blade.dpMax > 0 ? `${Math.round((blade.dpCur / blade.dpMax) * 100)}%` : "0%";
    if (wPpBar) wPpBar.style.width = blade.ppMax > 0 ? `${Math.round((blade.ppCur / blade.ppMax) * 100)}%` : "0%";
    if (wMatEl) wMatEl.innerHTML = `${dots} ${blade.materialName}`;

    const shieldNameEl = sel("vs-shield-name");
    const sDpBar = sel("vs-shield-dp-bar");
    const sPpBar = sel("vs-shield-pp-bar");
    const sMatEl = sel("vs-shield-mat");

    if (shield.equipped) {
      if (sDpBar) sDpBar.style.width = shield.dpMax > 0 ? `${Math.round((shield.dpCur / shield.dpMax) * 100)}%` : "0%";
      if (sPpBar) sPpBar.style.width = shield.ppMax > 0 ? `${Math.round((shield.ppCur / shield.ppMax) * 100)}%` : "0%";
      if (sMatEl) sMatEl.innerHTML = `${dots} ${shield.materialName}`;
    } else {
      if (shieldNameEl) shieldNameEl.textContent = "—";
      if (sDpBar) sDpBar.style.width = "0%";
      if (sPpBar) sPpBar.style.width = "0%";
    }
  } catch {
    // worker not active — leave current values
  }
}

type PcsxGlobals = {
  __riskbreakerPcsxPause?: () => void;
  __riskbreakerPcsxResume?: () => void;
};

function pcsxPause(): void {
  (globalThis as PcsxGlobals).__riskbreakerPcsxPause?.();
}

function pcsxResume(): void {
  (globalThis as PcsxGlobals).__riskbreakerPcsxResume?.();
}

// ── Open / close ─────────────────────────────────────────────────────────────

function openMenu(root: HTMLElement): void {
  pcsxPause();
  root.classList.add("vs-open");
  void root.offsetWidth; // force reflow so opacity transition fires
  root.style.opacity = "1";
  void refreshStats(root);
  void refreshEquipment(root);
}

function closeMenu(root: HTMLElement): void {
  root.style.opacity = "0";
  root.addEventListener("transitionend", () => {
    root.classList.remove("vs-open");
    pcsxResume();
  }, { once: true });
}

// ── Install ───────────────────────────────────────────────────────────────────

function install(): void {
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = buildMenu();
  document.body.appendChild(root);

  let open = false;

  // Capture ALL keys while menu is open so nothing leaks to the game.
  document.addEventListener("keydown", (e) => {
    if (open) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.key === "d" || e.key === "Escape") {
        open = false;
        closeMenu(root);
      }
      return;
    }

    // Menu closed — only intercept D to open
    if (e.key === "d" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      open = true;
      openMenu(root);
    }
  }, true); // capture phase so we intercept before the game's listeners
}

install();
