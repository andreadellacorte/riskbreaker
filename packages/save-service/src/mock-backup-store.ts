import type { IBackupStore, ISaveOperation } from "./contracts.js";

export class MockBackupStore implements IBackupStore {
  async createBackup(label: string): Promise<ISaveOperation> {
    return { id: `backup:${label}:${Date.now()}` };
  }

  async restore(op: ISaveOperation): Promise<void> {
    void op;
  }
}
