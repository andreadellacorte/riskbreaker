/**
 * RSK-vs12 / RSK-mm02: Vagrant Story overlay panel — registers with `window.__riskbreakerOverlayPanels`.
 * Loaded as a separate IIFE bundle on the emulator page; no imports from `packages/pcsx-wasm-shell`.
 *
 * "Dump RAM" button: reads 2 MB from WASM heap and downloads a JSON file with raw bytes (base64)
 * + known anchor context. Feed the file to a hex editor or the RSK-mm02 discovery scripts.
 */

import viewModelInventory from "./fixtures/view-model-inventory.json" with { type: "json" };

const PSX_MAIN_RAM_SIZE = 2 * 1024 * 1024;

/**
 * Known starting-state anchors for Vagrant Story NTSC-U (new game, no actions taken).
 * Used as metadata in the RAM dump to assist offset discovery (RSK-mm02).
 */
const NTSC_U_NEW_GAME_ANCHORS = {
  hp: 250,
  hpMax: 250,
  mp: 50,
  mpMax: 50,
  risk: 0,
  equip: {
    weapon: "Fandango",
    shield: "NONE",
    rArm: "Bandage",
    lArm: "Bandage",
    head: "Bandana",
    body: "Jerkin",
    legs: "Sandals",
    accessory: "Rood Necklace",
  },
  miscItems: [
    { name: "Cure Root", qty: 10 },
    { name: "Vera Root", qty: 10 },
    { name: "Yggdrasil's Tears", qty: 5 },
    { name: "Faerie Chortle", qty: 5 },
    { name: "Spirit Orison", qty: 5 },
  ],
  miscSlots: { used: 5, total: 64 },
  gems: [],
  weaponsSheathed: true,
  bodyPartsStatus: "all-green",
};

type Host = { peek?: (a: number, l: number) => Promise<Uint8Array> };

function getHost(): Host | undefined {
  return (globalThis as { __riskbreakerEmulatorHost?: Host }).__riskbreakerEmulatorHost;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function triggerDownload(filename: string, json: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function dumpRam(): Promise<void> {
  const host = getHost();
  if (!host?.peek) throw new Error("PCSX worker not active");

  const bytes = await host.peek(0, PSX_MAIN_RAM_SIZE);
  const timestamp = new Date().toISOString();
  const filename = `vs-ram-dump-${timestamp.replace(/[:.]/g, "-")}.json`;

  const payload = JSON.stringify(
    {
      _note: "Vagrant Story NTSC-U RAM dump for RSK-mm02 offset discovery",
      game: "Vagrant Story",
      region: "NTSC-U",
      timestamp,
      ramSizeBytes: bytes.length,
      anchors: NTSC_U_NEW_GAME_ANCHORS,
      ram: uint8ToBase64(bytes),
    },
    null,
    2,
  );

  triggerDownload(filename, payload);
}

interface OverlayPanelRow { label: string; value: string; badge?: string; }
interface OverlayPanelAction { label: string; title?: string; onClick: () => void | Promise<void>; }
interface OverlayPanel {
  id: string;
  heading: string;
  summary?: string;
  rows: OverlayPanelRow[];
  note?: string;
  actions?: OverlayPanelAction[];
  refresh?: () => Promise<Partial<Pick<OverlayPanel, "summary" | "rows" | "note">>>;
}

type FixtureRow = { name?: unknown; category?: unknown; detail?: unknown };

function fixtureRows(): OverlayPanelRow[] {
  return (viewModelInventory.rows as FixtureRow[]).map((r) => ({
    label: String(r.name ?? ""),
    badge: String(r.category ?? ""),
    value: String(r.detail ?? ""),
  }));
}

async function tryLiveRead(): Promise<Partial<Pick<OverlayPanel, "summary" | "rows" | "note">> | null> {
  const host = getHost();
  if (!host?.peek) return null;
  try {
    const bytes = await host.peek(0, PSX_MAIN_RAM_SIZE);
    // TODO(RSK-mm05): parse VS structs once offsets are identified from RAM dump analysis.
    return {
      summary: `Ashley Riot — live RAM (${bytes.length.toLocaleString()} bytes read)`,
      rows: [
        { label: "RAM read", badge: "live", value: `${bytes.length.toLocaleString()} bytes` },
        { label: "Inventory decode", badge: "todo", value: "offsets TBD — use Dump RAM" },
      ],
      note: "live · offsets unknown · RSK-mm02: dump RAM → scan anchors",
    };
  } catch {
    return null;
  }
}

function install(): void {
  const registry = (globalThis as typeof globalThis & {
    __riskbreakerOverlayPanels?: { register: (p: OverlayPanel) => void };
  }).__riskbreakerOverlayPanels;

  if (!registry) {
    setTimeout(install, 0);
    return;
  }

  const panel: OverlayPanel = {
    id: "vagrant-story-items",
    heading: "Vagrant Story — Items",
    summary: viewModelInventory.characterSummary,
    rows: fixtureRows(),
    note: "fixture · click ↻ when game is running for live RAM probe",
    actions: [
      {
        label: "⬇ Dump RAM",
        title: "Download 2 MB WASM heap as JSON (base64) for RSK-mm02 offset discovery",
        onClick: dumpRam,
      },
    ],
    refresh: async () => {
      const live = await tryLiveRead();
      return live ?? {
        summary: viewModelInventory.characterSummary + " (worker inactive)",
        rows: fixtureRows(),
        note: "fixture fallback · PCSX worker not active",
      };
    },
  };

  registry.register(panel);
}

install();
