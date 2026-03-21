import type { IStateDecoder } from "@riskbreaker/plugin-sdk";

/** Register multiple decoders (e.g. hot-swap plugins) without game-specific types here. */
export class DecoderRegistry {
  private readonly byId = new Map<string, IStateDecoder>();

  register(decoder: IStateDecoder): void {
    this.byId.set(decoder.id, decoder);
  }

  get(id: string): IStateDecoder | undefined {
    return this.byId.get(id);
  }

  list(): readonly IStateDecoder[] {
    return [...this.byId.values()];
  }
}
