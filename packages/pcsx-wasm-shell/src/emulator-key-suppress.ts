const PAD_STRIDE = 24;
const suppressMasks: [number, number] = [0, 0];

export function installKeySuppression(): void {
  (globalThis as any).__riskbreakerApplyKeySuppression = (states: Uint8Array): void => {
    for (let p = 0; p < 2; p++) {
      if (suppressMasks[p] === 0) continue;
      const off = p * PAD_STRIDE;
      const ks = states[off] | (states[off + 1] << 8);
      const masked = ks | suppressMasks[p]; // bit=1 → released
      states[off]     = masked & 0xff;
      states[off + 1] = (masked >> 8) & 0xff;
    }
  };

  (globalThis as any).__riskbreakerSuppressButton = (pad: 0 | 1, btn: number): void => {
    suppressMasks[pad] |= (1 << btn);
  };
  (globalThis as any).__riskbreakerReleaseButton = (pad: 0 | 1, btn: number): void => {
    suppressMasks[pad] &= ~(1 << btn);
  };
}
