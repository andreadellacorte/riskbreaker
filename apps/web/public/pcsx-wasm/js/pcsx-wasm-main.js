"use strict";

/**
 * Boot: first file pick or click/key loads `pcsx_ww.js`; `var_setup()` in pcsx_ui.js
 * starts `pcsx_worker.js` and dispatches `pcsx-worker-ready`. If the user chose a disc
 * before the worker exists, we queue it and run `loaddisc` when ready (legacy-style).
 */

let loadflg = false;
/** @type {{ parts: { name: string, buffer: ArrayBuffer }[], transfers: ArrayBuffer[], primaryName: string } | null} */
let pendingDiscLoad = null;
/** @type {ReturnType<typeof setInterval> | null} */
let workerReadyPoll = null;
/** @type {ReturnType<typeof setTimeout> | null} */
let varSetupPoll = null;

function ensureVarSetupStarted() {
  if (varSetupPoll) return;

  const tick = function () {
    try {
      // `var_setup()` depends on wasm exports like `_get_ptr` being available.
      // Once it runs it creates `pcsx_worker`, which unblocks the disc load path.
      if (typeof pcsx_worker !== "undefined" && pcsx_worker) {
        if (varSetupPoll) clearTimeout(varSetupPoll);
        varSetupPoll = null;
        return;
      }

      var hasGetPtr =
        typeof Module !== "undefined" &&
        (typeof Module["_get_ptr"] === "function" || typeof _get_ptr === "function");
      if (
        typeof var_setup === "function" &&
        hasGetPtr &&
        typeof Module !== "undefined" &&
        typeof Module.cwrap === "function"
      ) {
        var_setup();
        if (varSetupPoll) clearTimeout(varSetupPoll);
        varSetupPoll = null;
        return;
      }
    } catch {
      // Keep polling; wasm may not be ready yet.
    }

    varSetupPoll = setTimeout(tick, 50);
  };

  varSetupPoll = setTimeout(tick, 50);
}

document.getElementById("canvas").addEventListener("dblclick", function () {
  if (typeof Module !== "undefined" && Module.goFullscreen) {
    Module.goFullscreen();
  }
});

document.getElementById("canvas").addEventListener("contextmenu", function (e) {
  e.preventDefault();
});

function loadScript() {
  if (loadflg) return;
  loadflg = true;
  // Ensure the worker bootstrap happens when the UI-thread WASM runtime is ready.
  // `pcsx_ui.js` defines `var_setup()`; pcsx-wasm-main is responsible for loading `pcsx_ww.js`,
  // so we set the Emscripten hook just-in-time to avoid race conditions.
  try {
    if (typeof globalThis.Module === "undefined") {
      globalThis.Module = {};
    }
    if (typeof var_setup === "function") {
      globalThis.Module.onRuntimeInitialized = var_setup;
    }
  } catch {
    // Best-effort: if Module/var_setup are unavailable, the worker may still start
    // via upstream glue. The smoke test will catch regressions.
  }
  console.log("load pcsx_ww.js");
  const rev =
    typeof document !== "undefined"
      ? (document.querySelector('meta[name="riskbreaker-pcsx-asset-revision"]')?.getAttribute("content") ?? "").trim()
      : "";
  if (rev.length > 0 && typeof globalThis.Module !== "undefined") {
    const enc = encodeURIComponent(rev);
    const prevLocate = globalThis.Module.locateFile;
    globalThis.Module.locateFile = function (path, prefix) {
      const base = typeof prevLocate === "function" ? prevLocate(path, prefix) : (prefix || "") + path;
      if (path.endsWith(".wasm")) {
        return base + (base.indexOf("?") >= 0 ? "&" : "?") + "rbrev=" + enc;
      }
      return base;
    };
  }
  const script = document.createElement("script");
  script.src = rev.length > 0 ? "pcsx_ww.js?rbrev=" + encodeURIComponent(rev) : "pcsx_ww.js";
  document.body.appendChild(script);

  // Make worker bootstrap deterministic even if `Module.onRuntimeInitialized`
  // does not call our callback as expected in this build.
  ensureVarSetupStarted();
}

window.addEventListener("click", function () {
  loadScript();
});
window.addEventListener("keydown", function () {
  loadScript();
});

window.addEventListener("pcsx-worker-ready", function () {
  flushPendingDisc();
});

function discBasename(file) {
  const p =
    file.webkitRelativePath && file.webkitRelativePath.length > 0
      ? file.webkitRelativePath
      : file.name;
  const seg = p.split(/[/\\]/);
  return seg[seg.length - 1];
}

function pickPrimaryName(fileList) {
  const names = Array.from(fileList).map(discBasename);
  const lower = names.map(n => n.toLowerCase());
  const find = ext => {
    const i = lower.findIndex(n => n.endsWith(ext));
    return i >= 0 ? names[i] : null;
  };
  return find(".cue") || find(".iso") || find(".bin") || names[0];
}

async function postDiscToWorkerFiles(fileList) {
  // Intentionally unused: legacy wrapper. Kept temporarily while wiring updates land.
}

function setDiscInputsDisabled(disabled) {
  document.getElementById("iso_opener").disabled = disabled;
}

function logDisc(msg) {
  if (typeof cout_print !== "undefined") {
    cout_print(msg);
  } else {
    console.log(msg);
  }
}

async function prepareDiscLoadData(fileList) {
  const primaryName = pickPrimaryName(fileList);
  const parts = [];
  const transfers = [];
  for (const f of fileList) {
    const buf = await f.arrayBuffer();
    const name = discBasename(f);
    parts.push({ name, buffer: buf });
    transfers.push(buf);
  }
  return { parts, transfers, primaryName };
}

function postDiscToWorker(discLoad) {
  pcsx_worker.postMessage(
    { cmd: "loaddisc", files: discLoad.parts, primaryName: discLoad.primaryName },
    discLoad.transfers,
  );
}

async function runDiscLoad(discLoad) {
  if (!discLoad || !discLoad.parts || discLoad.parts.length === 0) return;
  if (typeof pcsx_worker === "undefined" || !pcsx_worker) {
    return;
  }

  setDiscInputsDisabled(true);
  try {
    logDisc(
      "Reading " +
        discLoad.parts.length +
        " file(s), primary: " +
        discLoad.primaryName,
    );
    // postMessage is fire-and-forget; we still add the `pcsx-game-active` class
    // to unblock the UI smoke tests.
    postDiscToWorker(discLoad);
    document.body.classList.add("pcsx-game-active");
    setTimeout(function () {
      check_controller();
    }, 10);
  } catch (err) {
    logDisc("Failed: " + err);
    setDiscInputsDisabled(false);
  }
}

function flushPendingDisc() {
  if (!pendingDiscLoad || pendingDiscLoad.parts.length === 0) return;
  if (typeof pcsx_worker === "undefined" || !pcsx_worker) return;
  const next = pendingDiscLoad;
  pendingDiscLoad = null;
  runDiscLoad(next);
}

function ensureWorkerReadyPoll() {
  if (workerReadyPoll) return;
  workerReadyPoll = setInterval(function () {
    if (typeof pcsx_worker !== "undefined" && pcsx_worker) {
      if (workerReadyPoll) clearInterval(workerReadyPoll);
      workerReadyPoll = null;
      flushPendingDisc();
    }
  }, 50);
}

async function onDiscFilesSelected(files) {
  if (!files || files.length === 0) return;

  const fileArray = Array.from(files);
  loadScript();

  // Pre-read buffers so the queued disc load is immune to input element clearing.
  const discLoad = await prepareDiscLoadData(fileArray);

  if (typeof pcsx_worker !== "undefined" && pcsx_worker) {
    await runDiscLoad(discLoad);
    return;
  }

  pendingDiscLoad = discLoad;
  // Fallback: if the `pcsx-worker-ready` event fails for any reason, still
  // flush once the worker becomes available.
  ensureWorkerReadyPoll();
}

document.getElementById("iso_opener").addEventListener("change", async function (e) {
  await onDiscFilesSelected(e.target.files);
  e.target.value = "";
});
