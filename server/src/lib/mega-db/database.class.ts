import fs from 'fs/promises';
import { MegaDbError } from './errors';
import { Logger } from './logger.class';
import { Table } from './table.class';
import path from 'path';

type DatabaseOptions = {
  databasePath: string;
};

class Database {
  constructor({ databasePath }: DatabaseOptions) {
    this.databasePath = databasePath;
    this.logger = new Logger({ namespace: 'Database' });
  }

  public async initialize(): Promise<void> {
    this.logger.log('Initializing database');
    await this.initializeTables();
    this.logger.log('Database initialized');
  }

  public getTableByName(name: string): Table {
    const tables = this.getTables();

    const table = tables.find((table) => table.getName() === name);

    if (table === undefined) {
      throw new MegaDbError(`Table ${name} not found`);
    }

    return table;
  }

  public getTables(): Table[] {
    if (this.tables === null) {
      throw new MegaDbError('Database is not initialized');
    }

    return this.tables;
  }

  private async initializeTables(): Promise<void> {
    const tablesNames = await this.getTablesNames();

    this.tables = await Promise.all(
      tablesNames.map(async (tableName) => {
        return Table.loadTableByPath(path.join(this.databasePath, tableName));
      }),
    );

    this.tables.forEach((table) => {
      table.setTables(this.tables as Table[]);
    });
  }

  private async getTablesNames(): Promise<string[]> {
    return await fs.readdir(this.databasePath);
  }

  private databasePath: string;
  private tables: Table[] | null = null;
  private logger: Logger;
}

export { Database };
