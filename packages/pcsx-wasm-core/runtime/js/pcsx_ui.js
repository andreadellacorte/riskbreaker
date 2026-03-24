"use strict";

var do_iter = true;

var Module = {
  preRun: [],
  postRun: [],
  print: (function () {
    return function (text) {
      if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
      console.log(text);
    };
  })(),
  printErr: function (text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
    console.error(text);
  },
  canvas: (function () {
    var canvas = document.getElementById('canvas');

    // As a default initial behavior, pop up an alert when webgl context is lost. To make your
    // application robust, you may want to override this behavior before shipping!
    // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
    canvas.addEventListener("webglcontextlost", function (e) { alert('WebGL context lost. You will need to reload the page.'); e.preventDefault(); }, false);

    return canvas;
  })(),


  // Emscripten 4 no longer exposes a global `Browser` object; keep fullscreen without library.js.
  goFullscreen: function () {
    var canvas = Module["canvas"];
    var el = canvas && canvas.parentNode;
    if (!el) return;
    var doc = document;
    var fsEl =
      doc.fullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement ||
      doc.webkitFullscreenElement;
    if (fsEl === el) {
      var exit =
        doc.exitFullscreen ||
        doc.mozCancelFullScreen ||
        doc.msExitFullscreen ||
        doc.webkitExitFullscreen;
      if (exit) exit.call(doc);
      return;
    }
    var req =
      el.requestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen ||
      el.webkitRequestFullscreen;
    if (req) req.call(el);
  },
  setStatus: function (text) {
    if (!Module.setStatus.last) Module.setStatus.last = { time: Date.now(), text: '' };
    if (text === Module.setStatus.text) return;
    var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
    var now = Date.now();
  const statusEl = document.getElementById('status');
  // Some shells don't include a `#status` element (e.g. headless/test harness).
  // Emscripten will still call setStatus during startup, so keep it null-safe.
  if (statusEl) statusEl.innerHTML = text;
    cout_print("setStatus: "+text);
  },
  totalDependencies: 0,
  monitorRunDependencies: function (left) {
    this.totalDependencies = Math.max(this.totalDependencies, left);
    Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies - left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
  }
};

window.onerror = function (event) {
  // TODO: do not warn on ok events like simulating an infinite loop or exitStatus
  Module.setStatus('Exception thrown, '+String(event));
  Module.setStatus = function (text) {
    if (text) Module.printErr('[post-exception status] ' + text);
  };
};

var img_data32;
function my_SDL_LockSurface(surf) {
  var surfData = SDL && SDL.surfaces ? SDL.surfaces[surf] : null;
  if (!surfData) return 0;
  if (typeof surfData.locked !== "number") surfData.locked = 0;
  surfData.locked++;
  if (surfData.locked > 1) return 0;

  if (!surfData.buffer) {
    surfData.buffer = _malloc(surfData.width * surfData.height * 4);
    cout_print("malloc " + surfData.buffer + "\n");
    HEAP32[(((surf) + (20)) >> 2)] = surfData.buffer;
  }

  // Mark in C/C++-accessible SDL structure
  // SDL_Surface has the following fields: Uint32 flags, SDL_PixelFormat *format; int w, h; Uint16 pitch; void *pixels; ...
  // So we have fields all of the same size, and 5 of them before us.
  // TODO: Use macros like in library.js
  HEAP32[(((surf) + (20)) >> 2)] = surfData.buffer;
  if (!surfData.image) {
    surfData.image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
  }
  return 0;
}
function my_SDL_UnlockSurface(surf) {
  assert(!SDL.GL); // in GL mode we do not keep around 2D canvases and contexts

  var surfData = SDL && SDL.surfaces ? SDL.surfaces[surf] : null;
  if (!surfData) return;

  if (!surfData.locked || --surfData.locked > 0) {
    return;
  }
  var data = surfData.image.data;
  var src = surfData.buffer >> 2;
  // Copy pixel data to image
  if (!img_data32)
  { img_data32 = new Uint32Array(data.buffer); }
  img_data32.set(HEAP32.subarray(src, src + img_data32.length));

  surfData.ctx.putImageData(surfData.image, 0, 0);
  // Note that we save the image, so future writes are fast. But, memory is not yet released
}


var padStatus1;
var padStatus2;
var vram_ptr;
var cout_print = Module.print;
var pcsx_worker;
var SoundFeedStreamData;

function var_setup() {
  SoundFeedStreamData = Module.cwrap("SoundFeedStreamData", "null", ["number", "number"]);
  vram_ptr = _get_ptr(0);
  padStatus1 = _get_ptr(1);
  padStatus2 = _get_ptr(2);  
  SDL.defaults.copyOnLock = false;
  SDL.defaults.opaqueFrontBuffer = false;
  cout_print("start worker")
  pcsx_worker = new Worker("pcsx_worker.js");
  pcsx_worker.onmessage = pcsx_worker_onmessage;
  // Expose worker globally so emulator-peek.ts / emulator-poke.ts can reach it.
  globalThis.__riskbreakerPcsxWorker = pcsx_worker;
  globalThis.__riskbreakerPcsxWorkerActive = true;
  globalThis.__riskbreakerPcsxPause = function() { pcsx_worker.postMessage({ cmd: "pause" }); };
  globalThis.__riskbreakerPcsxResume = function() { pcsx_worker.postMessage({ cmd: "resume" }); };
  // Signal pcsx-wasm-main that the worker exists so it can flush any queued disc loads.
  // (The Playwright smoke test waits for pcsx-game-active, which is set only after
  // the disc load actually runs.)
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pcsx-worker-ready"));
    }
  } catch {
    // Best-effort: if Event dispatch fails, disc loading may still work via other paths.
  }
  document.getElementById('iso_opener').disabled=false;
  var spinner = document.getElementById('spinner');
  if (spinner && spinner.parentElement) {
    spinner.parentElement.removeChild(spinner);
  }
  setTimeout("Module.setStatus('open an iso file using the above button.')", 2);
}

if (window.File && window.FileReader && window.FileList && window.Blob) {
} else {
  alert('The File APIs are not fully supported in this browser.')
  cout_print('The File APIs are not fully supported in this browser.');
}
/* // for future wakelock api
navigator.wakeLock.request("display")
  .then(() => cout_print("Display wakeLock OK\n"))
  .catch(() => cout_print("Display wakeLock failed\n"));
  
navigator.wakeLock.request("system")
  .then(() => cout_print("System wakeLock OK\n"))
  .catch(() => cout_print("System wakeLock failed\n"));
*/
var states_arrs = [];
var check_controller = function () {
  _CheckJoy();
  _CheckKeyboard();
  var states_src = HEAPU8.subarray(padStatus1, padStatus1 + 48);
  var states_arr;
  while (states_arrs.length > 50) {
    states_arrs.pop();
  }
  if (states_arrs.length > 0) {
    states_arr = states_arrs.pop();
    states_arr.set(states_src);
  }
  else {
    states_arr = new Uint8Array(states_src);
  }
  //if(stat!=65535)  cout_print(stat);
  pcsx_worker.postMessage({ cmd: "padStatus", states: states_arr }, [states_arr.buffer]);
  setTimeout("check_controller()", 10);
}

var file_list;
var pcsx_readfile = function (controller) {
  document.getElementById('iso_opener').disabled=true;  
  cout_print("pcsx_readfile\n");
  file_list = controller.files;
  pcsx_worker.postMessage({ cmd: "loadfile", file: controller.files[0] });
  setTimeout("check_controller()", 10);
  return;
}

function pcsx_worker_onmessage(event) {
  var data = event.data
  // cout_print("onmessage: "+data.cmd)
  switch (data.cmd) {
    case "print":
      cout_print("> " + data.txt);
      break
    case "setStatus":
      cout_print("cmd setStatus")
      Module.setStatus(data.txt);
      break
    case "setUI":
      var el = document.getElementById(data.key)      
      for (var k in data.properties) {
          el[k] = data.properties[k];
        }
      break
    case "render":
      var vram_arr = data.vram;
      HEAPU8.set(vram_arr, vram_ptr);
      pcsx_worker.postMessage({ cmd: "return_vram", vram: vram_arr }, [vram_arr.buffer]);
      _render(data.x, data.y, data.sx, data.sy, data.dx, data.dy, data.rgb24);
      break
    case "return_states":
      states_arrs.push(data.states)
      break;
    case "SoundFeedStreamData":
      var pSound_arr = data.pSound;
      var pSound_ptr = _malloc(pSound_arr.length);
      HEAPU8.set(pSound_arr, pSound_ptr);
      SoundFeedStreamData(pSound_ptr, data.lBytes);
      _free(pSound_ptr);
      break
    case "peek_result":
    case "peek_error":
    case "poke_result":
    case "pause_ack":
    case "resume_ack":
    case "savestate_result":
    case "savestate_error":
    case "loadstate_result":
    case "loadstate_error":
      // Handled by shell listeners on the main thread.
      break
    default:
      cout_print("unknown worker cmd " + data.cmd)
  }
}

// Emscripten runtime hook: once the UI thread runtime is ready, start the worker.
// PCSX-wasm expects `var_setup()` to create `pcsx_worker` and enable disc input.
//
// `Module` may be defined only after `pcsx_ww.js` is loaded, so we attach lazily.
(function attachOnRuntimeInitialized() {
  function tryAttach() {
    try {
      if (typeof Module !== "undefined") {
        Module.onRuntimeInitialized = var_setup;
        return;
      }
    } catch {
      // Ignore and keep polling.
    }
    setTimeout(tryAttach, 10);
  }
  tryAttach();
})();



