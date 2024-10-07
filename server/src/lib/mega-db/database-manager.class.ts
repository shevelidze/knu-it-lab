import fs from 'fs/promises';
import path from 'path';
import { Logger } from './logger.class';
import { Database } from './database.class';
import { MegaDbError } from './errors';

class DatabaseManager {
  constructor({ path }: { path: string }) {
    this.path = path;
    this.logger = new Logger({ namespace: 'DatabaseManager' });
    this.databases = null;
  }

  public async initialize(): Promise<void> {
    this.logger.log('Initializing database manager');

    const databasesNames = await this.loadDatabasesNames();

    this.databases = await Promise.all(
      databasesNames.map(async (databaseName) => {
        const database = new Database({
          databasePath: this.getDatabasePath(databaseName),
        });

        await database.initialize();

        return database;
      }),
    );

    this.logger.log('Database manager initialized');
  }

  public getDatabaseByName(name: string): Database {
    if (this.databases === null) {
      throw new MegaDbError('Database manager is not initialized');
    }

    const database = this.databases.find(
      (database) => database.getName() === name,
    );

    if (database === undefined) {
      throw new MegaDbError(`Database ${name} not found`);
    }

    return database;
  }

  public getDatabases(): Database[] {
    if (this.databases === null) {
      throw new MegaDbError('Database manager is not initialized');
    }

    return this.databases;
  }

  public async createDatabase(name: string): Promise<Database> {
    const databases = this.getDatabases();

    if (databases.some((database) => database.getName() === name)) {
      throw new MegaDbError(`Database ${name} already exists`);
    }

    const databasePath = this.getDatabasePath(name);

    const database = await Database.createOnPath(databasePath);

    databases.push(database);

    return database;
  }

  public getDatabasePath(name: string): string {
    return path.join(this.path, name);
  }

  private async loadDatabasesNames(): Promise<string[]> {
    return await fs.readdir(this.path);
  }

  private path: string;
  private logger: Logger;
  private databases: Database[] | null;
}

export { DatabaseManager };
