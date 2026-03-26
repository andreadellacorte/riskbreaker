var Module;
if (!Module) Module = {};
Module.setStatus = function (s) {
	postMessage({
		cmd: "print",
		txt: s
	});
};

var psxM_base = -1; // WASM heap offset of psxM (PS1 RAM base), set after disc load via _get_ptr(-3)

function cout_print(s) {
	postMessage({
		cmd: "print",
		txt: s
	});
}

function set_progress(k, r) {
	postMessage({
		cmd: "setUI",
		key: k + "_progress",
		properties: r
	});
}


function show_error(prefix) {
	return function (evt) {
		cout_print(prefix);
		cout_print(String(evt.target.error));
	}
}

Module['print'] = cout_print;
var vram_ptr, soundbuffer_ptr, isMute_ptr;
var vram_dels = 0,
	vram_cres = 0;
var vram_arrs = [];
var render = function (x, y, sx, sy, dx, dy, rgb24) {
	var vram_arr;
	var vram_src = HEAPU8.subarray(vram_ptr, vram_ptr + 1024 * 2048);
	while (vram_arrs.length > 10) {
		vram_arrs.pop();
		vram_dels++;
		//cout_print("delete vram "+vram_dels+"\n");
	}
	if (vram_arrs.length > 0) {
		vram_arr = vram_arrs.pop();
		vram_arr.set(vram_src);
	} else {
		vram_cres++;
		//cout_print("create vram "+vram_cres+"\n");
		vram_arr = new Uint8Array(vram_src);
	}
	postMessage({
		cmd: "render",
		x: x,
		y: y,
		sx: sx,
		sy: sy,
		dx: dx,
		dy: dy,
		rgb24: rgb24,
		vram: vram_arr
	}, [vram_arr.buffer]);
}
var pSound_arrs = [];
var SendSound = function (pSound_ptr, lBytes) {
	var pSound_arr;
	var pSound_src = HEAPU8.subarray(pSound_ptr, pSound_ptr + lBytes);
	while (pSound_arrs.length > 30) {
		pSound_arrs.pop();
	}
	if (pSound_arrs.length > 0) {
		pSound_arr = pSound_arrs.pop();
	} else {
		pSound_arr = new Uint8Array(4096);
	}

	pSound_arr.set(pSound_src);
	postMessage({
		cmd: "SoundFeedStreamData",
		pSound: pSound_arr,
		lBytes: lBytes
	}, [pSound_arr.buffer]);
}


var pcsx_paused = false;

function pcsx_mainloop() {
	if (!pcsx_paused) _one_iter();
}
var pcsx_init = Module.cwrap("pcsx_init", "number", ["string"])
var ls = Module.cwrap("ls", "null", ["string"])
var pcsx_SaveState = Module.cwrap("SaveState", "number", ["string"]);
var pcsx_LoadState = Module.cwrap("LoadState", "number", ["string"]);
var padStatus1;
var isoDB;

function mount_disc_and_run(files, primaryIsoBasename) {
	var i;
	for (i = 0; i < files.length; i++) {
		var part = files[i];
		FS.createDataFile("/", part.name, new Uint8Array(part.buffer), true, true);
		cout_print("mounted /" + part.name + " (" + part.buffer.byteLength + " bytes)");
	}
	Module.setStatus('Running!');
	pcsx_init("/" + primaryIsoBasename);
	padStatus1 = _get_ptr(-2);
	vram_ptr = _get_ptr(-1);
	soundbuffer_ptr = _get_ptr(7);
	isMute_ptr = _get_ptr(8);
	cout_print("before mainloop\n");
	psxM_base = _get_ptr(-3);
	cout_print("psxM_base = 0x" + psxM_base.toString(16) + "\n");
	pcsx_mainloop();
}

var readfile_and_run = function (iso_name, blob) {
	var run_arr = function (arr) {
		FS.createDataFile("/", iso_name, arr, true, true);
		Module.setStatus('Running!');
		pcsx_init("/" + iso_name);
		padStatus1 = _get_ptr(-2);
		vram_ptr = _get_ptr(-1);
		soundbuffer_ptr = _get_ptr(7);
		isMute_ptr = _get_ptr(8);
		cout_print("before mainloop\n");
		psxM_base = _get_ptr(-3);
		cout_print("psxM_base = 0x" + psxM_base.toString(16) + "\n");
		pcsx_mainloop();
	}
	cout_print("readfile and run ");
	var reader = new FileReader();
	Module.setStatus("reading file");
	reader.onprogress = function (e) {
		if (e.lengthComputable) {
			//cout_print(Math.round((e.loaded / e.total) * 100) + "%");
			set_progress('readfile', {
				value: e.loaded,
				max: e.total,
				hidden: false
			});
		} else
			cout_print(e.loaded + "bytes")
		//document.getElementById("start").disabled=false
	}
	reader.onload = function (e) {
		cout_print("" + iso_name + " loaded");
		set_progress('readfile', {
			value: 1,
			max: 1,
			hidden: false
		});
		run_arr(new Uint8Array(this.result))
	}
	reader.readAsArrayBuffer(blob);
}

var event_history = [];
var clear_event_history = function () {
	self.onmessage = main_onmessage;
	for (var i in event_history) {
		main_onmessage(event_history[i]);
	}
	event_history = [];
	Module.setStatus = function (s) {
		postMessage({
			cmd: "setStatus",
			txt: s
		});
	};
	setTimeout("Module.setStatus('Open an iso file using the above button(worker ready!).')", 1);
}
var pre_onmessage = function (event) {
	if (event.data.cmd != 'soundBytes') {
		event_history.push(event);
		cout_print("push event" + event.data.cmd);
	}
}
self.onmessage = pre_onmessage;
var main_onmessage = function (event) {
	var data = event.data;
	switch (data.cmd) {

		case "padStatus":
			HEAPU8.set(data.states, padStatus1);
			postMessage({
				cmd: "return_states",
				states: data.states
			}, [data.states.buffer]);
			//Module.setValue(soundbuffer_ptr, data.soundbuffer, "i32");
			break;

		case "soundBytes":
			Module.setValue(soundbuffer_ptr, Module.getValue(soundbuffer_ptr, "i32") - data.lBytes, "i32");
			break;

		case "return_vram":
			vram_arrs.push(data.vram)
			break;

		case "return_pSound":
			pSound_arrs.push(data.pSound)
			break;

		case "ls":
			ls(data.dir);
			break;
		case "loadfile":
			Module.setStatus('Downloading...');
			cout_print(data.file.name)
			readfile_and_run(data.file.name, data.file);
			break;

		case "loaddisc":
			Module.setStatus('Mounting disc image...');
			cout_print("loaddisc primary=" + data.primaryName + " parts=" + data.files.length);
			mount_disc_and_run(data.files, data.primaryName);
			break;

		case "loadurl":
			cout_print("load..." + data.iso);

			load_or_fetch(data.iso)

			break;

		case "pause":
			pcsx_paused = true;
			postMessage({ cmd: "pause_ack" });
			break;

		case "resume":
			pcsx_paused = false;
			postMessage({ cmd: "resume_ack" });
			break;

		case "peek":
			var peekLo = data.address >>> 0;
			var peekLen = (data.length >>> 0) || 4;
			var heapBase = psxM_base >= 0 ? psxM_base : 0;
			var absLo = heapBase + peekLo;
			if (absLo + peekLen <= HEAPU8.length) {
				var peekCopy = HEAPU8.slice(absLo, absLo + peekLen);
				postMessage({ cmd: "peek_result", reqId: data.reqId, data: peekCopy }, [peekCopy.buffer]);
			} else {
				postMessage({ cmd: "peek_error", reqId: data.reqId, msg: "address out of range" });
			}
			break;

		case "poke":
			var pokeLo = data.address >>> 0;
			var pokeBytes = new Uint8Array(data.data);
			var heapBase = psxM_base >= 0 ? psxM_base : 0;
			var absLo = heapBase + pokeLo;
			if (absLo + pokeBytes.length <= HEAPU8.length) {
				HEAPU8.set(pokeBytes, absLo);
				postMessage({ cmd: "poke_result", reqId: data.reqId, ok: true });
			} else {
				postMessage({ cmd: "poke_result", reqId: data.reqId, ok: false, msg: "address out of range" });
			}
			break;

		case "vram":
		if (vram_ptr && vram_ptr > 0) {
			var vramCopy = HEAPU8.slice(vram_ptr, vram_ptr + 1024 * 512 * 2);
			postMessage({ cmd: "vram_result", reqId: data.reqId, data: vramCopy }, [vramCopy.buffer]);
		} else {
			postMessage({ cmd: "vram_error", reqId: data.reqId, msg: "vram not initialised — disc may not be running" });
		}
		break;

	case "cd-file":
		try {
			var cdPath = "/" + (data.filename || "");
			var cdBytes = FS.readFile(cdPath);
			postMessage({ cmd: "cd-file_result", reqId: data.reqId, data: cdBytes }, [cdBytes.buffer]);
		} catch (e) {
			postMessage({ cmd: "cd-file_error", reqId: data.reqId, msg: String(e) });
		}
		break;

	case "savestate":
			try {
				var ret = pcsx_SaveState("/save.state");
				if (ret !== 0) {
					postMessage({ cmd: "savestate_error", reqId: data.reqId, msg: "SaveState returned " + ret });
					break;
				}
				var bytes = FS.readFile("/save.state");
				postMessage({ cmd: "savestate_result", reqId: data.reqId, data: bytes }, [bytes.buffer]);
			} catch (e) {
				postMessage({ cmd: "savestate_error", reqId: data.reqId, msg: String(e) });
			}
			break;

		case "loadstate":
			try {
				var stateBytes = new Uint8Array(data.data);
				FS.writeFile("/load.state", stateBytes);
				var ret = pcsx_LoadState("/load.state");
				if (ret !== 0) {
					postMessage({ cmd: "loadstate_error", reqId: data.reqId, msg: "LoadState returned " + ret });
				} else {
					postMessage({ cmd: "loadstate_result", reqId: data.reqId, ok: true });
				}
			} catch (e) {
				postMessage({ cmd: "loadstate_error", reqId: data.reqId, msg: String(e) });
			}
			break;

		default:
			postMessage({
				cmd: "print",
				txt: "unknown command " + data.cmd
			})
	}
}
cout_print("worker started\n");
onerror = function (event) {
	// TODO: do not warn on ok events like simulating an infinite loop or exitStatus
	Module.setStatus('Exception thrown, see JavaScript console ' + String(event));
};
