/** Minimal stub for `require("crypto")` in Emscripten glue (Node path only; never runs in browser). */
module.exports = {
  randomBytes(n) {
    const u = new Uint8Array(n);
    if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
      globalThis.crypto.getRandomValues(u);
    }
    return u;
  },
};
