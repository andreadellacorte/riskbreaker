import type { GameManifest, PluginMetadata } from "@riskbreaker/shared-types";
import type { ICommandPack } from "./command-pack.js";
import type { IDomainPack } from "./domain-pack.js";
import type { IPatchPack } from "./patch-pack.js";
import type { ISaveCodec } from "./save-codec.js";
import type { IStateDecoder } from "./state-decoder.js";
import type { IUIScreenPack } from "./ui-screen-pack.js";

/** One game plugin: metadata + optional capability packs (mock or real). */
export interface IGamePlugin {
  readonly metadata: PluginMetadata;
  canHandle(manifest: GameManifest): boolean | Promise<boolean>;
  getStateDecoder(): IStateDecoder | null;
  getDomainPack(): IDomainPack | null;
  getCommandPack(): ICommandPack | null;
  getUIScreenPack(): IUIScreenPack | null;
  getSaveCodec(): ISaveCodec | null;
  getPatchPack(): IPatchPack | null;
}
