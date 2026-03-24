"use strict";
(() => {
  // src/fixtures/view-model-inventory.json
  var view_model_inventory_default = {
    screen: "inventory",
    title: "Inventory",
    columns: ["slot", "name", "category", "detail"],
    rows: [
      {
        slot: 0,
        name: "Rusty Broadsword",
        category: "weapon",
        detail: "Durability 42"
      },
      {
        slot: 1,
        name: "Healing Herb \xD73",
        category: "consumable",
        detail: "Restores HP"
      }
    ],
    characterSummary: "Ashley Riot \u2014 HP 120/120 \u2014 Risk 18"
  };

  // src/emulator-overlay-panel.ts
  var PSX_MAIN_RAM_SIZE = 2 * 1024 * 1024;
  var NTSC_U_NEW_GAME_ANCHORS = {
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
      accessory: "Rood Necklace"
    },
    miscItems: [
      { name: "Cure Root", qty: 10 },
      { name: "Vera Root", qty: 10 },
      { name: "Yggdrasil's Tears", qty: 5 },
      { name: "Faerie Chortle", qty: 5 },
      { name: "Spirit Orison", qty: 5 }
    ],
    miscSlots: { used: 5, total: 64 },
    gems: [],
    weaponsSheathed: true,
    bodyPartsStatus: "all-green"
  };
  function getHost() {
    return globalThis.__riskbreakerEmulatorHost;
  }
  function uint8ToBase64(bytes) {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function triggerDownload(filename, json) {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1e4);
  }
  async function dumpRam() {
    const host = getHost();
    if (!host?.peek) throw new Error("PCSX worker not active");
    const bytes = await host.peek(0, PSX_MAIN_RAM_SIZE);
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const filename = `vs-ram-dump-${timestamp.replace(/[:.]/g, "-")}.json`;
    const payload = JSON.stringify(
      {
        _note: "Vagrant Story NTSC-U RAM dump for RSK-mm02 offset discovery",
        game: "Vagrant Story",
        region: "NTSC-U",
        timestamp,
        ramSizeBytes: bytes.length,
        anchors: NTSC_U_NEW_GAME_ANCHORS,
        ram: uint8ToBase64(bytes)
      },
      null,
      2
    );
    triggerDownload(filename, payload);
  }
  function fixtureRows() {
    return view_model_inventory_default.rows.map((r) => ({
      label: String(r.name ?? ""),
      badge: String(r.category ?? ""),
      value: String(r.detail ?? "")
    }));
  }
  async function tryLiveRead() {
    const host = getHost();
    if (!host?.peek) return null;
    try {
      const bytes = await host.peek(0, PSX_MAIN_RAM_SIZE);
      return {
        summary: `Ashley Riot \u2014 live RAM (${bytes.length.toLocaleString()} bytes read)`,
        rows: [
          { label: "RAM read", badge: "live", value: `${bytes.length.toLocaleString()} bytes` },
          { label: "Inventory decode", badge: "todo", value: "offsets TBD \u2014 use Dump RAM" }
        ],
        note: "live \xB7 offsets unknown \xB7 RSK-mm02: dump RAM \u2192 scan anchors"
      };
    } catch {
      return null;
    }
  }
  function install() {
    const registry = globalThis.__riskbreakerOverlayPanels;
    if (!registry) {
      setTimeout(install, 0);
      return;
    }
    const panel = {
      id: "vagrant-story-items",
      heading: "Vagrant Story \u2014 Items",
      summary: view_model_inventory_default.characterSummary,
      rows: fixtureRows(),
      note: "fixture \xB7 click \u21BB when game is running for live RAM probe",
      actions: [
        {
          label: "\u2B07 Dump RAM",
          title: "Download 2 MB WASM heap as JSON (base64) for RSK-mm02 offset discovery",
          onClick: dumpRam
        }
      ],
      refresh: async () => {
        const live = await tryLiveRead();
        return live ?? {
          summary: view_model_inventory_default.characterSummary + " (worker inactive)",
          rows: fixtureRows(),
          note: "fixture fallback \xB7 PCSX worker not active"
        };
      }
    };
    registry.register(panel);
  }
  install();
})();
