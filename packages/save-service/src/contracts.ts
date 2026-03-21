/** Future: transactional save apply / rollback. */
export interface ISaveOperation {
  readonly id: string;
}

export interface IBackupStore {
  createBackup(label: string): Promise<ISaveOperation>;
  restore(op: ISaveOperation): Promise<void>;
}
