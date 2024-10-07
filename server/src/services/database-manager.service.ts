import { DatabaseManager } from '../lib/mega-db';

let instance: DatabaseManagerService | null = null;

class DatabaseManagerService {
  constructor() {
    if (instance) {
      return instance;
    }

    instance = this;
  }

  public getDatabaseManager(): DatabaseManager {
    if (this.databaseManager === null) {
      throw new Error('Database is not initialized');
    }

    return this.databaseManager;
  }

  public async initialize({ path }: { path: string }): Promise<void> {
    this.databaseManager = new DatabaseManager({ path });
    await this.databaseManager.initialize();
  }

  private databaseManager: DatabaseManager | null = null;
}

const databaseManagerService = new DatabaseManagerService();

export { databaseManagerService };
