export type ScreenId = string;

export type RegisteredScreen = {
  readonly id: ScreenId;
  readonly pluginId: string;
  readonly label?: string;
};

/** Collects plugin-contributed screens for the web shell (Harness 05+). */
export class ScreenRegistry {
  private readonly screens: RegisteredScreen[] = [];

  register(screen: RegisteredScreen): void {
    this.screens.push(screen);
  }

  list(): readonly RegisteredScreen[] {
    return this.screens;
  }
}
