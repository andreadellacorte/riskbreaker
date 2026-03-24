/**
 * RSK-vs12: generic overlay panel registry.
 * Plugins register panels here; the overlay renders them without knowing plugin specifics.
 */

export interface OverlayPanelRow {
  label: string;
  value: string;
  badge?: string;
}

export interface OverlayPanelAction {
  label: string;
  title?: string;
  onClick: () => void | Promise<void>;
}

export interface OverlayPanel {
  id: string;
  heading: string;
  summary?: string;
  rows: OverlayPanelRow[];
  note?: string;
  /** Extra buttons rendered below the heading row. */
  actions?: OverlayPanelAction[];
  /** Called when the user clicks the ↻ button; resolves with an updated patch. */
  refresh?: () => Promise<Partial<Pick<OverlayPanel, "summary" | "rows" | "note">>>;
}

const registry = new Map<string, OverlayPanel>();

export function registerOverlayPanel(panel: OverlayPanel): void {
  registry.set(panel.id, panel);
}

export function getOverlayPanels(): OverlayPanel[] {
  return [...registry.values()];
}

/** Update a panel in place (e.g. after refresh). */
export function patchOverlayPanel(
  id: string,
  patch: Partial<Pick<OverlayPanel, "summary" | "rows" | "note">>,
): void {
  const existing = registry.get(id);
  if (!existing) return;
  registry.set(id, { ...existing, ...patch });
}

declare global {
  interface Window {
    __riskbreakerOverlayPanels?: {
      register: (panel: OverlayPanel) => void;
    };
  }
}

/** Expose registration to externally-loaded plugin scripts. */
export function installOverlayPanelRegistry(): void {
  window.__riskbreakerOverlayPanels = { register: registerOverlayPanel };
}
