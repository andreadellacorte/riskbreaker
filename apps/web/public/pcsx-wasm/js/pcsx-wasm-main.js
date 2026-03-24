"use strict";

/**
 * Boot: first file pick or click/key loads `pcsx_ww.js`; `var_setup()` in pcsx_ui.js
 * starts `pcsx_worker.js` and dispatches `pcsx-worker-ready`. If the user chose a disc
 * before the worker exists, we queue it and run `loaddisc` when ready (lrusso-style).
 */

let loadflg = false;
/** @type {File[] | null} */
let pendingDiscFiles = null;

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
  console.log("load pcsx_ww.js");
  const script = document.createElement("script");
  script.src = "pcsx_ww.js";
  document.body.appendChild(script);
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

async function postDiscToWorker(fileList) {
  const primary = pickPrimaryName(fileList);
  const parts = [];
  const transfers = [];
  for (const f of fileList) {
    const buf = await f.arrayBuffer();
    const name = discBasename(f);
    parts.push({ name, buffer: buf });
    transfers.push(buf);
  }
  pcsx_worker.postMessage(
    { cmd: "loaddisc", files: parts, primaryName: primary },
    transfers,
  );
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

async function runDiscLoad(fileArray) {
  if (!fileArray || fileArray.length === 0) return;
  if (typeof pcsx_worker === "undefined" || !pcsx_worker) {
    return;
  }

  setDiscInputsDisabled(true);
  try {
    logDisc("Reading " + fileArray.length + " file(s), primary: " + pickPrimaryName(fileArray));
    await postDiscToWorker(fileArray);
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
  if (!pendingDiscFiles || pendingDiscFiles.length === 0) return;
  if (typeof pcsx_worker === "undefined" || !pcsx_worker) return;
  const next = pendingDiscFiles;
  pendingDiscFiles = null;
  runDiscLoad(next);
}

async function onDiscFilesSelected(files) {
  if (!files || files.length === 0) return;

  const fileArray = Array.from(files);
  loadScript();

  if (typeof pcsx_worker !== "undefined" && pcsx_worker) {
    await runDiscLoad(fileArray);
    return;
  }

  pendingDiscFiles = fileArray;
}

document.getElementById("iso_opener").addEventListener("change", function (e) {
  onDiscFilesSelected(e.target.files);
  e.target.value = "";
});
