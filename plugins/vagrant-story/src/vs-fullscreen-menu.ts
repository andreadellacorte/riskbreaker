/**
 * RSK-uxvs: Vagrant Story fullscreen menu overlay.
 *
 * Triggered by `d` key (Triangle button equivalent).
 * Reads live HP/MP/Risk from PS1 RAM via __riskbreakerEmulatorHost.peek().
 * Vanilla TS + inline CSS — no framework, IIFE bundle.
 */

const PS1_STAT_BLOCK = 0x11fa58;
const STAT_BLOCK_LEN = 10; // 5 × u16LE: HP_cur, HP_max, MP_cur, MP_max, Risk

type Host = { peek?: (a: number, l: number) => Promise<Uint8Array> };

function getHost(): Host | undefined {
  return (globalThis as { __riskbreakerEmulatorHost?: Host }).__riskbreakerEmulatorHost;
}

function readU16LE(b: Uint8Array, off: number): number {
  return b[off] | (b[off + 1] << 8);
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

#vs-menu-root {
  position: fixed;
  inset: 0;
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

/* ── Tab bar ── */
.vs-tabs {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #2a2518;
  padding: 0 24px;
  gap: 0;
  flex-shrink: 0;
}

.vs-tab-nav {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: #4a4030;
  padding: 14px 6px;
  cursor: default;
  font-weight: 400;
  text-transform: uppercase;
  white-space: nowrap;
}

.vs-tab-nav.vs-active {
  color: #d4c8a8;
  border-bottom: 1px solid #c8a84a;
  margin-bottom: -1px;
}

.vs-tab-nav-arrow {
  color: #4a4030;
  font-size: 10px;
  padding: 14px 10px;
}

.vs-tab-name {
  font-family: 'Cinzel', serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #d4c8a8;
  padding: 14px 20px 14px 0;
  text-transform: uppercase;
}

/* ── Body layout ── */
.vs-body {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 260px;
  min-height: 0;
}

/* ── Left column ── */
.vs-left {
  padding: 20px 16px 20px 24px;
  border-right: 1px solid #1a1810;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}

.vs-section-label {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  letter-spacing: 0.16em;
  color: #4a4030;
  text-transform: uppercase;
  margin-bottom: 4px;
  margin-top: 14px;
}

.vs-section-label:first-child {
  margin-top: 0;
}

.vs-section-value {
  font-size: 11px;
  color: #6a5c3c;
  letter-spacing: 0.04em;
}

.vs-divider {
  height: 1px;
  background: #1a1810;
  margin: 12px 0;
}

/* ── Stat bars ── */
.vs-stats-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 3px 0;
}

.vs-stat-label {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: #6a5c3c;
  width: 24px;
  text-transform: uppercase;
  flex-shrink: 0;
}

.vs-stat-bar-track {
  flex: 1;
  height: 3px;
  background: #1a1810;
  border-radius: 1px;
  overflow: hidden;
}

.vs-stat-bar-fill {
  height: 100%;
  border-radius: 1px;
  transition: width 0.4s ease;
}

.vs-stat-bar-fill.hp  { background: #7ab87a; }
.vs-stat-bar-fill.mp  { background: #5a7ab8; }
.vs-stat-bar-fill.risk { background: #c85a2a; }

.vs-stat-value {
  font-size: 10px;
  color: #d4c8a8;
  width: 70px;
  text-align: right;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

/* ── Weapon slots ── */
.vs-weapon {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 6px 0;
}

.vs-weapon-icon {
  width: 20px;
  height: 20px;
  border: 1px solid #2a2518;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #6a5c3c;
  flex-shrink: 0;
  margin-top: 1px;
}

.vs-weapon-info {
  flex: 1;
}

.vs-weapon-name {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  font-weight: 600;
  color: #d4c8a8;
  letter-spacing: 0.06em;
}

.vs-weapon-meta {
  font-size: 10px;
  color: #4a4030;
  letter-spacing: 0.02em;
  margin-top: 1px;
}

/* ── Ability lists ── */
.vs-abilities-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 10px;
}

.vs-abilities-col-label {
  font-family: 'Cinzel', serif;
  font-size: 8px;
  letter-spacing: 0.16em;
  color: #4a4030;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.vs-ability {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0;
}

.vs-ability-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.vs-ability-dot.red    { background: #c85a2a; }
.vs-ability-dot.green  { background: #5a9a5a; }
.vs-ability-dot.yellow { background: #c8a82a; }

.vs-ability-name {
  font-size: 10px;
  color: #a09070;
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
  background: radial-gradient(ellipse at 50% 80%, #1a140a 0%, #0a0b0d 70%);
}

.vs-portrait {
  position: relative;
  z-index: 1;
  height: 92%;
  object-fit: contain;
  object-position: bottom center;
  mask-image: linear-gradient(to top, #0a0b0d 0%, transparent 12%);
  -webkit-mask-image: linear-gradient(to top, #0a0b0d 0%, transparent 12%);
}

.vs-portrait-placeholder {
  position: relative;
  z-index: 1;
  width: 200px;
  height: 80%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 20px;
}

.vs-portrait-placeholder svg {
  opacity: 0.12;
}

/* ── Right column: location ── */
.vs-right {
  border-left: 1px solid #1a1810;
  padding: 20px 20px 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.vs-location-thumb {
  width: 100%;
  aspect-ratio: 16/9;
  background: #0d0f14;
  border: 1px solid #1a1810;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.vs-location-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.6;
}

.vs-location-placeholder {
  font-size: 10px;
  color: #2a2518;
  letter-spacing: 0.08em;
  font-family: 'Cinzel', serif;
}

.vs-location-title {
  font-family: 'Cinzel', serif;
  font-size: 14px;
  font-weight: 600;
  color: #d4c8a8;
  letter-spacing: 0.08em;
  line-height: 1.3;
}

.vs-location-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.vs-location-tag {
  font-family: 'Cinzel', serif;
  font-size: 8px;
  letter-spacing: 0.12em;
  color: #4a4030;
  text-transform: uppercase;
  border: 1px solid #2a2518;
  padding: 2px 6px;
  border-radius: 1px;
}

.vs-location-desc {
  font-size: 11px;
  color: #5a5040;
  line-height: 1.6;
}

/* ── Footer hint ── */
.vs-footer {
  border-top: 1px solid #1a1810;
  padding: 8px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  flex-shrink: 0;
}

.vs-hint {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  letter-spacing: 0.12em;
  color: #3a3020;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 5px;
}

.vs-hint-key {
  border: 1px solid #2a2518;
  padding: 1px 5px;
  font-size: 8px;
  border-radius: 2px;
  color: #4a4030;
}

/* ── Loading state ── */
.vs-loading {
  color: #3a3020;
  font-family: 'Cinzel', serif;
  font-size: 9px;
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

  root.innerHTML = `
    <!-- Tab bar -->
    <div class="vs-tabs">
      <span class="vs-tab-nav vs-tab-nav-arrow">◁</span>
      <span class="vs-tab-name vs-active" data-tab="ashley">Ashley</span>
      <span class="vs-tab-nav" data-tab="items">Items</span>
      <span class="vs-tab-nav" data-tab="equipment">Equipment</span>
      <span class="vs-tab-nav" data-tab="leamonde">Lea Monde</span>
      <span class="vs-tab-nav" data-tab="abilities">Abilities</span>
      <span class="vs-tab-nav" data-tab="magick">Magick</span>
      <span class="vs-tab-nav" data-tab="story">Story</span>
      <span class="vs-tab-nav vs-tab-nav-arrow" style="margin-left:auto">▷</span>
    </div>

    <!-- Body -->
    <div class="vs-body">

      <!-- Left: stats -->
      <div class="vs-left">
        <div class="vs-section-label">Rank</div>
        <div class="vs-section-value">Normal Agent</div>

        <div class="vs-divider"></div>

        <div class="vs-section-label">Overall Condition</div>
        <div class="vs-section-value" id="vs-condition">—</div>

        <div class="vs-divider"></div>

        <!-- HP -->
        <div class="vs-stats-row">
          <span class="vs-stat-label">HP</span>
          <div class="vs-stat-bar-track"><div class="vs-stat-bar-fill hp" id="vs-hp-bar" style="width:100%"></div></div>
          <span class="vs-stat-value" id="vs-hp-val"><span class="vs-loading">…</span></span>
        </div>
        <!-- MP -->
        <div class="vs-stats-row">
          <span class="vs-stat-label">MP</span>
          <div class="vs-stat-bar-track"><div class="vs-stat-bar-fill mp" id="vs-mp-bar" style="width:100%"></div></div>
          <span class="vs-stat-value" id="vs-mp-val"><span class="vs-loading">…</span></span>
        </div>
        <!-- Risk -->
        <div class="vs-stats-row">
          <span class="vs-stat-label">Risk</span>
          <div class="vs-stat-bar-track"><div class="vs-stat-bar-fill risk" id="vs-risk-bar" style="width:0%"></div></div>
          <span class="vs-stat-value" id="vs-risk-val"><span class="vs-loading">…</span></span>
        </div>

        <div class="vs-divider"></div>

        <!-- Weapons (static fixture for now) -->
        <div class="vs-section-label">Equipped</div>

        <div class="vs-weapon">
          <div class="vs-weapon-icon">✕</div>
          <div class="vs-weapon-info">
            <div class="vs-weapon-name">Fandango</div>
            <div class="vs-weapon-meta">Mace · Right hand</div>
          </div>
        </div>
        <div class="vs-weapon">
          <div class="vs-weapon-icon">?</div>
          <div class="vs-weapon-info">
            <div class="vs-weapon-name">Buckler</div>
            <div class="vs-weapon-meta">Offhand · Wood</div>
          </div>
        </div>

        <div class="vs-divider"></div>

        <!-- Abilities -->
        <div class="vs-abilities-row">
          <div>
            <div class="vs-abilities-col-label">Chain Abilities</div>
            <div class="vs-ability"><div class="vs-ability-dot red"></div><span class="vs-ability-name">Binary Shot</span></div>
            <div class="vs-ability"><div class="vs-ability-dot green"></div><span class="vs-ability-name">Snake Venom</span></div>
            <div class="vs-ability"><div class="vs-ability-dot yellow"></div><span class="vs-ability-name">Temper</span></div>
          </div>
          <div>
            <div class="vs-abilities-col-label">Defense</div>
          </div>
        </div>
      </div>

      <!-- Centre: portrait -->
      <div class="vs-portrait-col">
        <div class="vs-portrait-bg"></div>
        <div id="vs-portrait-wrap" class="vs-portrait-placeholder">
          <svg width="120" height="200" viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="60" cy="40" rx="28" ry="32" fill="#d4c8a8"/>
            <path d="M12 200 C12 130 108 130 108 200" fill="#d4c8a8"/>
          </svg>
        </div>
      </div>

      <!-- Right: location -->
      <div class="vs-right">
        <div class="vs-location-thumb">
          <span class="vs-location-placeholder">Location</span>
        </div>
        <div>
          <div class="vs-location-title">Entrance to Darkness</div>
          <div class="vs-location-meta">
            <span class="vs-location-tag">Ch 1</span>
            <span class="vs-location-tag">Catacombs</span>
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
      <span class="vs-hint"><span class="vs-hint-key">D</span> Close Menu</span>
      <span class="vs-hint"><span class="vs-hint-key">Esc</span> Close Menu</span>
    </div>
  `;

  return root;
}

// ── Live stat update ──────────────────────────────────────────────────────────

async function refreshStats(root: HTMLElement): Promise<void> {
  const host = getHost();
  if (!host?.peek) return;

  try {
    const bytes = await host.peek(PS1_STAT_BLOCK, STAT_BLOCK_LEN);
    const hpCur  = readU16LE(bytes, 0);
    const hpMax  = readU16LE(bytes, 2);
    const mpCur  = readU16LE(bytes, 4);
    const mpMax  = readU16LE(bytes, 6);
    const risk   = readU16LE(bytes, 8);

    const hpPct   = hpMax > 0 ? Math.round((hpCur / hpMax) * 100) : 0;
    const mpPct   = mpMax > 0 ? Math.round((mpCur / mpMax) * 100) : 0;
    const riskPct = Math.min(risk, 100);

    const hpBar  = root.querySelector<HTMLElement>("#vs-hp-bar");
    const mpBar  = root.querySelector<HTMLElement>("#vs-mp-bar");
    const riskBar = root.querySelector<HTMLElement>("#vs-risk-bar");

    if (hpBar)   hpBar.style.width   = `${hpPct}%`;
    if (mpBar)   mpBar.style.width   = `${mpPct}%`;
    if (riskBar) riskBar.style.width = `${riskPct}%`;

    const set = (id: string, text: string) => {
      const el = root.querySelector<HTMLElement>(id);
      if (el) el.textContent = text;
    };

    set("#vs-hp-val",   `${hpCur} / ${hpMax}`);
    set("#vs-mp-val",   `${mpCur} / ${mpMax}`);
    set("#vs-risk-val", `${risk}%`);

    // Derive overall condition from HP %
    const cond = hpPct > 75 ? "Good" : hpPct > 40 ? "Average" : hpPct > 15 ? "Poor" : "Critical";
    set("#vs-condition", cond);
  } catch {
    // worker not active yet — leave loading indicators
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
