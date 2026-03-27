// @ts-expect-error — bundled as data URL by esbuild
import ashleyPortraitUrl from "./assets/ashley-portrait.png";
// @ts-expect-error — bundled as data URL by esbuild
import locationEntranceUrl from "./assets/location-entrance-to-darkness.png";
// @ts-expect-error — bundled as data URL by esbuild
import locationEntranceGifUrl from "./assets/location-entrance-to-darkness.gif";
import { mountWEPStaticViewer, unmountWEPViewer } from "./wep-viewer.js";

/**
 * RSK-uxvs: Vagrant Story fullscreen menu overlay.
 *
 * Triggered by `d` key (Triangle button equivalent).
 * Reads live HP/MP/Risk from PS1 RAM via VagrantStoryRam.
 * Vanilla TS + inline CSS — no framework, IIFE bundle.
 */

import { readEquipData, VagrantStoryRam, type EquipData, type PeekFn } from "./ram/index.js";

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

.vs-eq-loadout-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 14px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}

.vs-eq-apply-preset-btn {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid rgba(200, 168, 74, 0.4);
  background: rgba(20, 18, 16, 0.95);
  color: #c8a84a;
  cursor: pointer;
  transition: opacity 0.15s, border-color 0.15s;
}

.vs-eq-apply-preset-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  border-color: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.35);
}

.vs-eq-loadout-hint {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 8px;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.38);
  line-height: 1.35;
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
  color: rgba(255,255,255,0.55);
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

.vs-eq-sub-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 14px;
  padding: 6px 14px 10px;
  flex: 1;
  overflow-y: auto;
}

.vs-eq-sub-col-title {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 8px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.8);
  margin-bottom: 4px;
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
  color: rgba(255,255,255,0.6);
  text-transform: uppercase;
}

.vs-eq-affinity-val {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 10px;
  color: rgba(255,255,255,0.6);
}

.vs-eq-affinity-row-best .vs-eq-affinity-label {
  color: #e6cf7a;
}

.vs-eq-affinity-row-best .vs-eq-affinity-val {
  color: #e6cf7a;
  font-weight: 600;
}

.vs-eq-diamond-block {
  padding: 10px 14px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}

.vs-eq-right .vs-stats-diamonds {
  margin-top: 0;
}

.vs-eq-stat-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1px;
  min-height: 14px;
}

.vs-eq-stat-meta .vs-eq-stat-diff {
  font-size: 7px;
  letter-spacing: 0.04em;
  line-height: 1.1;
  min-width: 0;
  text-align: left;
}

/* ── Equipment: combat summary panel ── */
.vs-eq-combat-panel {
  padding: 10px 14px 8px;
  border-top: 1px solid rgba(255,255,255,0.08);
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 18px;
  row-gap: 6px;
}

.vs-eq-combat-heading {
  grid-column: 1 / -1;
  font-family: 'Josefin Sans', sans-serif;
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.75);
}

.vs-eq-combat-col-label {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 8px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.6);
  margin-bottom: 2px;
}

.vs-eq-combat-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.vs-eq-combat-stat-label {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 8px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.7);
}

.vs-eq-combat-stat-value {
  font-family: 'Josefin Sans', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #ffffff;
  min-width: 38px;
  text-align: right;
}

.vs-eq-combat-stat-value.dim {
  color: rgba(255,255,255,0.5);
}

.vs-eq-combat-def-block {
  min-width: 0;
  align-self: start;
}

.vs-eq-def-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 3px;
  font-family: 'Josefin Sans', sans-serif;
}

.vs-eq-def-table thead th {
  font-size: 7px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
  text-align: right;
  padding: 2px 0 4px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.vs-eq-def-table thead th:first-child {
  text-align: left;
  padding-left: 0;
  width: 38%;
}

.vs-eq-def-table tbody td {
  padding: 3px 0 2px;
  text-align: right;
  vertical-align: baseline;
}

.vs-eq-def-table tbody td.vs-eq-def-limb {
  text-align: left;
  font-size: 8px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.62);
  padding-right: 6px;
}

.vs-eq-def-table .vs-eq-def-phys,
.vs-eq-def-table .vs-eq-def-mag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #ffffff;
  padding-left: 8px;
}

.vs-eq-def-table .vs-eq-def-phys.dim,
.vs-eq-def-table .vs-eq-def-mag.dim {
  color: rgba(255,255,255,0.45);
}

.vs-eq-combat-agility {
  grid-column: 1 / -1;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
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
 .vs-eq-stat-diff.zero { color: rgba(255,255,255,0.5); }

/* Info bar */
.vs-eq-info-bar {
  border-top: 1px solid rgba(255,255,255,0.08);
  padding: 5px 14px;
  font-family: 'Josefin Sans', sans-serif;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.75);
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
            <div class="vs-loadout-btn active" data-loadout="1" title="Live — matches game save (peek)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6.5 2 2 6.5l5 5-3.5 3.5L9 21l10-10L13.5 5l3.5-3.5zm0 2.83 2.17 2.17-3.17 3.17L3.33 8z"/></svg>
            </div>
            <div class="vs-loadout-btn" data-loadout="2" title="Preset 2 — localStorage vs-loadout-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M15.5 2.1 13.41 4.19l1.4 1.4-7.37 7.38-1.41-1.41L4 13.56l1.41 1.41L4 16.38V20h3.62l1.41-1.41L10.44 20l2.01-2.01-1.41-1.41 7.37-7.37 1.41 1.41L21.9 8.5z"/></svg>
            </div>
            <div class="vs-loadout-btn" data-loadout="3" title="Preset 3 — localStorage vs-loadout-3">
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
            <div class="vs-eq-loadout-btn active" data-loadout="1" title="Live — game save">1</div>
            <div class="vs-eq-loadout-btn" data-loadout="2" title="Preset 2 (localStorage)">2</div>
            <div class="vs-eq-loadout-btn" data-loadout="3" title="Preset 3 (localStorage)">3</div>
          </div>
          <div class="vs-eq-loadout-actions">
            <button type="button" class="vs-eq-apply-preset-btn" id="vs-eq-apply-preset" disabled>Use preset on Ashley</button>
            <span class="vs-eq-loadout-hint">1 = live game · 2–3 = browse presets · apply copies mock gear to live overlay (no RAM poke).</span>
          </div>
          <div class="vs-eq-slot-list">
            <div class="vs-eq-slot-row" data-slot="weapon">
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

          <!-- Combat summary: current derived stats (base + equipment) -->
          <div class="vs-eq-combat-panel">
            <div class="vs-eq-combat-heading">Combat Profile</div>

            <div>
              <div class="vs-eq-combat-col-label">Attack</div>
              <div class="vs-eq-combat-row">
                <span class="vs-eq-combat-stat-label">STR</span>
                <span id="vs-eq-atk-str" class="vs-eq-combat-stat-value dim">—</span>
              </div>
              <div class="vs-eq-combat-row">
                <span class="vs-eq-combat-stat-label">INT</span>
                <span id="vs-eq-atk-int" class="vs-eq-combat-stat-value dim">—</span>
              </div>
            </div>

            <div class="vs-eq-combat-def-block">
              <div class="vs-eq-combat-col-label">Defence</div>
              <table class="vs-eq-def-table" aria-label="Defence by limb">
                <thead>
                  <tr>
                    <th scope="col"></th>
                    <th scope="col">STR</th>
                    <th scope="col">INT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr data-def-limb="armRight">
                    <td class="vs-eq-def-limb">R.ARM</td>
                    <td class="vs-eq-def-phys dim">—</td>
                    <td class="vs-eq-def-mag dim">—</td>
                  </tr>
                  <tr data-def-limb="armLeft">
                    <td class="vs-eq-def-limb">L.ARM</td>
                    <td class="vs-eq-def-phys dim">—</td>
                    <td class="vs-eq-def-mag dim">—</td>
                  </tr>
                  <tr data-def-limb="helm">
                    <td class="vs-eq-def-limb">HEAD</td>
                    <td class="vs-eq-def-phys dim">—</td>
                    <td class="vs-eq-def-mag dim">—</td>
                  </tr>
                  <tr data-def-limb="breastplate">
                    <td class="vs-eq-def-limb">BODY</td>
                    <td class="vs-eq-def-phys dim">—</td>
                    <td class="vs-eq-def-mag dim">—</td>
                  </tr>
                  <tr data-def-limb="leggings">
                    <td class="vs-eq-def-limb">LEGS</td>
                    <td class="vs-eq-def-phys dim">—</td>
                    <td class="vs-eq-def-mag dim">—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="vs-eq-combat-agility">
              <span class="vs-eq-combat-stat-label">Agility</span>
              <span id="vs-eq-agl" class="vs-eq-combat-stat-value dim">—</span>
            </div>
          </div>
        </div>

        <!-- Centre: equipment canvas (no Ashley portrait on this screen) -->
        <div class="vs-eq-portrait-col vs-portrait-col">
          <div class="vs-portrait-bg"></div>
        </div>

        <!-- Right: detail panel -->
        <div class="vs-eq-right">
          <div class="vs-eq-diamond-block">
            <div class="vs-stats-diamonds">
              <div class="vs-stat-diamond">
                <div class="vs-stat-diamond-badge"><div class="vs-stat-diamond-badge-inner" id="vs-eq-str-val">—</div></div>
                <div class="vs-eq-stat-meta">
                  <span class="vs-stat-diamond-name">STR</span>
                  <span class="vs-eq-stat-diff zero" id="vs-eq-str-diff"></span>
                </div>
              </div>
              <div class="vs-stat-dashes"></div>
              <div class="vs-stat-diamond">
                <div class="vs-stat-diamond-badge"><div class="vs-stat-diamond-badge-inner" id="vs-eq-int-val">—</div></div>
                <div class="vs-eq-stat-meta">
                  <span class="vs-stat-diamond-name">INT</span>
                  <span class="vs-eq-stat-diff zero" id="vs-eq-int-diff"></span>
                </div>
              </div>
              <div class="vs-stat-dashes"></div>
              <div class="vs-stat-diamond">
                <div class="vs-stat-diamond-badge"><div class="vs-stat-diamond-badge-inner" id="vs-eq-agl-val">—</div></div>
                <div class="vs-eq-stat-meta">
                  <span class="vs-stat-diamond-name">AGL</span>
                  <span class="vs-eq-stat-diff zero" id="vs-eq-agl-diff"></span>
                </div>
              </div>
              <div class="vs-stat-dashes"></div>
              <span class="vs-stats-label">Statistics</span>
            </div>
          </div>

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

          <div class="vs-eq-sub-grid">
            <!-- CLASS column -->
            <div>
              <div class="vs-eq-sub-col-title">Class</div>
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

            <!-- AFFINITY column (indices: Physical=0,Air=1,Fire=2,Earth=3,Water=4,Light=5,Dark=6) -->
            <div>
              <div class="vs-eq-sub-col-title">Affinity</div>
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

            <!-- TYPE column -->
            <div>
              <div class="vs-eq-sub-col-title">Type</div>
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
  if (_activeLoadout !== 0) return;

  try {
    const [weaponNameRam, bladeRam, shieldRam] = await Promise.all([
      ram.ashley.equip.weaponName(),
      ram.ashley.equip.weaponBlade(),
      ram.ashley.equip.shield(),
    ]);
    const weaponName = _eqLocalWeaponOverride?.displayName ?? weaponNameRam;
    const blade = _eqLocalWeaponOverride?.data ?? bladeRam;
    const shield = _eqLocalShieldOverride?.data ?? shieldRam;

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
      if (shieldNameEl && _eqLocalShieldOverride) shieldNameEl.textContent = _eqLocalShieldOverride.displayName;
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

/** Ashley strip: live RAM (plus mock overrides) or preset labels only. */
async function refreshAshleyLoadoutStrip(root: HTMLElement): Promise<void> {
  if (_activeLoadout === 0) {
    await refreshEquipment(root);
    return;
  }
  _reloadSavedLoadoutsFromStorage();
  const saved = _savedLoadouts[_activeLoadout - 1]!;
  const sel = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`);
  const dots = `<div class="vs-weapon-tag-dot"></div><div class="vs-weapon-tag-dot"></div><div class="vs-weapon-tag-dot"></div>`;
  const wLab = "Weapon";
  const sLab = "Shield";
  const w = saved.weapon;
  const weaponNameEl = sel("vs-weapon-name");
  if (weaponNameEl) {
    if (!w) weaponNameEl.textContent = "—";
    else {
      const mat = w.materialName !== "—" ? w.materialName : "";
      weaponNameEl.textContent = mat ? `${mat} ${wLab}` : w.label;
    }
  }
  const wDpBar = sel("vs-weapon-dp-bar");
  const wPpBar = sel("vs-weapon-pp-bar");
  const wMatEl = sel("vs-weapon-mat");
  if (wDpBar) wDpBar.style.width = "0%";
  if (wPpBar) wPpBar.style.width = "0%";
  if (wMatEl) wMatEl.innerHTML = `${dots} —`;

  const sh = saved.shield;
  const shieldNameEl = sel("vs-shield-name");
  const sDpBar = sel("vs-shield-dp-bar");
  const sPpBar = sel("vs-shield-pp-bar");
  const sMatEl = sel("vs-shield-mat");
  if (sh && shieldNameEl) {
    const mat = sh.materialName !== "—" ? sh.materialName : "";
    shieldNameEl.textContent = mat ? `${mat} ${sLab}` : sh.label;
    if (sDpBar) sDpBar.style.width = "0%";
    if (sPpBar) sPpBar.style.width = "0%";
    if (sMatEl) sMatEl.innerHTML = `${dots} —`;
  } else {
    if (shieldNameEl) shieldNameEl.textContent = "—";
    if (sDpBar) sDpBar.style.width = "0%";
    if (sPpBar) sPpBar.style.width = "0%";
    if (sMatEl) sMatEl.innerHTML = `${dots} —`;
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

/** Defence by limb: STR/INT = base + that slot + shield (and shield gems). No separate shield row. */
const EQ_DEF_LIMB_ROWS: readonly { slot: string; label: string }[] = [
  { slot: "armRight",    label: "R.ARM" },
  { slot: "armLeft",     label: "L.ARM" },
  { slot: "helm",        label: "HEAD" },
  { slot: "breastplate", label: "BODY" },
  { slot: "leggings",    label: "LEGS" },
];

// Map slot key → EquipData stored on last refresh
const _eqSlotData = new Map<string, EquipData>();
// Map slot key → item name read from RAM (when the in-game menu has loaded the table)
const _eqRamItemName = new Map<string, string>();
let _eqWeaponName = "—";
let _eqAglEqp = 0;
let _eqStrBase = 0, _eqIntBase = 0;
const _eqAglBase = 0;
let _eqRange = 0;
// Loadout persistence — loadout 0 = RAM (live), 1 & 2 = localStorage
let _activeLoadout = 0;
/** When set (live loadout only), equipment UI uses this blade instead of RAM until cleared or loadout changes. Does not write PS1 memory. */
let _eqLocalWeaponOverride: { displayName: string; data: EquipData } | null = null;
/** Same idea as weapon — mock shield from preset / gallery stub. */
let _eqLocalShieldOverride: { displayName: string; data: EquipData } | null = null;
type SavedLoadout = Record<string, { materialName: string; label: string } | null>;
function _loadoutKey(idx: number): string { return `vs-loadout-${idx + 1}`; }
function _loadSavedLoadout(idx: number): SavedLoadout {
  try { return JSON.parse(localStorage.getItem(_loadoutKey(idx)) ?? "{}") as SavedLoadout; }
  catch { return {}; }
}
const _savedLoadouts: [SavedLoadout, SavedLoadout] = [_loadSavedLoadout(1), _loadSavedLoadout(2)];

function _reloadSavedLoadoutsFromStorage(): void {
  _savedLoadouts[0] = _loadSavedLoadout(1);
  _savedLoadouts[1] = _loadSavedLoadout(2);
}

/** Match a saved slot entry to a stub inventory row by `label` or `materialName` (e.g. item name in JSON). */
function _matchSavedToWepFile(
  entry: { materialName: string; label: string } | null | undefined,
  extras: readonly { name: string; wepFile: number }[],
): number | undefined {
  if (!entry) return undefined;
  const candidates = [entry.label, entry.materialName].map(s => s.trim()).filter(s => s && s !== "—");
  for (const extra of extras) {
    const en = extra.name.toLowerCase();
    for (const c of candidates) {
      if (c.toLowerCase() === en) return extra.wepFile;
    }
  }
  return undefined;
}

const EQ_SLOT_LABELS: Record<string, string> = {
  weapon: "Weapon", shield: "Shield", armRight: "R.Arm", armLeft: "L.Arm",
  helm: "Helm", breastplate: "Chest", leggings: "Legs", accessory: "Acc.",
};

function _eqFillSlotNamesFromSaved(screen: HTMLElement, saved: SavedLoadout): void {
  Object.entries(EQ_SLOT_LABELS).forEach(([slot, label]) => {
    const el = screen.querySelector<HTMLElement>(`[data-slot-name="${slot}"]`);
    if (!el) return;
    const se = saved[slot];
    if (se) {
      const mat = se.materialName !== "—" ? se.materialName : "";
      el.textContent = mat ? `${mat} ${label}` : se.label;
      el.style.color = "";
    } else {
      el.textContent = "—";
      el.style.color = "";
    }
  });
}

function _eqRefreshSlotLabels(screen: HTMLElement): void {
  if (_activeLoadout !== 0) return;
  Object.entries(EQ_SLOT_LABELS).forEach(([slot, label]) => {
    const el = screen.querySelector<HTMLElement>(`[data-slot-name="${slot}"]`);
    if (!el) return;
    const d = _eqSlotData.get(slot);
    el.textContent = _eqItemName(slot, d, label);
    el.style.color = d?.equipped ? (_eqMaterialColor(d.materialIndex) || "") : "";
  });
}

function _syncLoadoutTabsUi(root: HTMLElement, idx0: number): void {
  const n = String(idx0 + 1);
  root.querySelectorAll<HTMLElement>(".vs-eq-loadout-btn[data-loadout]").forEach((b) => {
    b.classList.toggle("active", b.dataset.loadout === n);
  });
  root.querySelectorAll<HTMLElement>(".vs-loadout-btn[data-loadout]").forEach((b) => {
    b.classList.toggle("active", b.dataset.loadout === n);
  });
}

function _updateApplyPresetButton(root: HTMLElement): void {
  const btn = root.querySelector<HTMLButtonElement>("#vs-eq-apply-preset");
  if (!btn) return;
  const on = _activeLoadout >= 1;
  btn.disabled = !on;
  btn.title = on
    ? "Apply this preset to Live (1): mock overlay + Ashley strip. Does not poke PS1 RAM."
    : "Select preset 2 or 3 first, then apply to Live.";
}

function selectLoadout(root: HTMLElement, idx0: number): void {
  _reloadSavedLoadoutsFromStorage();
  _activeLoadout = idx0;
  _syncLoadoutTabsUi(root, idx0);
  const screen = root.querySelector<HTMLElement>('.vs-screen[data-screen="equipment"]');
  if (idx0 >= 1) {
    _eqLocalWeaponOverride = null;
    _eqLocalShieldOverride = null;
    if (screen) _eqFillSlotNamesFromSaved(screen, _savedLoadouts[idx0 - 1]!);
  } else {
    void refreshEquipmentScreen(root);
  }
  void refreshAshleyLoadoutStrip(root);
  _updateApplyPresetButton(root);
}

async function applyPresetToLiveAshley(root: HTMLElement): Promise<void> {
  if (_activeLoadout === 0) return;
  const presetIdx = _activeLoadout;
  _reloadSavedLoadoutsFromStorage();
  const saved = _savedLoadouts[presetIdx - 1]!;
  _eqLocalWeaponOverride = null;
  _eqLocalShieldOverride = null;
  _activeLoadout = 0;
  _syncLoadoutTabsUi(root, 0);
  _updateApplyPresetButton(root);

  await refreshEquipmentScreen(root);

  const screen = root.querySelector<HTMLElement>('.vs-screen[data-screen="equipment"]');
  if (!screen) {
    await refreshAshleyLoadoutStrip(root);
    return;
  }

  const blade = _eqSlotData.get("weapon");
  const wFile = _matchSavedToWepFile(saved.weapon, WEAPON_INVENTORY_EXTRAS);
  if (wFile != null) {
    const st = _eqStubEquipPreview(blade, wFile);
    const name = WEAPON_INVENTORY_EXTRAS.find(e => e.wepFile === wFile)?.name ?? (saved.weapon?.label ?? "Weapon");
    _eqLocalWeaponOverride = { displayName: name, data: st };
    _eqSlotData.set("weapon", st);
    _eqWeaponName = name;
  }

  const shield = _eqSlotData.get("shield");
  const sFile = _matchSavedToWepFile(saved.shield, SHIELD_INVENTORY_EXTRAS);
  if (sFile != null && saved.shield) {
    const st = _eqStubEquipPreview(shield, sFile);
    const name = SHIELD_INVENTORY_EXTRAS.find(e => e.wepFile === sFile)?.name ?? saved.shield.label;
    _eqLocalShieldOverride = { displayName: name, data: st };
    _eqSlotData.set("shield", st);
    _eqRamItemName.set("shield", name);
  }

  _eqRefreshSlotLabels(screen);
  _eqRefreshCombatSummary(screen);
  const activeSlot = _eqGetActiveSlot(screen);
  if (activeSlot) {
    _eqUpdateDetail(screen, activeSlot);
    _eqUpdateInfoBar(screen, activeSlot);
    void _eqRenderCategoryGallery(screen, activeSlot);
  }
  await refreshAshleyLoadoutStrip(root);
}

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

/** Stub inventory rows for the equipment category gallery (WEP index + label). Not RAM-backed. */
const WEAPON_INVENTORY_EXTRAS: readonly { name: string; wepFile: number }[] = [
  { name: "Fandango", wepFile: 16 },
  { name: "Tovarisch", wepFile: 35 },
];

const SHIELD_INVENTORY_EXTRAS: readonly { name: string; wepFile: number }[] = [
  { name: "Buckler", wepFile: 96 },
  { name: "Pelta Shield", wepFile: 97 },
];

/** Preview-only equip_data for mock Equip — does not write RAM. */
function _eqStubEquipPreview(base: EquipData | undefined, wepFile: number): EquipData {
  const raw = new Uint8Array(0x30);
  if (base?.equipped && base.raw.length >= 0x30) raw.set(base.raw);
  else raw[0x08] = 1;
  raw[0x03] = wepFile & 0xff;
  return readEquipData(raw);
}

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

type WeaponTypeHand = { type: string; hand: string };

/** equip_data $10 damage-type byte (blades) → Blunt/Edged/Piercing (US). */
const BLADE_DAMAGE_TYPE: Record<number, WeaponTypeHand["type"]> = {
  0: "Blunt",
  1: "Edged",
  2: "Piercing",
};

/**
 * Display type: blade damage byte, else dominant grip affinity, else WEAPON_CAT default.
 * Hand: WEAPON_CAT[blade.category]; Long Sword (3) + low range often tags short swords (e.g. Fandango).
 * Ashley weapon class id can refine hand when it differs from blade category.
 */
function deriveWeaponTypeHand(
  bladeCategoryId: number,
  bladeDamageTypeByte: number,
  gripTypes: readonly number[] | undefined,
  rangeStat: number,
): WeaponTypeHand | undefined {
  const typeDefault = WEAPON_CAT[bladeCategoryId];
  if (!typeDefault) return undefined;

  let dominantType: WeaponTypeHand["type"] | undefined;
  if (gripTypes && gripTypes.length >= 3) {
    const [blunt, edged, piercing] = gripTypes;
    const max = Math.max(blunt, edged, piercing);
    if (max > 0) {
      if (max === blunt) dominantType = "Blunt";
      else if (max === edged) dominantType = "Edged";
      else if (max === piercing) dominantType = "Piercing";
    }
  }

  const fromBladeByte = BLADE_DAMAGE_TYPE[bladeDamageTypeByte];
  const displayType = fromBladeByte ?? dominantType ?? typeDefault.type;

  // Handedness from blade `category` only (not ADDR_ASHLEY_WEAPON_CAT — can disagree with blade, e.g. Fandango).
  let hand = typeDefault.hand;
  // Two-handed class in RAM but reach ≤ 10 → treat as one-handed (starter swords, short axes, etc.).
  // Skip ranged classes (9–11) by only applying to blade categories used for melee in WEAPON_CAT.
  if (typeDefault.hand === "Two-Handed" && rangeStat <= 10 && bladeCategoryId <= 8) {
    hand = "One-Handed";
  }

  return { type: displayType, hand };
}

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
function _eqItemName(slotKey: string, data: EquipData | undefined, slotLabel: string): string {
  if (!data?.equipped) return "—";
  if (slotKey === "weapon") return _eqWeaponName;
  return _eqRamItemName.get(slotKey) ?? ITEM_NAME_FALLBACK[data.itemNameIndex] ?? slotLabel;
}

function _eqSetAffinityVal(el: HTMLElement, val: number): void {
  el.textContent = val === 0 ? "0" : (val > 0 ? `+${val}` : `${val}`);
  // Class rows: keep neutral styling that matches the label; no positive/negative colors.
  if (el.dataset.classIdx !== undefined) {
    el.className = "vs-eq-affinity-val";
    return;
  }
  // Affinity and type rows: base style is white; best row coloring is handled at the row level.
  el.className = "vs-eq-affinity-val";
}

function _eqSetDiff(el: HTMLElement, val: number): void {
  el.textContent = val === 0 ? "" : (val > 0 ? `+${val}` : `${val}`);
  el.className = "vs-eq-stat-diff" + (val > 0 ? " pos" : val < 0 ? " neg" : " zero");
}

function _eqClearEquipmentDetail(screen: HTMLElement): void {
  const nameEl = screen.querySelector<HTMLElement>("#vs-eq-detail-name");
  if (nameEl) {
    nameEl.textContent = "—";
    nameEl.style.color = "";
  }
  const subEl = screen.querySelector<HTMLElement>("#vs-eq-detail-sub");
  if (subEl) subEl.textContent = "";
  const dpPpRow = screen.querySelector<HTMLElement>("#vs-eq-dp-pp-row");
  if (dpPpRow) {
    dpPpRow.classList.add("hidden");
    const dpBar = screen.querySelector<HTMLElement>("#vs-eq-dp-bar");
    const ppBar = screen.querySelector<HTMLElement>("#vs-eq-pp-bar");
    if (dpBar) dpBar.style.width = "0%";
    if (ppBar) ppBar.style.width = "0%";
  }
  screen.querySelectorAll<HTMLElement>(".vs-eq-affinity-row-best").forEach(row => {
    row.classList.remove("vs-eq-affinity-row-best");
  });
  screen.querySelectorAll<HTMLElement>("[data-class-idx]").forEach(el => {
    el.textContent = "—";
    el.className = "vs-eq-affinity-val";
  });
  screen.querySelectorAll<HTMLElement>("[data-affinity-idx]").forEach(el => {
    el.textContent = "—";
    el.className = "vs-eq-affinity-val";
  });
  screen.querySelectorAll<HTMLElement>("[data-type-idx]").forEach(el => {
    el.textContent = "—";
    el.className = "vs-eq-affinity-val";
  });
  const strDiff = screen.querySelector<HTMLElement>("#vs-eq-str-diff");
  const intDiff = screen.querySelector<HTMLElement>("#vs-eq-int-diff");
  const aglDiff = screen.querySelector<HTMLElement>("#vs-eq-agl-diff");
  if (strDiff) _eqSetDiff(strDiff, 0);
  if (intDiff) _eqSetDiff(intDiff, 0);
  if (aglDiff) _eqSetDiff(aglDiff, 0);
  const bar = screen.querySelector<HTMLElement>("#vs-eq-info-bar");
  if (bar) bar.textContent = "Select a slot to view equipment stats.";
}

type EqDetailPreview = { data: EquipData; displayName?: string };

/** Sum STR/INT/AGL from equip_data blocks that are equipped (blade + grip + gems, etc.). */
function _eqSumStrIntAgi(...pieces: (EquipData | undefined)[]): { str: number; int: number; agi: number } {
  let str = 0, int = 0, agi = 0;
  for (const d of pieces) {
    if (d?.equipped) {
      str += d.str;
      int += d.int;
      agi += d.agi;
    }
  }
  return { str, int, agi };
}

function _eqRefreshCombatSummary(screen: HTMLElement): void {
  const atkStr = screen.querySelector<HTMLElement>("#vs-eq-atk-str");
  const atkInt = screen.querySelector<HTMLElement>("#vs-eq-atk-int");
  const agl = screen.querySelector<HTMLElement>("#vs-eq-agl");

  const setCombatVal = (el: HTMLElement | null, value: number) => {
    if (!el) return;
    if (value <= 0) {
      el.textContent = "—";
      el.classList.add("dim");
    } else {
      el.textContent = String(value);
      el.classList.remove("dim");
    }
  };

  const setDefCell = (el: HTMLElement | null, value: number, title: string) => {
    if (!el) return;
    if (value <= 0) {
      el.textContent = "—";
      el.classList.add("dim");
      el.removeAttribute("title");
    } else {
      el.textContent = String(value);
      el.classList.remove("dim");
      el.title = title;
    }
  };

  const eqPiece = (d: EquipData | undefined): { str: number; int: number } =>
    !d?.equipped ? { str: 0, int: 0 } : { str: d.str ?? 0, int: d.int ?? 0 };

  const weaponBlade = _eqSlotData.get("weapon");
  const weaponGrip = _eqSlotData.get("weaponGrip");
  const weaponGems = [
    _eqSlotData.get("weaponGem1"),
    _eqSlotData.get("weaponGem2"),
    _eqSlotData.get("weaponGem3"),
  ];
  const shieldData = _eqSlotData.get("shield");
  const shieldGems = [
    _eqSlotData.get("shieldGem1"),
    _eqSlotData.get("shieldGem2"),
    _eqSlotData.get("shieldGem3"),
  ];
  const accessoryData = _eqSlotData.get("accessory");

  const accStr = accessoryData?.equipped ? (accessoryData.str ?? 0) : 0;
  const accInt = accessoryData?.equipped ? (accessoryData.int ?? 0) : 0;

  // Attack/STR and Attack/INT: base + blade + grip + weapon gems (composite weapons) + accessory — not armour.
  const weaponComboAtk = _eqSumStrIntAgi(weaponBlade, weaponGrip, ...weaponGems);
  const weaponStrAtk = weaponComboAtk.str;
  const weaponIntAtk = weaponComboAtk.int;
  const atkStrTotal = _eqStrBase + weaponStrAtk + accStr;
  const atkIntTotal = _eqIntBase + weaponIntAtk + accInt;

  const bladeStr = weaponBlade?.equipped ? weaponBlade.str : 0;
  const gripStr = weaponGrip?.equipped ? weaponGrip.str : 0;
  const gemStrWeapon = weaponGems.reduce((s, d) => s + (d?.equipped ? d.str : 0), 0);
  const bladeInt = weaponBlade?.equipped ? weaponBlade.int : 0;
  const gripInt = weaponGrip?.equipped ? weaponGrip.int : 0;
  const gemIntWeapon = weaponGems.reduce((s, d) => s + (d?.equipped ? d.int : 0), 0);

  setCombatVal(atkStr, atkStrTotal);
  setCombatVal(atkInt, atkIntTotal);
  setCombatVal(agl, _eqAglEqp);

  const setEqDiamondInner = (id: string, value: number) => {
    const el = screen.querySelector<HTMLElement>(`#${id}`);
    if (!el) return;
    if (value <= 0) {
      el.textContent = "—";
    } else {
      el.textContent = String(value);
    }
  };
  setEqDiamondInner("vs-eq-str-val", atkStrTotal);
  setEqDiamondInner("vs-eq-int-val", atkIntTotal);
  setEqDiamondInner("vs-eq-agl-val", _eqAglEqp);

  const shieldComboDef = _eqSumStrIntAgi(shieldData, ...shieldGems);
  const shieldPiece = { str: shieldComboDef.str, int: shieldComboDef.int };

  for (const { slot, label } of EQ_DEF_LIMB_ROWS) {
    const row = screen.querySelector<HTMLElement>(`tr[data-def-limb="${slot}"]`);
    if (!row) continue;
    const cStr = row.querySelector<HTMLElement>(".vs-eq-def-phys");
    const cInt = row.querySelector<HTMLElement>(".vs-eq-def-mag");
    const piece = eqPiece(_eqSlotData.get(slot));
    const totStr = _eqStrBase + piece.str + shieldPiece.str;
    const totInt = _eqIntBase + piece.int + shieldPiece.int;

    const tStr = `${totStr} = ${_eqStrBase} (base STR) + ${piece.str} (${label} STR) + ${shieldPiece.str} (shield + gems STR)`;
    const tInt = `${totInt} = ${_eqIntBase} (base INT) + ${piece.int} (${label} INT) + ${shieldPiece.int} (shield + gems INT)`;

    setDefCell(cStr, totStr, tStr);
    setDefCell(cInt, totInt, tInt);
  }

  if (atkStr) {
    atkStr.title =
      `${atkStrTotal} = ${_eqStrBase} (base STR) + ${bladeStr} (blade) + ${gripStr} (grip) + ${gemStrWeapon} (weapon gems) + ${accStr} (accessory)`;
  }
  if (atkInt) {
    atkInt.title =
      `${atkIntTotal} = ${_eqIntBase} (base INT) + ${bladeInt} (blade) + ${gripInt} (grip) + ${gemIntWeapon} (weapon gems) + ${accInt} (accessory)`;
  }

  if (agl) {
    const aglEquip = Math.max(0, _eqAglEqp - _eqAglBase);
    agl.title = `${_eqAglEqp} = ${_eqAglBase} (base AGL) + ${aglEquip} (equipment)`;
  }
}

function _eqUpdateDetail(
  screen: HTMLElement,
  slotKey: string,
  preview?: EqDetailPreview,
): void {
  const data = preview?.data ?? _eqSlotData.get(slotKey);
  const slot = EQ_SLOTS.find(s => s.key === slotKey);
  const isWeaponOrShield = slot?.isWeaponOrShield ?? false;

  // Header name — use real item name; tint by material
  const nameEl = screen.querySelector<HTMLElement>("#vs-eq-detail-name");
  if (nameEl) {
    if (preview?.displayName) {
      nameEl.textContent = preview.displayName;
    } else {
      nameEl.textContent = _eqItemName(slotKey, data, slot?.label ?? slotKey);
    }
    nameEl.style.color = data?.equipped ? (_eqMaterialColor(data.materialIndex) || "") : "";
  }

  // Sub-line: material · damage type · cost
  const subEl = screen.querySelector<HTMLElement>("#vs-eq-detail-sub");
  if (subEl) {
    if (data?.equipped) {
      const parts: string[] = [];
      if (data.materialName !== "—") parts.push(data.materialName);
      if (slotKey === "weapon") {
        const gripData = preview ? undefined : _eqSlotData.get("weaponGrip");
        const typeHand = deriveWeaponTypeHand(
          data.category,
          data.damageType,
          gripData?.types,
          _eqRange,
        );
        if (typeHand) parts.push(`${typeHand.type}/${typeHand.hand}`);
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

  // Clear any previous "best" highlights across all affinity rows
  screen.querySelectorAll<HTMLElement>(".vs-eq-affinity-row-best").forEach(row => {
    row.classList.remove("vs-eq-affinity-row-best");
  });

  // CLASS sub-panel — populate values only; VS shows these evenly, without a "best" highlight
  screen.querySelectorAll<HTMLElement>("[data-class-idx]").forEach(el => {
    const idx = parseInt(el.dataset.classIdx ?? "0", 10);
    const val = data?.equipped ? (data.classes[idx] ?? 0) : 0;
    _eqSetAffinityVal(el, val);
    if (!data?.equipped) {
      el.textContent = "—";
    }
  });

  // AFFINITY sub-panel — elemental alignment
  let maxAffinityVal = Number.NEGATIVE_INFINITY;
  const bestAffinityRows: HTMLElement[] = [];
  screen.querySelectorAll<HTMLElement>("[data-affinity-idx]").forEach(el => {
    const idx = parseInt(el.dataset.affinityIdx ?? "0", 10);
    const val = data?.equipped ? (data.affinities[idx] ?? 0) : 0;
    _eqSetAffinityVal(el, val);
    if (!data?.equipped) {
      el.textContent = "—";
      return;
    }
    if (val === 0) return;
    if (val > maxAffinityVal) {
      maxAffinityVal = val;
      bestAffinityRows.length = 0;
      const row = el.closest<HTMLElement>(".vs-eq-affinity-row");
      if (row) bestAffinityRows.push(row);
    } else if (val === maxAffinityVal) {
      const row = el.closest<HTMLElement>(".vs-eq-affinity-row");
      if (row) bestAffinityRows.push(row);
    }
  });
  if (Number.isFinite(maxAffinityVal) && maxAffinityVal !== 0) {
    bestAffinityRows.forEach(row => row.classList.add("vs-eq-affinity-row-best"));
  }

  // TYPE sub-panel — weapon: grip when viewing live equipped; preview stub uses blade-only data
  const typeData =
    slotKey === "weapon"
      ? preview
        ? preview.data
        : _eqSlotData.get("weaponGrip")
      : data;
  let maxTypeVal = Number.NEGATIVE_INFINITY;
  const bestTypeRows: HTMLElement[] = [];
  screen.querySelectorAll<HTMLElement>("[data-type-idx]").forEach(el => {
    const idx = parseInt(el.dataset.typeIdx ?? "0", 10);
    const val = typeData?.equipped ? (typeData.types[idx] ?? 0) : 0;
    _eqSetAffinityVal(el, val);
    if (!typeData?.equipped) {
      el.textContent = "—";
      return;
    }
    if (val === 0) return;
    if (val > maxTypeVal) {
      maxTypeVal = val;
      bestTypeRows.length = 0;
      const row = el.closest<HTMLElement>(".vs-eq-affinity-row");
      if (row) bestTypeRows.push(row);
    } else if (val === maxTypeVal) {
      const row = el.closest<HTMLElement>(".vs-eq-affinity-row");
      if (row) bestTypeRows.push(row);
    }
  });
  if (Number.isFinite(maxTypeVal) && maxTypeVal !== 0) {
    bestTypeRows.forEach(row => row.classList.add("vs-eq-affinity-row-best"));
  }

  // Per-slot contribution under each label; badge totals are updated in _eqRefreshCombatSummary.
  const getEl = (id: string) => screen.querySelector<HTMLElement>(`#${id}`);
  const strDiff = getEl("vs-eq-str-diff"), intDiff = getEl("vs-eq-int-diff"), aglDiff = getEl("vs-eq-agl-diff");

  let strDiffVal = 0;
  let intDiffVal = 0;
  let aglDiffVal = 0;
  if (data?.equipped) {
    if (preview) {
      strDiffVal = data.str;
      intDiffVal = data.int;
      aglDiffVal = data.agi;
    } else if (slotKey === "weapon") {
      const s = _eqSumStrIntAgi(
        data,
        _eqSlotData.get("weaponGrip"),
        _eqSlotData.get("weaponGem1"),
        _eqSlotData.get("weaponGem2"),
        _eqSlotData.get("weaponGem3"),
      );
      strDiffVal = s.str;
      intDiffVal = s.int;
      aglDiffVal = s.agi;
    } else if (slotKey === "shield") {
      const s = _eqSumStrIntAgi(
        data,
        _eqSlotData.get("shieldGem1"),
        _eqSlotData.get("shieldGem2"),
        _eqSlotData.get("shieldGem3"),
      );
      strDiffVal = s.str;
      intDiffVal = s.int;
      aglDiffVal = s.agi;
    } else {
      strDiffVal = data.str;
      intDiffVal = data.int;
      aglDiffVal = data.agi;
    }
  }
  if (strDiff) _eqSetDiff(strDiff, strDiffVal);
  if (intDiff) _eqSetDiff(intDiff, intDiffVal);
  if (aglDiff) _eqSetDiff(aglDiff, aglDiffVal);
}


function _eqGetActiveSlot(screen: HTMLElement): string {
  const row = screen.querySelector<HTMLElement>(".vs-eq-slot-row.active");
  return row?.dataset.slot ?? "";
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

function _eqUpdateInfoBar(screen: HTMLElement, slotKey: string, dataOverride?: EquipData): void {
  const bar = screen.querySelector<HTMLElement>("#vs-eq-info-bar");
  if (!bar) return;
  const data = dataOverride ?? _eqSlotData.get(slotKey);
  const slot = EQ_SLOTS.find(s => s.key === slotKey);
  if (!data?.equipped) {
    bar.textContent = slot ? `Slot: ${slot.label}` : "—";
    return;
  }
  const className = SLOT_CLASS_NAMES[slotKey] ?? slot?.label ?? slotKey;
  if (slotKey === "weapon") {
    const gripData = _eqSlotData.get("weaponGrip");
    const typeHand = deriveWeaponTypeHand(
      data.category,
      data.damageType,
      gripData?.types,
      _eqRange,
    );
    const typeStr = typeHand ? ` · ${typeHand.type}/${typeHand.hand}` : "";
    bar.textContent = `Class: ${className}  ·  ${data.materialName}${typeStr}`;
  } else if (slot?.isWeaponOrShield) {
    bar.textContent = `Class: ${className}  ·  ${data.materialName}`;
  } else {
    bar.textContent = `Class: ${className}  ·  ${data.materialName}`;
  }
}

function _eqClearCategoryGallery(screen: HTMLElement): void {
  const gallery = screen.querySelector<HTMLElement>("#vs-eq-category-gallery");
  if (!gallery) return;
  gallery.querySelectorAll<HTMLElement>(".vs-eq-model-thumb").forEach((thumb) => {
    _safeUnmountWepViewer(thumb);
  });
  gallery.remove();
}

/**
 * Centre column: all items in the same category as the active slot (equipped + stub inventory).
 * Clicking a tile updates the right-hand detail panel.
 */
async function _eqRenderCategoryGallery(screen: HTMLElement, slotKey: string): Promise<void> {
  const portraitCol = screen.querySelector<HTMLElement>(".vs-eq-portrait-col");
  if (!portraitCol) return;

  _eqClearCategoryGallery(screen);

  const gallery = document.createElement("div");
  gallery.id = "vs-eq-category-gallery";
  gallery.style.cssText = [
    "position:absolute",
    "inset:24px 32px 32px 32px",
    "display:flex",
    "flex-wrap:wrap",
    "align-content:flex-start",
    "justify-content:center",
    "gap:12px",
    "pointer-events:auto",
  ].join(";");

  const slot = EQ_SLOTS.find(s => s.key === slotKey);

  if (slotKey === "weapon") {
    const blade = _eqSlotData.get("weapon");
    type WEntry = { kind: "equipped" | "stub"; label: string; wepFile: number };
    const entries: WEntry[] = [];
    if (blade?.equipped && blade.wepFile > 0) {
      entries.push({ kind: "equipped", label: _eqWeaponName, wepFile: blade.wepFile });
    }
    for (const extra of WEAPON_INVENTORY_EXTRAS) {
      if (extra.name === _eqWeaponName) continue;
      if (blade?.equipped && extra.wepFile === blade.wepFile) continue;
      entries.push({ kind: "stub", label: extra.name, wepFile: extra.wepFile });
    }
    if (entries.length === 0) return;

    entries.forEach((entry, index) => {
      const wrap = document.createElement("div");
      wrap.style.cssText =
        "display:flex;flex-direction:column;align-items:center;gap:6px;width:112px;pointer-events:auto";
      const thumb = document.createElement("div");
      thumb.className = "vs-eq-model-thumb";
      thumb.dataset.wepFile = String(entry.wepFile);
      thumb.dataset.previewKind = entry.kind;
      thumb.style.cssText = [
        "width:96px",
        "height:96px",
        "border-radius:8px",
        "border:1px solid rgba(148,163,184,0.55)",
        "background:radial-gradient(circle at 30% 10%,rgba(248,250,252,0.08),rgba(15,23,42,0.96))",
        "box-shadow:0 10px 20px rgba(15,23,42,0.85)",
        "overflow:hidden",
        "position:relative",
        "cursor:pointer",
      ].join(";");

      const tilt = -Math.PI / 4 + index * 0.04;
      void mountWEPStaticViewer(thumb, entry.wepFile, tilt);

      const cap = document.createElement("div");
      cap.style.cssText =
        "font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:0.06em;color:rgba(255,255,255,0.55);text-align:center;max-width:112px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
      cap.textContent = entry.label;

      const equipBtn = document.createElement("button");
      equipBtn.type = "button";
      equipBtn.textContent = entry.kind === "equipped" ? "Equipped" : "Equip";
      equipBtn.disabled = entry.kind === "equipped";
      equipBtn.style.cssText =
        "font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:4px;border:1px solid rgba(200,168,74,0.45);background:rgba(20,18,16,0.95);color:#c8a84a;cursor:pointer";
      if (entry.kind === "equipped") {
        equipBtn.style.opacity = "0.55";
        equipBtn.style.cursor = "default";
        equipBtn.title = "Currently equipped";
      } else {
        equipBtn.title = "Equip on Ashley (UI + stats; does not write PS1 RAM)";
      }

      const applyPreview = (): void => {
        if (entry.kind === "equipped") {
          _eqUpdateDetail(screen, "weapon");
          _eqRefreshCombatSummary(screen);
          _eqUpdateInfoBar(screen, "weapon");
        } else {
          const stub = _eqStubEquipPreview(_eqSlotData.get("weapon"), entry.wepFile);
          _eqUpdateDetail(screen, "weapon", { data: stub, displayName: entry.label });
          _eqRefreshCombatSummary(screen);
          _eqUpdateInfoBar(screen, "weapon", stub);
        }
      };

      const commitEquip = (): void => {
        if (entry.kind === "equipped") return;
        if (_activeLoadout !== 0) return;
        const committed = _eqStubEquipPreview(_eqSlotData.get("weapon"), entry.wepFile);
        _eqLocalWeaponOverride = { displayName: entry.label, data: committed };
        _eqSlotData.set("weapon", committed);
        _eqWeaponName = entry.label;
        const wEl = screen.querySelector<HTMLElement>('[data-slot-name="weapon"]');
        if (wEl) {
          wEl.textContent = _eqItemName("weapon", committed, "Weapon");
          wEl.style.color = committed.equipped ? (_eqMaterialColor(committed.materialIndex) || "") : "";
        }
        _eqUpdateDetail(screen, "weapon");
        _eqRefreshCombatSummary(screen);
        _eqUpdateInfoBar(screen, "weapon");
        void _eqRenderCategoryGallery(screen, "weapon");
      };

      thumb.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        applyPreview();
      });
      equipBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        commitEquip();
      });

      wrap.appendChild(thumb);
      wrap.appendChild(cap);
      wrap.appendChild(equipBtn);
      gallery.appendChild(wrap);
    });

    portraitCol.appendChild(gallery);
    return;
  }

  if (slotKey === "shield") {
    const shield = _eqSlotData.get("shield");
    type SEntry = { kind: "equipped" | "stub"; label: string; wepFile: number };
    const entries: SEntry[] = [];
    if (shield?.equipped && shield.wepFile > 0) {
      entries.push({
        kind: "equipped",
        label: _eqItemName("shield", shield, "Shield"),
        wepFile: shield.wepFile,
      });
    }
    for (const extra of SHIELD_INVENTORY_EXTRAS) {
      const eqName = shield?.equipped ? _eqItemName("shield", shield, "Shield") : "";
      if (extra.name === eqName) continue;
      if (shield?.equipped && extra.wepFile === shield.wepFile) continue;
      entries.push({ kind: "stub", label: extra.name, wepFile: extra.wepFile });
    }
    if (entries.length === 0) return;

    entries.forEach((entry, index) => {
      const wrap = document.createElement("div");
      wrap.style.cssText =
        "display:flex;flex-direction:column;align-items:center;gap:6px;width:112px;pointer-events:auto";
      const thumb = document.createElement("div");
      thumb.className = "vs-eq-model-thumb";
      thumb.dataset.wepFile = String(entry.wepFile);
      thumb.style.cssText = [
        "width:96px",
        "height:96px",
        "border-radius:8px",
        "border:1px solid rgba(148,163,184,0.55)",
        "background:radial-gradient(circle at 30% 10%,rgba(248,250,252,0.08),rgba(15,23,42,0.96))",
        "overflow:hidden",
        "cursor:pointer",
      ].join(";");
      const tilt = -Math.PI / 4 + index * 0.04;
      void mountWEPStaticViewer(thumb, entry.wepFile, tilt);

      const cap = document.createElement("div");
      cap.style.cssText =
        "font-family:'Josefin Sans',sans-serif;font-size:9px;color:rgba(255,255,255,0.55);text-align:center;max-width:112px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
      cap.textContent = entry.label;

      const equipBtn = document.createElement("button");
      equipBtn.type = "button";
      equipBtn.textContent = "Equip";
      equipBtn.style.cssText =
        "font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:4px;border:1px solid rgba(200,168,74,0.45);background:rgba(20,18,16,0.95);color:#c8a84a;cursor:pointer";

      const applySelection = (): void => {
        if (entry.kind === "equipped") {
          _eqUpdateDetail(screen, "shield");
          _eqRefreshCombatSummary(screen);
          _eqUpdateInfoBar(screen, "shield");
        } else {
          const stub = _eqStubEquipPreview(shield, entry.wepFile);
          _eqUpdateDetail(screen, "shield", { data: stub, displayName: entry.label });
          _eqRefreshCombatSummary(screen);
          _eqUpdateInfoBar(screen, "shield", stub);
        }
      };

      thumb.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); applySelection(); });
      equipBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); applySelection(); });

      wrap.appendChild(thumb);
      wrap.appendChild(cap);
      wrap.appendChild(equipBtn);
      gallery.appendChild(wrap);
    });

    portraitCol.appendChild(gallery);
    return;
  }

  // Armour / accessory: text cards only
  const data = _eqSlotData.get(slotKey);
  if (!data?.equipped) return;

  const label = _eqItemName(slotKey, data, slot?.label ?? slotKey);
  const card = document.createElement("button");
  card.type = "button";
  card.textContent = label;
  card.style.cssText =
    "min-width:120px;padding:12px 16px;border-radius:8px;border:1px solid rgba(148,163,184,0.45);background:rgba(15,23,42,0.6);color:#fff;font-family:'Josefin Sans',sans-serif;font-size:11px;cursor:pointer";
  card.addEventListener("click", (e) => {
    e.preventDefault();
    _eqUpdateDetail(screen, slotKey);
    _eqRefreshCombatSummary(screen);
    _eqUpdateInfoBar(screen, slotKey);
  });
  gallery.appendChild(card);
  portraitCol.appendChild(gallery);
}

function initEquipmentScreen(root: HTMLElement): void {
  const screen = root.querySelector<HTMLElement>('.vs-screen[data-screen="equipment"]');
  if (!screen) return;

  screen.querySelectorAll<HTMLElement>(".vs-eq-loadout-btn[data-loadout]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.loadout ?? "1", 10) - 1;
      selectLoadout(root, idx);
    });
  });

  root.querySelector<HTMLButtonElement>("#vs-eq-apply-preset")?.addEventListener("click", () => {
    void applyPresetToLiveAshley(root);
  });

  // Slot rows — no default selection; first click chooses category and shows centre + right detail
  screen.querySelectorAll<HTMLElement>(".vs-eq-slot-row").forEach(row => {
    row.addEventListener("click", () => {
      screen.querySelectorAll(".vs-eq-slot-row").forEach(r => r.classList.remove("active"));
      row.classList.add("active");
      const slotKey = row.dataset.slot ?? "";
      if (!slotKey) return;
      _eqUpdateDetail(screen, slotKey);
      _eqRefreshCombatSummary(screen);
      _eqUpdateInfoBar(screen, slotKey);
      void _eqRenderCategoryGallery(screen, slotKey);
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
      weaponGem1,
      weaponGem2,
      weaponGem3,
      shield,
      shieldGem1,
      shieldGem2,
      shieldGem3,
      armRight,
      armLeft,
      helm,
      breastplate,
      leggings,
      accessory,
      aglEquipped,
      strBase,
      intBase,
      rangeVal,
    ] = await Promise.all([
      ram.ashley.equip.weaponName(),
      ram.ashley.equip.weaponBlade(),
      ram.ashley.equip.weaponGrip(),
      ram.ashley.equip.weaponGem1(),
      ram.ashley.equip.weaponGem2(),
      ram.ashley.equip.weaponGem3(),
      ram.ashley.equip.shield(),
      ram.ashley.equip.shieldGem1(),
      ram.ashley.equip.shieldGem2(),
      ram.ashley.equip.shieldGem3(),
      ram.ashley.equip.armRight(),
      ram.ashley.equip.armLeft(),
      ram.ashley.equip.helm(),
      ram.ashley.equip.breastplate(),
      ram.ashley.equip.leggings(),
      ram.ashley.equip.accessory(),
      ram.ashley.aglEquipped(),
      ram.ashley.strBase(),
      ram.ashley.intBase(),
      ram.ashley.range(),
    ]);

    const useLocalWeapon = _activeLoadout === 0 && _eqLocalWeaponOverride !== null;
    const useLocalShield = _activeLoadout === 0 && _eqLocalShieldOverride !== null;
    _eqWeaponName = useLocalWeapon ? _eqLocalWeaponOverride!.displayName : weaponName;
    _eqAglEqp = aglEquipped;
    _eqStrBase = strBase;
    _eqIntBase = intBase;
    _eqRange = rangeVal;
    _eqSlotData.set("weapon",      useLocalWeapon ? _eqLocalWeaponOverride!.data : blade);
    _eqSlotData.set("weaponGrip",  grip);
    _eqSlotData.set("weaponGem1",  weaponGem1);
    _eqSlotData.set("weaponGem2",  weaponGem2);
    _eqSlotData.set("weaponGem3",  weaponGem3);
    _eqSlotData.set("shield",      useLocalShield ? _eqLocalShieldOverride!.data : shield);
    _eqSlotData.set("shieldGem1",  shieldGem1);
    _eqSlotData.set("shieldGem2",  shieldGem2);
    _eqSlotData.set("shieldGem3",  shieldGem3);
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
      const d = data as EquipData;
      if (!d.equipped) return;
      const name = await ram.itemName(d.itemNameIndex);
      if (name) _eqRamItemName.set(key as string, name);
    }));

    if (useLocalShield) {
      _eqRamItemName.set("shield", _eqLocalShieldOverride!.displayName);
    }

    if (_activeLoadout === 0) {
      _eqRefreshSlotLabels(screen);
    } else {
      _reloadSavedLoadoutsFromStorage();
      _eqFillSlotNamesFromSaved(screen, _savedLoadouts[_activeLoadout - 1]!);
    }

    _eqRefreshCombatSummary(screen);
    const activeSlot = _eqGetActiveSlot(screen);
    if (!activeSlot) {
      _eqClearEquipmentDetail(screen);
      _eqClearCategoryGallery(screen);
      return;
    }
    _eqUpdateDetail(screen, activeSlot);
    _eqUpdateInfoBar(screen, activeSlot);
    void _eqRenderCategoryGallery(screen, activeSlot);
  } catch {
    // worker not active — leave current values
  }
}

type PcsxGlobals = {
  __riskbreakerPcsxPause?: () => void;
  __riskbreakerPcsxResume?: () => void;
};

function vsMenuDebug(): boolean {
  return (globalThis as VsMenuGlobals).__riskbreakerVsMenuDebug === true;
}

function pcsxPause(): void {
  const fn = (globalThis as PcsxGlobals).__riskbreakerPcsxPause;
  if (!fn) {
    console.warn("[vs-menu] pcsxPause: __riskbreakerPcsxPause missing (disc not running / worker not ready?)");
    return;
  }
  if (vsMenuDebug()) console.info("[vs-menu] pcsxPause → worker");
  fn();
}

function pcsxResume(): void {
  const fn = (globalThis as PcsxGlobals).__riskbreakerPcsxResume;
  if (!fn) {
    console.warn("[vs-menu] pcsxResume: __riskbreakerPcsxResume missing");
    return;
  }
  if (vsMenuDebug()) console.info("[vs-menu] pcsxResume → worker");
  fn();
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
        const eqScreen = root.querySelector<HTMLElement>('.vs-screen[data-screen="equipment"]');
        if (eqScreen) _eqClearCategoryGallery(eqScreen);
      }

      if (target === "equipment") {
        const eqScreen = root.querySelector<HTMLElement>('.vs-screen[data-screen="equipment"]');
        if (eqScreen) {
          eqScreen.querySelectorAll(".vs-eq-slot-row").forEach(r => r.classList.remove("active"));
          _eqClearEquipmentDetail(eqScreen);
          _eqClearCategoryGallery(eqScreen);
          void refreshEquipmentScreen(root);
        }
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
  void refreshAshleyLoadoutStrip(root);
  void refreshAbilities(root);
  void refreshEquipmentScreen(root);
}

function closeMenu(root: HTMLElement): void {
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
  root.querySelectorAll<HTMLElement>(".vs-loadout-tabs .vs-loadout-btn[data-loadout]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.loadout ?? "1", 10) - 1;
      selectLoadout(root, idx);
    });
  });
  _updateApplyPresetButton(root);

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
