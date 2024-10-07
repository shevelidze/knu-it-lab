import fs from 'fs/promises';
import { MegaDbError } from './errors';
import { Logger } from './logger.class';
import { Table, TableMetadata } from './table.class';
import path from 'path';

type DatabaseOptions = {
  databasePath: string;
};

class Database {
  constructor({ databasePath }: DatabaseOptions) {
    this.databasePath = databasePath;
    this.logger = new Logger({ namespace: `Database - ${this.getName()}` });
  }

  static async createOnPath(databasePath: string): Promise<Database> {
    await fs.mkdir(databasePath, { recursive: true });

    const database = new Database({ databasePath });

    fs.mkdir(database.getTablesPath());

    await database.initialize();

    return database;
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

  public async createTable(name: string, metadata: unknown): Promise<Table> {
    const tables = this.getTables();

    if (tables.find((table) => table.getName() === name)) {
      throw new MegaDbError(`Table ${name} already exists`);
    }

    const tablePath = path.join(this.getTablesPath(), name);

    const table = await Table.createOnPath(
      tablePath,
      Table.parseMetadata(metadata),
    );
    table.setTables(tables);

    tables.push(table);

    return table;
  }

  public getName(): string {
    return path.basename(this.databasePath);
  }

  private async initializeTables(): Promise<void> {
    const tablesNames = await this.loadTablesNames();

    this.tables = await Promise.all(
      tablesNames.map(async (tableName) => {
        return Table.loadTableByPath(
          path.join(this.getTablesPath(), tableName),
        );
      }),
    );

    this.tables.forEach((table) => {
      table.setTables(this.tables as Table[]);
    });
  }

  private getTablesPath(): string {
    return path.join(this.databasePath, 'tables');
  }

  private async loadTablesNames(): Promise<string[]> {
    return await fs.readdir(this.getTablesPath());
  }

  private databasePath: string;
  private tables: Table[] | null = null;
  private logger: Logger;
}

export { Database };
