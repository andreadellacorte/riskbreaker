import type { GameManifest } from "@riskbreaker/shared-types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Parse JSON object into `GameManifest` with minimal validation. */
export class GameManifestBuilder {
  buildFromUnknown(data: unknown): GameManifest {
    if (!isRecord(data)) {
      throw new Error("GameManifestBuilder: expected object");
    }
    const title = data.title;
    const titleId = data.titleId;
    const region = data.region;
    const version = data.version;
    const discFormat = data.discFormat;
    const pluginHints = data.pluginHints;
    if (
      typeof title !== "string" ||
      typeof titleId !== "string" ||
      typeof region !== "string" ||
      typeof version !== "string" ||
      typeof discFormat !== "string" ||
      !Array.isArray(pluginHints) ||
      !pluginHints.every((h) => typeof h === "string")
    ) {
      throw new Error("GameManifestBuilder: invalid manifest shape");
    }
    const executableHash = data.executableHash;
    return {
      title,
      titleId,
      region,
      version,
      discFormat,
      pluginHints,
      ...(typeof executableHash === "string" ? { executableHash } : {}),
    };
  }
}
