// @ts-ignore — bundled as data URL by esbuild
import ashleyPortraitUrl from "./assets/ashley-portrait.png";
// @ts-ignore — bundled as data URL by esbuild
import locationEntranceUrl from "./assets/location-entrance-to-darkness.png";
// @ts-ignore — bundled as data URL by esbuild
import locationEntranceGifUrl from "./assets/location-entrance-to-darkness.gif";
// @ts-ignore — bundled as data URL by esbuild
import workshopBgUrl from "./assets/workshop-bg.png";
import { mountWEPViewer, unmountWEPViewer } from "./wep-viewer.js";

/**
 * RSK-uxvs: Vagrant Story fullscreen menu overlay.
 *
 * Triggered by `d` key (Triangle button equivalent).
 * Reads live HP/MP/Risk from PS1 RAM via VagrantStoryRam.
 * Vanilla TS + inline CSS — no framework, IIFE bundle.
 */

import { VagrantStoryRam, readItemName, type PeekFn } from "./ram/index.js";

declare const __RB_VS_MENU_BUILD__: string;

type Host = { peek?: PeekFn };
type VsMenuGlobals = {
  __riskbreakerVsMenuInstalled?: boolean;
  __riskbreakerVsMenuDebug?: boolean;
  __riskbreakerVsMenuKeyHandler?: (e: KeyboardEvent) => void;
};

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
@import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

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
  color: #ffffff;
  font-family: 'Josefin Sans', sans-serif;
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
  font-family: 'Josefin Sans', sans-serif;
  font-size: 8px;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.15);
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
  border-top: 1px solid rgba(255,255,255,0.15);
  border-left: 1px solid rgba(255,255,255,0.15);
}

.vs-tab-trigger.right {
  margin-left: auto;
}

.vs-tab-trigger.right::before {
  left: auto;
  right: 10px;
  border-left: none;
  border-right: 1px solid rgba(255,255,255,0.15);
}

.vs-tab-nav {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 10px;
  letter-spacing: 0.14em;
  color: rgba(255,255,255,0.4);
  padding: 14px 20px;
  cursor: pointer;
  font-weight: 400;
  text-transform: uppercase;
  white-space: nowrap;
  user-select: none;
}

.vs-tab-nav:hover {
  color: rgba(255,255,255,0.7);
}

.vs-tab-nav.active {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #ffffff;
  padding: 14px 24px 14px 20px;
  border-bottom: 2px solid #c8a84a;
  margin-bottom: -1px;
  cursor: default;
}

/* ── Body layout ── */
.vs-body {
  flex: 1;
  display: grid;
  grid-template-columns: 270px 1fr 250px;
  min-height: 0;
  overflow: hidden;
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
  color: rgba(255,255,255,0.7);
  margin-bottom: 0;
  margin-top: 12px;
  font-weight: 400;
}

.vs-section-label:first-child { margin-top: 0; }

.vs-section-value {
  font-size: 11px;
  color: rgba(255,255,255,0.55);
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
  height: 3px;
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
  font-family: 'Josefin Sans', sans-serif;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  font-weight: 700;
}

.vs-stat-value {
  font-size: 10px;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0.01em;
}

.vs-stat-bar-track {
  margin-top: 5px;
  height: 3px;
  background: rgba(255,255,255,0.08);
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
  border: 1px solid rgba(255,255,255,0.15);
  background: #0d0c0a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255,255,255,0.15);
  transition: border-color 0.15s, color 0.15s;
  flex-shrink: 0;
}

.vs-loadout-btn.active {
  border-color: rgba(255,255,255,0.28);
  color: rgba(255,255,255,0.7);
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
  color: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.vs-weapon-name {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.04em;
  flex: 1;
}

.vs-weapon-slot {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 8px;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.5);
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
  border-top: 1px dashed rgba(255,255,255,0.15);
}

.vs-weapon-divider-diamond {
  width: 5px;
  height: 5px;
  background: rgba(255,255,255,0.2);
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
  font-family: 'Josefin Sans', sans-serif;
  font-size: 7px;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  flex-shrink: 0;
}

.vs-bar-track {
  width: 52px;
  height: 2px;
  background: rgba(255,255,255,0.08);
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
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.04em;
}

.vs-weapon-tag-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
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
  border-top: 1px dashed rgba(255,255,255,0.15);
  min-width: 8px;
}

.vs-stat-diamond {
  display: flex;
  align-items: center;
  gap: 4px;
}

.vs-stat-diamond-badge {
  width: 14px;
  height: 14px;
  background: rgba(255,255,255,0.85);
  transform: rotate(45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vs-stat-diamond-badge-inner {
  transform: rotate(-45deg);
  font-family: 'Josefin Sans', sans-serif;
  font-size: 6px;
  font-weight: 700;
  color: #0a0b0d;
  line-height: 1;
  white-space: nowrap;
}

.vs-stat-diamond-name {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 8px;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
}

.vs-stats-label {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 8px;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.45);
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
  font-family: 'Josefin Sans', sans-serif;
  font-size: 7px;
  letter-spacing: 0.14em;
  color: rgba(255,255,255,1);
  text-transform: uppercase;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  gap: 5px;
}

.vs-abilities-col-label.dim {
  color: rgba(255,255,255,0.45);
  border-bottom-color: rgba(255,255,255,0.15);
}

.vs-ability {
  display: grid;
  grid-template-columns: 30px 1fr;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid #161410;
}

.vs-ability:last-child {
  border-bottom: none;
}

.vs-ability-ring {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.22);
  background: #111010;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vs-ability-name {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.vs-ability-desc {
  font-size: 10px;
  color: rgba(255,255,255,0.35);
  text-align: right;
  line-height: 1.4;
  max-width: 110px;
}

/* ── Screens ── */
.vs-screen {
  display: none;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.vs-screen.active {
  display: flex;
}

/* Ashley screen passes its grid through */
.vs-screen[data-screen="ashley"] {
  flex-direction: column;
}

/* ── Equipment screen ── */
.vs-screen-equipment {
  flex-direction: column;
  overflow: hidden;
}

.vs-eq-body {
  flex: 1;
  display: grid;
  grid-template-columns: 220px 1fr 280px;
  min-height: 0;
  overflow: hidden;
}

/* Left panel */
.vs-eq-left {
  border-right: 1px solid rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.vs-eq-loadout-bar {
  display: flex;
  gap: 4px;
  padding: 10px 14px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}

.vs-eq-loadout-btn {
  width: 28px;
  height: 22px;
  border: 1px solid rgba(255,255,255,0.12);
  background: #0d0c0a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-family: 'Josefin Sans', sans-serif;
  font-size: 9px;
  font-weight: 600;
  color: rgba(255,255,255,0.28);
  letter-spacing: 0.05em;
  transition: border-color 0.15s, color 0.15s;
}

.vs-eq-loadout-btn.active {
  border-color: rgba(255,255,255,0.35);
  color: rgba(255,255,255,0.8);
  background: #141210;
}

.vs-eq-slot-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.vs-eq-slot-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 14px;
  cursor: pointer;
  transition: background 0.1s;
}

.vs-eq-slot-row:hover {
  background: rgba(255,255,255,0.04);
}

.vs-eq-slot-row.active {
  background: rgba(255,255,255,0.06);
}

.vs-eq-slot-label {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 8px;
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.28);
  text-transform: uppercase;
  flex-shrink: 0;
  width: 52px;
}

.vs-eq-slot-name {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Centre portrait */
.vs-eq-portrait-col {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}

/* Right detail panel */
.vs-eq-right {
  border-left: 1px solid rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.vs-eq-detail-header {
  padding: 10px 14px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}

.vs-eq-detail-name {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vs-eq-detail-sub {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 8px;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vs-eq-dp-pp-row {
  display: flex;
  gap: 12px;
  margin-top: 6px;
}

.vs-eq-dp-pp-row.hidden {
  display: none;
}

.vs-eq-sub-tabs {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 7px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}

.vs-eq-sub-tab {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 8px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  padding: 0 1px;
  transition: color 0.1s;
}

.vs-eq-sub-tab.active {
  color: #ffffff;
}

.vs-eq-sub-sep {
  font-size: 8px;
  color: rgba(255,255,255,0.2);
  padding: 0 5px;
  user-select: none;
}

.vs-eq-sub-panel {
  display: none;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding: 6px 14px;
}

.vs-eq-sub-panel.active {
  display: flex;
}

.vs-eq-affinity-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.vs-eq-affinity-row:last-child {
  border-bottom: none;
}

.vs-eq-affinity-label {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.28);
  text-transform: uppercase;
}

.vs-eq-affinity-val {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 10px;
  color: #ffffff;
}

.vs-eq-affinity-val.pos { color: rgba(100,200,100,0.9); }
.vs-eq-affinity-val.neg { color: rgba(255,0,0,0.7); }
.vs-eq-affinity-val.zero { color: rgba(255,255,255,0.28); }

.vs-eq-diamond-block {
  padding: 8px 14px 10px;
  border-top: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}

.vs-eq-diamond-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
}

.vs-eq-diamond-label {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 8px;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.28);
  text-transform: uppercase;
  width: 40px;
  flex-shrink: 0;
}

.vs-eq-stat-diff {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 8px;
  letter-spacing: 0.04em;
  min-width: 24px;
  text-align: right;
}
.vs-eq-stat-diff.pos { color: rgba(100,200,100,0.9); }
.vs-eq-stat-diff.neg { color: rgba(255,80,80,0.8); }
.vs-eq-stat-diff.zero { color: rgba(255,255,255,0.28); }

/* Info bar */
.vs-eq-info-bar {
  border-top: 1px solid rgba(255,255,255,0.08);
  padding: 5px 14px;
  font-family: 'Josefin Sans', sans-serif;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.4);
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  font-family: 'Josefin Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
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
  font-family: 'Josefin Sans', sans-serif;
  font-size: 7px;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
  border: 1px solid rgba(255,255,255,0.15);
  padding: 2px 5px;
}

.vs-location-desc {
  font-size: 10px;
  color: rgba(255,255,255,0.4);
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
  font-family: 'Josefin Sans', sans-serif;
  font-size: 8px;
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.15);
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* ── Loading state ── */
.vs-loading {
  color: rgba(255,255,255,0.15);
  font-family: 'Josefin Sans', sans-serif;
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
      <span class="vs-tab-nav active" data-tab="ashley">Ashley</span>
      <span class="vs-tab-nav" data-tab="items">Items</span>
      <span class="vs-tab-nav" data-tab="equipment">Equipment</span>
      <span class="vs-tab-nav" data-tab="leamonde">Lea Monde</span>
      <span class="vs-tab-nav" data-tab="abilities">Abilities</span>
      <span class="vs-tab-nav" data-tab="magick">Magick</span>
      <span class="vs-tab-nav" data-tab="story">Story</span>
      <span class="vs-tab-trigger right">R1</span>
    </div>

    <!-- Ashley screen -->
    <div class="vs-screen active" data-screen="ashley">
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
          <div id="vs-abilities-list"></div>
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

    </div> <!-- /vs-body -->
    </div> <!-- /vs-screen ashley -->

    <!-- Equipment screen -->
    <div class="vs-screen vs-screen-equipment" data-screen="equipment">
      <div class="vs-eq-body">

        <!-- Left: slot list -->
        <div class="vs-eq-left">
          <div class="vs-eq-loadout-bar">
            <div class="vs-eq-loadout-btn active" data-loadout="1">1</div>
            <div class="vs-eq-loadout-btn" data-loadout="2">2</div>
            <div class="vs-eq-loadout-btn" data-loadout="3">3</div>
          </div>
          <div class="vs-eq-slot-list">
            <div class="vs-eq-slot-row active" data-slot="weapon">
              <span class="vs-eq-slot-label">Weapon</span>
              <span class="vs-eq-slot-name" data-slot-name="weapon">—</span>
            </div>
            <div class="vs-eq-slot-row" data-slot="shield">
              <span class="vs-eq-slot-label">Shield</span>
              <span class="vs-eq-slot-name" data-slot-name="shield">—</span>
            </div>
            <div class="vs-eq-slot-row" data-slot="armRight">
              <span class="vs-eq-slot-label">R.Arm</span>
              <span class="vs-eq-slot-name" data-slot-name="armRight">—</span>
            </div>
            <div class="vs-eq-slot-row" data-slot="armLeft">
              <span class="vs-eq-slot-label">L.Arm</span>
              <span class="vs-eq-slot-name" data-slot-name="armLeft">—</span>
            </div>
            <div class="vs-eq-slot-row" data-slot="helm">
              <span class="vs-eq-slot-label">Head</span>
              <span class="vs-eq-slot-name" data-slot-name="helm">—</span>
            </div>
            <div class="vs-eq-slot-row" data-slot="breastplate">
              <span class="vs-eq-slot-label">Body</span>
              <span class="vs-eq-slot-name" data-slot-name="breastplate">—</span>
            </div>
            <div class="vs-eq-slot-row" data-slot="leggings">
              <span class="vs-eq-slot-label">Legs</span>
              <span class="vs-eq-slot-name" data-slot-name="leggings">—</span>
            </div>
            <div class="vs-eq-slot-row" data-slot="accessory">
              <span class="vs-eq-slot-label">Accessory</span>
              <span class="vs-eq-slot-name" data-slot-name="accessory">—</span>
            </div>
          </div>
        </div>

        <!-- Centre: portrait -->
        <div class="vs-eq-portrait-col vs-portrait-col">
          <div class="vs-portrait-bg"></div>
          <img class="vs-portrait" src="${ashleyPortraitUrl}" alt="Ashley Riot" />
        </div>

        <!-- Right: detail panel -->
        <div class="vs-eq-right">
          <div class="vs-eq-detail-header">
            <div class="vs-eq-detail-name" id="vs-eq-detail-name">—</div>
            <div class="vs-eq-detail-sub" id="vs-eq-detail-sub"></div>
            <div class="vs-eq-dp-pp-row" id="vs-eq-dp-pp-row">
              <div class="vs-bar-group">
                <span class="vs-bar-label">DP</span>
                <div class="vs-bar-track"><div class="vs-bar-fill dp" id="vs-eq-dp-bar" style="width:0%"></div></div>
              </div>
              <div class="vs-bar-group">
                <span class="vs-bar-label">PP</span>
                <div class="vs-bar-track"><div class="vs-bar-fill pp" id="vs-eq-pp-bar" style="width:0%"></div></div>
              </div>
            </div>
          </div>

          <div class="vs-eq-sub-tabs">
            <span class="vs-eq-sub-tab active" data-subtab="class">Class</span>
            <span class="vs-eq-sub-sep">/</span>
            <span class="vs-eq-sub-tab" data-subtab="affinity">Affinity</span>
            <span class="vs-eq-sub-sep">/</span>
            <span class="vs-eq-sub-tab" data-subtab="type">Type</span>
            <span class="vs-eq-sub-sep vs-eq-model-sep">/</span>
            <span class="vs-eq-sub-tab vs-eq-model-tab" data-subtab="model">Model</span>
          </div>

          <!-- CLASS sub-panel -->
          <div class="vs-eq-sub-panel active" data-subtab-panel="class">
            <div class="vs-eq-affinity-row">
              <span class="vs-eq-affinity-label">Human</span>
              <span class="vs-eq-affinity-val zero" data-class-idx="0">—</span>
            </div>
            <div class="vs-eq-affinity-row">
              <span class="vs-eq-affinity-label">Beast</span>
              <span class="vs-eq-affinity-val zero" data-class-idx="1">—</span>
            </div>
            <div class="vs-eq-affinity-row">
              <span class="vs-eq-affinity-label">Undead</span>
              <span class="vs-eq-affinity-val zero" data-class-idx="2">—</span>
            </div>
            <div class="vs-eq-affinity-row">
              <span class="vs-eq-affinity-label">Phantom</span>
              <span class="vs-eq-affinity-val zero" data-class-idx="4">—</span>
            </div>
            <div class="vs-eq-affinity-row">
              <span class="vs-eq-affinity-label">Dragon</span>
              <span class="vs-eq-affinity-val zero" data-class-idx="3">—</span>
            </div>
            <div class="vs-eq-affinity-row">
              <span class="vs-eq-affinity-label">Evil</span>
              <span class="vs-eq-affinity-val zero" data-class-idx="5">—</span>
            </div>
          </div>

          <!-- AFFINITY sub-panel (indices: Physical=0,Air=1,Fire=2,Earth=3,Water=4,Light=5,Dark=6) -->
          <div class="vs-eq-sub-panel" data-subtab-panel="affinity">
            <div class="vs-eq-affinity-row">
              <span class="vs-eq-affinity-label">Physical</span>
              <span class="vs-eq-affinity-val zero" data-affinity-idx="0">—</span>
            </div>
            <div class="vs-eq-affinity-row">
              <span class="vs-eq-affinity-label">Air</span>
              <span class="vs-eq-affinity-val zero" data-affinity-idx="1">—</span>
            </div>
            <div class="vs-eq-affinity-row">
              <span class="vs-eq-affinity-label">Fire</span>
              <span class="vs-eq-affinity-val zero" data-affinity-idx="2">—</span>
            </div>
            <div class="vs-eq-affinity-row">
              <span class="vs-eq-affinity-label">Earth</span>
              <span class="vs-eq-affinity-val zero" data-affinity-idx="3">—</span>
            </div>
            <div class="vs-eq-affinity-row">
              <span class="vs-eq-affinity-label">Water</span>
              <span class="vs-eq-affinity-val zero" data-affinity-idx="4">—</span>
            </div>
            <div class="vs-eq-affinity-row">
              <span class="vs-eq-affinity-label">Light</span>
              <span class="vs-eq-affinity-val zero" data-affinity-idx="5">—</span>
            </div>
            <div class="vs-eq-affinity-row">
              <span class="vs-eq-affinity-label">Dark</span>
              <span class="vs-eq-affinity-val zero" data-affinity-idx="6">—</span>
            </div>
          </div>

          <!-- TYPE sub-panel -->
          <div class="vs-eq-sub-panel" data-subtab-panel="type">
            <div class="vs-eq-affinity-row">
              <span class="vs-eq-affinity-label">Blunt</span>
              <span class="vs-eq-affinity-val zero" data-type-idx="0">—</span>
            </div>
            <div class="vs-eq-affinity-row">
              <span class="vs-eq-affinity-label">Edged</span>
              <span class="vs-eq-affinity-val zero" data-type-idx="1">—</span>
            </div>
            <div class="vs-eq-affinity-row">
              <span class="vs-eq-affinity-label">Piercing</span>
              <span class="vs-eq-affinity-val zero" data-type-idx="2">—</span>
            </div>
          </div>

          <div
            class="vs-eq-sub-panel"
            data-subtab-panel="model"
            id="vs-eq-model-panel"
            style="position:fixed;left:50%;top:52%;transform:translate(-50%,-50%);width:460px;height:300px;background:rgba(10,10,26,0.8);border:1px solid #2a2a4a;border-radius:6px;overflow:hidden;z-index:9050;pointer-events:none"
          ></div>

          <!-- Stats block — diamonds show equipped total, diff shows this item's contribution -->
          <div class="vs-eq-diamond-block">
            <div class="vs-eq-diamond-row">
              <span class="vs-eq-diamond-label">STR</span>
              <div class="vs-stat-diamond">
                <div class="vs-stat-diamond-badge"><div class="vs-stat-diamond-badge-inner" id="vs-eq-str-val">—</div></div>
              </div>
              <div class="vs-stat-dashes"></div>
              <span class="vs-eq-stat-diff zero" id="vs-eq-str-diff"></span>
            </div>
            <div class="vs-eq-diamond-row">
              <span class="vs-eq-diamond-label">INT</span>
              <div class="vs-stat-diamond">
                <div class="vs-stat-diamond-badge"><div class="vs-stat-diamond-badge-inner" id="vs-eq-int-val">—</div></div>
              </div>
              <div class="vs-stat-dashes"></div>
              <span class="vs-eq-stat-diff zero" id="vs-eq-int-diff"></span>
            </div>
            <div class="vs-eq-diamond-row">
              <span class="vs-eq-diamond-label">AGL</span>
              <div class="vs-stat-diamond">
                <div class="vs-stat-diamond-badge"><div class="vs-stat-diamond-badge-inner" id="vs-eq-agl-val">—</div></div>
              </div>
              <div class="vs-stat-dashes"></div>
              <span class="vs-eq-stat-diff zero" id="vs-eq-agl-diff"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Info bar -->
      <div class="vs-eq-info-bar" id="vs-eq-info-bar">—</div>
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

const ABILITY_BTNS = [SVG_CIRCLE, SVG_TRIANGLE, SVG_SQUARE, SVG_CROSS];

async function refreshAbilities(root: HTMLElement): Promise<void> {
  const ram = getRam();
  const list = root.querySelector<HTMLElement>("#vs-abilities-list");
  if (!list) return;

  if (!ram) {
    list.innerHTML = "";
    return;
  }

  try {
    const skills = await ram.skills.all();
    const chain = skills.filter(s => s.type === "battle_ability" && s.learned);

    if (chain.length === 0) {
      list.innerHTML = "";
      return;
    }

    list.innerHTML = chain.map((s, i) => `
      <div class="vs-ability">
        ${btnRing(ABILITY_BTNS[i % ABILITY_BTNS.length]!)}
        <span class="vs-ability-name">${s.name}</span>
      </div>
    `).join("");
  } catch {
    // worker not active
  }
}

// ── Equipment screen ──────────────────────────────────────────────────────────

// Slot key → RAM method name
const EQ_SLOTS: Array<{ key: string; label: string; isWeaponOrShield: boolean }> = [
  { key: "weapon",      label: "Weapon",    isWeaponOrShield: true  },
  { key: "shield",      label: "Shield",    isWeaponOrShield: true  },
  { key: "armRight",    label: "R.Arm",     isWeaponOrShield: false },
  { key: "armLeft",     label: "L.Arm",     isWeaponOrShield: false },
  { key: "helm",        label: "Head",      isWeaponOrShield: false },
  { key: "breastplate", label: "Body",      isWeaponOrShield: false },
  { key: "leggings",    label: "Legs",      isWeaponOrShield: false },
  { key: "accessory",   label: "Accessory", isWeaponOrShield: false },
];

// Map slot key → EquipData stored on last refresh
const _eqSlotData = new Map<string, import("./ram/index.js").EquipData>();
// Map slot key → item name read from RAM (when the in-game menu has loaded the table)
const _eqRamItemName = new Map<string, string>();
let _eqWeaponName = "—";
let _eqStrEqp = 0, _eqIntEqp = 0, _eqAglEqp = 0;
let _eqWeaponCatId = 0;
let _eqRange = 0;
let _eqModelAutoShown = false;

// Loadout persistence — loadout 0 = RAM (live), 1 & 2 = localStorage
let _activeLoadout = 0;
type SavedLoadout = Record<string, { materialName: string; label: string } | null>;
function _loadoutKey(idx: number): string { return `vs-loadout-${idx + 1}`; }
function _loadSavedLoadout(idx: number): SavedLoadout {
  try { return JSON.parse(localStorage.getItem(_loadoutKey(idx)) ?? "{}") as SavedLoadout; }
  catch { return {}; }
}
const _savedLoadouts: [SavedLoadout, SavedLoadout] = [_loadSavedLoadout(1), _loadSavedLoadout(2)];

/**
 * Fallback item names keyed by itemNameIndex (u16 at equip_data $0).
 * Used when the transient RAM table (loaded from CD only while in-game menu is open) is unavailable.
 * Keys confirmed from live RAM; names from DataCrystal armours_list + accessories_list.
 */
const ITEM_NAME_FALLBACK: Record<number, string> = {
  // Shields 0x7F–0x8E
  0x7F:"Buckler",0x80:"Pelta Shield",0x81:"Targe",0x82:"Quad Shield",0x83:"Circle Shield",
  0x84:"Tower Shield",0x85:"Spiked Shield",0x86:"Round Shield",0x87:"Kite Shield",
  0x88:"Casserole Shield",0x89:"Heater Shield",0x8A:"Oval Shield",0x8B:"Knight Shield",
  0x8C:"Hoplite Shield",0x8D:"Jazeraint Shield",0x8E:"Dread Shield",
  // Helms 0x8F–0x9E
  0x8F:"Bandana",0x90:"Bear Mask",0x91:"Wizard Hat",0x92:"Bone Helm",0x93:"Chain Coif",
  0x94:"Spangenhelm",0x95:"Cabasset",0x96:"Sallet",0x97:"Barbut",0x98:"Basinet",
  0x99:"Armet",0x9A:"Close Helm",0x9B:"Burgonet",0x9C:"Hoplite Helm",
  0x9D:"Jazeraint Helm",0x9E:"Dread Helm",
  // Body 0x9F–0xAE
  0x9F:"Jerkin",0xA0:"Hauberk",0xA1:"Wizard Robe",0xA2:"Cuirass",0xA3:"Banded Mail",
  0xA4:"Ring Mail",0xA5:"Chain Mail",0xA6:"Breastplate",0xA7:"Segmentata",
  0xA8:"Scale Armor",0xA9:"Brigandine",0xAA:"Plate Mail",0xAB:"Fluted Armor",
  0xAC:"Hoplite Armor",0xAD:"Jazeraint Armor",0xAE:"Dread Armor",
  // Legs 0xAF–0xBE
  0xAF:"Sandals",0xB0:"Boots",0xB1:"Long Boots",0xB2:"Cuisse",0xB3:"Light Greave",
  0xB4:"Ring Leggings",0xB5:"Chain Leggings",0xB6:"Fusskampf",0xB7:"Poleyn",
  0xB8:"Jambeau",0xB9:"Missaglia",0xBA:"Plate Leggings",0xBB:"Fluted Leggings",
  0xBC:"Hoplite Leggings",0xBD:"Jazeraint Leggings",0xBE:"Dread Leggings",
  // Arms 0xBF–0xCE
  0xBF:"Bandage",0xC0:"Leather Glove",0xC1:"Reinforced Glove",0xC2:"Knuckles",
  0xC3:"Ring Sleeve",0xC4:"Chain Sleeve",0xC5:"Gauntlet",0xC6:"Vambrace",
  0xC7:"Plate Glove",0xC8:"Rondanche",0xC9:"Tilt Glove",0xCA:"Freiturnier",
  0xCB:"Fluted Glove",0xCC:"Hoplite Glove",0xCD:"Jazeraint Glove",0xCE:"Dread Glove",
  // Accessories 0xDF–0xFD
  0xDF:"Rood Necklace",0xE0:"Rune Earrings",0xE1:"Lionhead",0xE2:"Rusted Nails",
  0xE3:"Sylphid Ring",0xE4:"Marduk",0xE5:"Salamander Ring",0xE6:"Tamulis Tongue",
  0xE7:"Gnome Bracelet",0xE8:"Palolo's Ring",0xE9:"Undine Bracelet",0xEA:"Talian Ring",
  0xEB:"Agrias's Balm",0xEC:"Kadesh Ring",0xED:"Agrippa's Choker",0xEE:"Diadra's Earring",
  0xEF:"Titan's Ring",0xF0:"Lau Fei's Armlet",0xF1:"Swan Song",0xF2:"Pushpaka",
  0xF3:"Edgar's Earrings",0xF4:"Cross Choker",0xF5:"Ghost Hound",0xF6:"Beaded Anklet",
  0xF7:"Dragonhead",0xF8:"Faufnir's Tear",0xF9:"Agales's Chain",0xFA:"Balam Ring",
  0xFB:"Nimje Coif",0xFC:"Morgan's Nails",0xFD:"Marlene's Ring",
};

/** Weapon category id (from blade.category in equip_data) → {type, hand}. */
const WEAPON_CAT: Record<number, { type: string; hand: string }> = {
  2:  { type: "Edged",    hand: "One-Handed" }, // Short Sword
  3:  { type: "Edged",    hand: "Two-Handed" }, // Long Sword
  4:  { type: "Edged",    hand: "Two-Handed" }, // Great Sword
  5:  { type: "Edged",    hand: "One-Handed" }, // Dagger
  6:  { type: "Blunt",    hand: "One-Handed" }, // Mace
  7:  { type: "Blunt",    hand: "Two-Handed" }, // Staff
  8:  { type: "Blunt",    hand: "Two-Handed" }, // Axe
  9:  { type: "Piercing", hand: "Two-Handed" }, // Bow
  10: { type: "Piercing", hand: "Two-Handed" }, // Crossbow
  11: { type: "Piercing", hand: "Two-Handed" }, // Polearm
  12: { type: "Blunt",    hand: "One-Handed" }, // Hand-to-Hand
  13: { type: "Piercing", hand: "One-Handed" }, // Missile
};

// Material colors (CSS hex) for VS aesthetic
const MATERIAL_COLORS: Record<number, string> = {
  0: "",
  1: "#c8a86b", // Wood — tan
  2: "#c4965a", // Leather — amber
  3: "#cd7f32", // Bronze — copper
  4: "#8a9aaa", // Iron — steel
  5: "#7090c0", // Hagane — blue-steel
  6: "#ccd8e0", // Silver — bright silver
  7: "#e8c850", // Damascus — gold
};

function _eqMaterialColor(materialIndex: number): string {
  return MATERIAL_COLORS[materialIndex] ?? "";
}

/** Real item name — RAM table first, static fallback second, slot label last resort. */
function _eqItemName(slotKey: string, data: import("./ram/index.js").EquipData | undefined, slotLabel: string): string {
  if (!data?.equipped) return "—";
  if (slotKey === "weapon") return _eqWeaponName;
  return _eqRamItemName.get(slotKey) ?? ITEM_NAME_FALLBACK[data.itemNameIndex] ?? slotLabel;
}

function _eqSetAffinityVal(el: HTMLElement, val: number): void {
  el.textContent = val === 0 ? "0" : (val > 0 ? `+${val}` : `${val}`);
  el.className = "vs-eq-affinity-val" + (val > 0 ? " pos" : val < 0 ? " neg" : " zero");
}

function _eqSetDiff(el: HTMLElement, val: number): void {
  el.textContent = val === 0 ? "" : (val > 0 ? `+${val}` : `${val}`);
  el.className = "vs-eq-stat-diff" + (val > 0 ? " pos" : val < 0 ? " neg" : " zero");
}

function _eqUpdateDetail(
  screen: HTMLElement,
  slotKey: string,
): void {
  const data = _eqSlotData.get(slotKey);
  const slot = EQ_SLOTS.find(s => s.key === slotKey);
  const isWeaponOrShield = slot?.isWeaponOrShield ?? false;

  // Header name — use real item name; tint by material
  const nameEl = screen.querySelector<HTMLElement>("#vs-eq-detail-name");
  if (nameEl) {
    nameEl.textContent = _eqItemName(slotKey, data, slot?.label ?? slotKey);
    nameEl.style.color = data?.equipped ? (_eqMaterialColor(data.materialIndex) || "") : "";
  }

  // Sub-line: material · damage type · cost
  const subEl = screen.querySelector<HTMLElement>("#vs-eq-detail-sub");
  if (subEl) {
    if (data?.equipped) {
      const parts: string[] = [];
      if (data.materialName !== "—") parts.push(data.materialName);
      if (slotKey === "weapon") {
        const cat = WEAPON_CAT[_eqWeaponCatId];
        if (cat) parts.push(`${cat.type}/${cat.hand}`);
        parts.push(`Range ${_eqRange}`);
        if (data.costValue > 0) parts.push(`${data.statsCost} ${data.costValue}`);
      } else if (isWeaponOrShield) {
        if (data.gemSlots > 0) parts.push(`${data.gemSlots} gem${data.gemSlots > 1 ? "s" : ""}`);
      }
      subEl.textContent = parts.join(" · ");
    } else {
      subEl.textContent = "";
    }
  }

  // DP/PP bars — show DP for any equipped item with durability; PP is weapon/shield only
  const dpPpRow = screen.querySelector<HTMLElement>("#vs-eq-dp-pp-row");
  if (dpPpRow) {
    const showDp = data?.equipped && (data.dpMax > 0 || isWeaponOrShield);
    if (showDp) {
      dpPpRow.classList.remove("hidden");
      const dpBar = screen.querySelector<HTMLElement>("#vs-eq-dp-bar");
      const ppBar = screen.querySelector<HTMLElement>("#vs-eq-pp-bar");
      if (data && data.equipped) {
        if (dpBar) dpBar.style.width = data.dpMax > 0 ? `${Math.round((data.dpCur / data.dpMax) * 100)}%` : "0%";
        if (ppBar) ppBar.style.width = isWeaponOrShield && data.ppMax > 0 ? `${Math.round((data.ppCur / data.ppMax) * 100)}%` : "0%";
      } else {
        if (dpBar) dpBar.style.width = "0%";
        if (ppBar) ppBar.style.width = "0%";
      }
    } else {
      dpPpRow.classList.add("hidden");
    }
  }

  // CLASS sub-panel
  screen.querySelectorAll<HTMLElement>("[data-class-idx]").forEach(el => {
    const idx = parseInt(el.dataset.classIdx ?? "0", 10);
    const val = data?.equipped ? (data.classes[idx] ?? 0) : 0;
    _eqSetAffinityVal(el, val);
    if (!data?.equipped) el.textContent = "—";
  });

  // AFFINITY sub-panel
  screen.querySelectorAll<HTMLElement>("[data-affinity-idx]").forEach(el => {
    const idx = parseInt(el.dataset.affinityIdx ?? "0", 10);
    const val = data?.equipped ? (data.affinities[idx] ?? 0) : 0;
    _eqSetAffinityVal(el, val);
    if (!data?.equipped) el.textContent = "—";
  });

  // TYPE sub-panel — weapon type (Blunt/Edged/Piercing) lives in the grip, not the blade
  const typeData = slotKey === "weapon" ? _eqSlotData.get("weaponGrip") : data;
  screen.querySelectorAll<HTMLElement>("[data-type-idx]").forEach(el => {
    const idx = parseInt(el.dataset.typeIdx ?? "0", 10);
    const val = typeData?.equipped ? (typeData.types[idx] ?? 0) : 0;
    _eqSetAffinityVal(el, val);
    if (!typeData?.equipped) el.textContent = "—";
  });

  // Diamond stat block — badge = total equipped, diff = this item's contribution
  const getEl = (id: string) => screen.querySelector<HTMLElement>(`#${id}`);
  const strVal = getEl("vs-eq-str-val"), intVal = getEl("vs-eq-int-val"), aglVal = getEl("vs-eq-agl-val");
  const strDiff = getEl("vs-eq-str-diff"), intDiff = getEl("vs-eq-int-diff"), aglDiff = getEl("vs-eq-agl-diff");
  if (strVal) strVal.textContent = `${_eqStrEqp}`;
  if (intVal) intVal.textContent = `${_eqIntEqp}`;
  if (aglVal) aglVal.textContent = `${_eqAglEqp}`;
  if (strDiff) _eqSetDiff(strDiff, data?.equipped ? data.str : 0);
  if (intDiff) _eqSetDiff(intDiff, data?.equipped ? data.int : 0);
  if (aglDiff) _eqSetDiff(aglDiff, data?.equipped ? data.agi : 0);

  // MODEL sub-panel — weapon only
  const modelPanel = screen.querySelector<HTMLElement>("#vs-eq-model-panel");
  const modelTab = screen.querySelector<HTMLElement>(".vs-eq-model-tab");
  const modelSep = screen.querySelector<HTMLElement>(".vs-eq-model-sep");
  const isWeapon = slotKey === "weapon";
  if (modelTab) modelTab.style.display = isWeapon ? "" : "none";
  if (modelSep) modelSep.style.display = isWeapon ? "" : "none";

  if (!modelPanel) return;
  if (!isWeapon) {
    _eqModelAutoShown = false;
    unmountWEPViewer(modelPanel);
    return;
  }
  const wepFile = data?.equipped ? data.wepFile : undefined;
  if (typeof wepFile !== "number" || wepFile <= 0) {
    unmountWEPViewer(modelPanel);
    return;
  }

  // Auto-show model once per open cycle so it's discoverable.
  if (!_eqModelAutoShown && !modelPanel.classList.contains("active")) {
    screen.querySelectorAll(".vs-eq-sub-tab").forEach(t => t.classList.remove("active"));
    modelTab?.classList.add("active");
    screen.querySelectorAll<HTMLElement>(".vs-eq-sub-panel").forEach(p => {
      if (p.dataset.subtabPanel === "model") p.classList.add("active");
      else p.classList.remove("active");
    });
    _eqModelAutoShown = true;
  }

  if (!modelPanel.classList.contains("active")) {
    unmountWEPViewer(modelPanel);
    return;
  }

  void mountWEPViewer(modelPanel, wepFile);
}


function _eqGetActiveSlot(screen: HTMLElement): string {
  const row = screen.querySelector<HTMLElement>(".vs-eq-slot-row.active");
  return row?.dataset.slot ?? "weapon";
}

const SLOT_CLASS_NAMES: Record<string, string> = {
  weapon:      "Weapon",
  shield:      "Shield",
  armRight:    "Armor",
  armLeft:     "Armor",
  helm:        "Armor",
  breastplate: "Armor",
  leggings:    "Armor",
  accessory:   "Accessory",
};

function _eqUpdateInfoBar(screen: HTMLElement, slotKey: string): void {
  const bar = screen.querySelector<HTMLElement>("#vs-eq-info-bar");
  if (!bar) return;
  const data = _eqSlotData.get(slotKey);
  const slot = EQ_SLOTS.find(s => s.key === slotKey);
  if (!data?.equipped) {
    bar.textContent = slot ? `Slot: ${slot.label}` : "—";
    return;
  }
  const className = SLOT_CLASS_NAMES[slotKey] ?? slot?.label ?? slotKey;
  if (slotKey === "weapon") {
    const cat = WEAPON_CAT[_eqWeaponCatId];
    const typeStr = cat ? ` · ${cat.type}/${cat.hand}` : "";
    bar.textContent = `Class: ${className}  ·  ${data.materialName}${typeStr}`;
  } else if (slot?.isWeaponOrShield) {
    bar.textContent = `Class: ${className}  ·  ${data.materialName}`;
  } else {
    bar.textContent = `Class: ${className}  ·  ${data.materialName}`;
  }
}

function initEquipmentScreen(root: HTMLElement): void {
  const screen = root.querySelector<HTMLElement>('.vs-screen[data-screen="equipment"]');
  if (!screen) return;

  // Loadout buttons — 1 = live RAM, 2 & 3 = localStorage slots
  screen.querySelectorAll<HTMLElement>(".vs-eq-loadout-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.loadout ?? "1", 10) - 1; // 0-based
      _activeLoadout = idx;
      screen.querySelectorAll(".vs-eq-loadout-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // For saved loadouts (idx 1 & 2), render slot names from localStorage
      if (idx >= 1) {
        const saved = _savedLoadouts[idx - 1];
        const slotLabels: Record<string, string> = {
          weapon: "Weapon", shield: "Shield", armRight: "R.Arm", armLeft: "L.Arm",
          helm: "Helm", breastplate: "Chest", leggings: "Legs", accessory: "Acc.",
        };
        Object.entries(slotLabels).forEach(([slot, label]) => {
          const el = screen.querySelector<HTMLElement>(`[data-slot-name="${slot}"]`);
          if (!el) return;
          const entry = saved[slot];
          if (entry) {
            const mat = entry.materialName !== "—" ? entry.materialName : "";
            el.textContent = mat ? `${mat} ${label}` : label;
          } else {
            el.textContent = "—";
          }
        });
      }
    });
  });

  // Slot rows
  screen.querySelectorAll<HTMLElement>(".vs-eq-slot-row").forEach(row => {
    row.addEventListener("click", () => {
      screen.querySelectorAll(".vs-eq-slot-row").forEach(r => r.classList.remove("active"));
      row.classList.add("active");
      const slotKey = row.dataset.slot ?? "weapon";
      _eqUpdateDetail(screen, slotKey);
      _eqUpdateInfoBar(screen, slotKey);
    });
  });

  // Sub-tabs
  screen.querySelectorAll<HTMLElement>(".vs-eq-sub-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.subtab;
      if (!target) return;
      screen.querySelectorAll(".vs-eq-sub-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      screen.querySelectorAll<HTMLElement>(".vs-eq-sub-panel").forEach(p => {
        if (p.dataset.subtabPanel === target) {
          p.classList.add("active");
        } else {
          p.classList.remove("active");
        }
      });
      _eqUpdateDetail(screen, _eqGetActiveSlot(screen));
    });
  });
}

async function refreshEquipmentScreen(root: HTMLElement): Promise<void> {
  const screen = root.querySelector<HTMLElement>('.vs-screen[data-screen="equipment"]');
  if (!screen) return;

  const ram = getRam();
  if (!ram) return;

  try {
    const [
      weaponName,
      blade,
      grip,
      shield,
      armRight,
      armLeft,
      helm,
      breastplate,
      leggings,
      accessory,
      strEquipped,
      intEquipped,
      aglEquipped,
      rangeVal,
    ] = await Promise.all([
      ram.ashley.equip.weaponName(),
      ram.ashley.equip.weaponBlade(),
      ram.ashley.equip.weaponGrip(),
      ram.ashley.equip.shield(),
      ram.ashley.equip.armRight(),
      ram.ashley.equip.armLeft(),
      ram.ashley.equip.helm(),
      ram.ashley.equip.breastplate(),
      ram.ashley.equip.leggings(),
      ram.ashley.equip.accessory(),
      ram.ashley.strEquipped(),
      ram.ashley.intEquipped(),
      ram.ashley.aglEquipped(),
      ram.ashley.range(),
    ]);

    _eqWeaponName = weaponName;
    _eqStrEqp = strEquipped;
    _eqIntEqp = intEquipped;
    _eqAglEqp = aglEquipped;
    _eqWeaponCatId = blade.category;
    _eqRange = rangeVal;
    _eqSlotData.set("weapon",      blade);
    _eqSlotData.set("weaponGrip",  grip);
    _eqSlotData.set("shield",      shield);
    _eqSlotData.set("armRight",    armRight);
    _eqSlotData.set("armLeft",     armLeft);
    _eqSlotData.set("helm",        helm);
    _eqSlotData.set("breastplate", breastplate);
    _eqSlotData.set("leggings",    leggings);
    _eqSlotData.set("accessory",   accessory);

    // Best-effort: fetch item names from the transient RAM table (only available when in-game menu is open)
    await Promise.all([
      ["shield", shield], ["armRight", armRight], ["armLeft", armLeft],
      ["helm", helm], ["breastplate", breastplate], ["leggings", leggings], ["accessory", accessory],
    ].map(async ([key, data]) => {
      const d = data as import("./ram/index.js").EquipData;
      if (!d.equipped) return;
      const name = await ram.itemName(d.itemNameIndex);
      if (name) _eqRamItemName.set(key as string, name);
    }));

    // Update slot name elements using display name helper (only when viewing live RAM loadout)
    if (_activeLoadout === 0) {
      const slotLabels: Record<string, string> = {
        weapon: "Weapon", shield: "Shield", armRight: "R.Arm", armLeft: "L.Arm",
        helm: "Helm", breastplate: "Chest", leggings: "Legs", accessory: "Acc.",
      };
      Object.entries(slotLabels).forEach(([slot, label]) => {
        const el = screen.querySelector<HTMLElement>(`[data-slot-name="${slot}"]`);
        if (!el) return;
        const d = _eqSlotData.get(slot);
        el.textContent = _eqItemName(slot, d, label);
        el.style.color = d?.equipped ? (_eqMaterialColor(d.materialIndex) || "") : "";
      });
    }

    const activeSlot = _eqGetActiveSlot(screen);
    _eqUpdateDetail(screen, activeSlot);
    _eqUpdateInfoBar(screen, activeSlot);
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

// ── Tab switching ─────────────────────────────────────────────────────────────

function initTabs(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(".vs-tab-nav").forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      if (!target) return;

      root.querySelectorAll(".vs-tab-nav").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      root.querySelectorAll<HTMLElement>(".vs-screen").forEach(s => s.classList.remove("active"));
      const screen = root.querySelector<HTMLElement>(`.vs-screen[data-screen="${target}"]`);
      screen?.classList.add("active");

      if (target !== "equipment") {
        const modelPanel = root.querySelector<HTMLElement>("#vs-eq-model-panel");
        if (modelPanel) _safeUnmountWepViewer(modelPanel);
      }
    });
  });
}

function _safeUnmountWepViewer(panel: HTMLElement): void {
  try {
    unmountWEPViewer(panel);
  } catch (err) {
    // Never let viewer disposal break menu input/pause lifecycle.
    console.warn("[vs-menu] Failed to unmount WEP viewer:", err);
  }
}

// ── Open / close ─────────────────────────────────────────────────────────────

function openMenu(root: HTMLElement): void {
  pcsxPause();
  root.classList.add("vs-open");
  void root.offsetWidth; // force reflow so opacity transition fires
  root.style.opacity = "1";
  void refreshStats(root);
  void refreshEquipment(root);
  void refreshAbilities(root);
  void refreshEquipmentScreen(root);
}

function closeMenu(root: HTMLElement): void {
  _eqModelAutoShown = false;
  const modelPanel = root.querySelector<HTMLElement>("#vs-eq-model-panel");
  if (modelPanel) _safeUnmountWepViewer(modelPanel);
  try {
    root.style.opacity = "0";
    pcsxResume();
    const finalizeClose = () => root.classList.remove("vs-open");
    root.addEventListener("transitionend", () => {
      finalizeClose();
    }, { once: true });
    // Fallback: if transition event does not fire, do not trap the UI.
    setTimeout(finalizeClose, 250);
  } catch {
    // Fail safe: never trap user in menu if transition lifecycle fails.
    root.classList.remove("vs-open");
    pcsxResume();
  }
}

// ── Install ───────────────────────────────────────────────────────────────────

function install(): void {
  const g = globalThis as VsMenuGlobals;
  // Hard singleton: replace any prior key handler to avoid split open-state listeners.
  if (g.__riskbreakerVsMenuKeyHandler) {
    document.removeEventListener("keydown", g.__riskbreakerVsMenuKeyHandler, true);
  }

  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  // Remove a stale root from any previous install before creating a new one.
  const staleRoot = document.getElementById("vs-menu-root");
  if (staleRoot) staleRoot.remove();
  const root = buildMenu();
  document.body.appendChild(root);
  initTabs(root);
  initEquipmentScreen(root);

  console.info(`[vs-menu] build ${__RB_VS_MENU_BUILD__}`);

  let open = false;
  const debug = () => (globalThis as VsMenuGlobals).__riskbreakerVsMenuDebug === true;
  const isToggleMenuKey = (e: KeyboardEvent): boolean => {
    // Prefer physical key code so CapsLock/keyboard layout/case do not break toggle.
    if (e.code === "KeyF") return true;
    return e.key.toLowerCase() === "f";
  };

  // Capture ALL keys while menu is open so nothing leaks to the game.
  const onKeyDown = (e: KeyboardEvent) => {
    if (debug() && (isToggleMenuKey(e) || e.key === "Escape")) {
      console.debug("[vs-menu] keydown", { key: e.key, code: e.code, repeat: e.repeat, open });
    }
    if (open) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if ((isToggleMenuKey(e) && !e.repeat) || e.key === "Escape") {
        open = false;
        if (debug()) console.debug("[vs-menu] closing");
        closeMenu(root);
      }
      return;
    }

    // Menu closed — only intercept D to open
    if (isToggleMenuKey(e) && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      open = true;
      if (debug()) console.debug("[vs-menu] opening");
      openMenu(root);
    }
  };
  g.__riskbreakerVsMenuKeyHandler = onKeyDown;
  g.__riskbreakerVsMenuInstalled = true;
  document.addEventListener("keydown", onKeyDown, true); // capture phase so we intercept before the game's listeners
}

install();
