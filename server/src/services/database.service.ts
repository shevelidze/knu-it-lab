import { Database } from '../lib/mega-db/database.class';

let instance: DatabaseService | null = null;

class DatabaseService {
  constructor() {
    if (instance) {
      return instance;
    }

    instance = this;
  }

  public getDatabase(): Database {
    if (this.database === null) {
      throw new Error('Database is not initialized');
    }

    return this.database;
  }

  public async initialize({
    databasePath,
  }: {
    databasePath: string;
  }): Promise<void> {
    this.database = new Database({ databasePath });
    await this.database.initialize();
  }

  private database: Database | null = null;
}

const databaseService = new DatabaseService();

export { databaseService };
