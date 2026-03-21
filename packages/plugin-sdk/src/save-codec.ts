/** Browse / parse save data (placeholder surface for save-service). */
export interface ISaveCodec {
  readonly id: string;
  decodeSlot(data: Uint8Array): unknown;
}
