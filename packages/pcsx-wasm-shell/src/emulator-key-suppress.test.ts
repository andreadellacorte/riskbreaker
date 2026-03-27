import { afterEach, describe, expect, it } from "vitest";

import { installKeySuppression } from "./emulator-key-suppress.js";

type Installed = typeof globalThis & {
  __riskbreakerApplyKeySuppression: (states: Uint8Array) => void;
  __riskbreakerSuppressButton: (pad: 0 | 1, btn: number) => void;
  __riskbreakerReleaseButton: (pad: 0 | 1, btn: number) => void;
};

function g(): Installed {
  return globalThis as Installed;
}

describe("installKeySuppression", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "__riskbreakerApplyKeySuppression");
    Reflect.deleteProperty(globalThis, "__riskbreakerSuppressButton");
    Reflect.deleteProperty(globalThis, "__riskbreakerReleaseButton");
  });

  it("installs globals", () => {
    installKeySuppression();
    expect(typeof g().__riskbreakerApplyKeySuppression).toBe("function");
    expect(typeof g().__riskbreakerSuppressButton).toBe("function");
    expect(typeof g().__riskbreakerReleaseButton).toBe("function");
  });

  it("no-ops when no buttons suppressed", () => {
    installKeySuppression();
    const states = new Uint8Array(48);
    // Set some bits to show they pass through untouched
    states[0] = 0b00000000; states[1] = 0b00000000;
    g().__riskbreakerApplyKeySuppression(states);
    expect(states[0]).toBe(0);
    expect(states[1]).toBe(0);
  });

  it("suppresses a button on pad 0", () => {
    installKeySuppression();
    // Suppress button 12 (TRIANGLE bit) on pad 0
    g().__riskbreakerSuppressButton(0, 12);
    const states = new Uint8Array(48);
    // states[0..1] = pad 0 key state (bit=1 means released in PS1 protocol)
    states[0] = 0x00; states[1] = 0x00; // all buttons pressed
    g().__riskbreakerApplyKeySuppression(states);
    // bit 12 should now be set (forced released)
    const ks = states[0] | (states[1] << 8);
    expect(ks & (1 << 12)).toBeTruthy();
  });

  it("releases a suppressed button", () => {
    installKeySuppression();
    g().__riskbreakerSuppressButton(0, 12);
    g().__riskbreakerReleaseButton(0, 12);
    const states = new Uint8Array(48);
    g().__riskbreakerApplyKeySuppression(states);
    const ks = states[0] | (states[1] << 8);
    expect(ks & (1 << 12)).toBe(0);
  });

  it("suppresses a button on pad 1", () => {
    installKeySuppression();
    g().__riskbreakerSuppressButton(1, 4);
    const states = new Uint8Array(48); // pad 1 starts at offset 24
    g().__riskbreakerApplyKeySuppression(states);
    const ks = states[24] | (states[25] << 8);
    expect(ks & (1 << 4)).toBeTruthy();
  });
});
