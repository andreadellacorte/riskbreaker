/** Placeholder for remappable actions → engine intents. */
export type InputBinding = {
  readonly actionId: string;
  readonly keys: readonly string[];
};

export class InputMappingModel {
  private readonly bindings: InputBinding[] = [];

  add(binding: InputBinding): void {
    this.bindings.push(binding);
  }

  all(): readonly InputBinding[] {
    return this.bindings;
  }
}
