/** Declarative screen ids / routes a plugin contributes (UX platform consumes later). */
export interface IUIScreenPack {
  readonly id: string;
  readonly screenIds: readonly string[];
}
