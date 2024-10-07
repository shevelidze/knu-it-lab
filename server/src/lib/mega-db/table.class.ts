import fs from 'fs/promises';
import path from 'path';
import { Column } from './column.class';
import { MegaDbError, UnsupportedSearchOperationError } from './errors';
import { Logger } from './logger.class';
import { SO } from './search-operation.enum';
import { DataValue } from './data-value.class';
import {
  doesDataTypeSupportEqualsOperation,
  doesDataTypeSupportPatternOperation,
} from './search-operations';
import { DataTypes } from './data-types';

interface TableMetadata {
  columns: Column[];
}

async function getTableMetadataByPath(
  tablePath: string,
): Promise<TableMetadata> {
  const tableFolderStat = await fs.stat(tablePath);

  if (!tableFolderStat.isDirectory()) {
    throw new MegaDbError(`Expected a directory at ${tablePath}.`);
  }

  const metadataFile = path.join(tablePath, 'metadata.json');

  try {
    const metadataFileContent = await fs.readFile(metadataFile, {
      encoding: 'utf-8',
    });

    const parsedJson = JSON.parse(metadataFileContent);

    return Table.parseMetadata(parsedJson);
  } catch {
    throw new MegaDbError(`Table metadata not found at ${metadataFile}.`);
  }
}

type SearchExpression =
  | {
      [SO.AND]: SearchExpression[];
    }
  | {
      [SO.OR]: SearchExpression[];
    }
  | {
      [key in string]:
        | {
            [SO.EQUAL]: unknown;
          }
        | {
            [SO.PATTERN]: string;
          };
    };

interface FindOptions {
  where?: SearchExpression;
  limit?: number;
  offset?: number;
  columns?: string[];
}

interface DeleteOptions {
  where?: SearchExpression;
}

interface InsertOneOptions {
  value: Record<string, string>;
}

interface UpdateAllOptions {
  where: SearchExpression;
  value: Record<string, string>;
}

class Table {
  constructor({
    tablePath,
    columns,
  }: {
    tablePath: string;
    columns: Column[];
  }) {
    this.tablePath = tablePath;
    this.columns = columns;
    this.logger = new Logger({ namespace: `Table - ${this.getName()}` });
  }

  static async createOnPath(
    tablePath: string,
    metadata: TableMetadata,
  ): Promise<Table> {
    fs.mkdir(tablePath, { recursive: true });

    const table = new Table({ tablePath, columns: metadata.columns });

    await table.saveData([]);
    await table.saveMetadata();

    return table;
  }

  static parseMetadata(target: unknown): TableMetadata {
    const columns: Column[] = [];

    for (const parsedColumn of (target as any).columns) {
      const dataType = Object.values(DataTypes).find(
        (dataType) => dataType.name === parsedColumn.dataType,
      );

      if (!dataType) {
        throw new MegaDbError(
          `Data type ${parsedColumn.dataType} not found for column ${parsedColumn.name}`,
        );
      }

      columns.push(new Column(parsedColumn.name, dataType));
    }

    return {
      columns,
    };
  }

  public async delete(): Promise<void> {
    const tables = this.getTablesOrThrow();

    const tableIndex = tables.findIndex((table) => table === this);

    if (tableIndex === -1) {
      throw new MegaDbError('Table not found in tables');
    }

    tables.splice(tableIndex, 1);

    await fs.rm(this.tablePath, { recursive: true });
  }

  public getName(): string {
    return path.basename(this.tablePath);
  }

  public setTables(tables: Table[]): void {
    this.tables = tables;
  }

  public async findAll(
    options: FindOptions = {},
  ): Promise<Record<string, DataValue | null>[]> {
    const columns = (
      options.columns ?? this.columns.map((column) => column.name)
    ).map((columnName) => this.getColumnByName(columnName));

    const rawData = await this.loadRawData();

    const filteredRawData = this.filterRawData(rawData, columns, options.where);

    return filteredRawData.map((row) => {
      return this.mapRawRow(row, columns);
    });
  }

  public async deleteAll(
    options: DeleteOptions = {},
  ): Promise<Record<string, DataValue>[]> {
    const rawData = await this.loadRawData();

    const dataToReturn: typeof rawData = [];
    const dataToSave: typeof rawData = [];

    for (const row of rawData) {
      if (this.evaluateSearchExpression(row, this.columns, options.where)) {
        dataToReturn.push(row);
      } else {
        dataToSave.push(row);
      }
    }

    await this.saveData(dataToSave);

    return dataToReturn.map((row) => {
      return this.mapRawRow(row, this.columns);
    });
  }

  public getColumns(): Column[] {
    return this.columns;
  }

  public async updateAll(
    options: UpdateAllOptions,
  ): Promise<Record<string, DataValue>[]> {
    const rawData = await this.loadRawData();

    const updatedData: typeof rawData = rawData.map((row) => {
      const rowCopy = { ...row };

      if (!this.evaluateSearchExpression(row, this.columns, options.where)) {
        return rowCopy;
      }

      for (const column of this.columns) {
        if (column.name in options.value) {
          const unparsedValue = options.value[column.name];

          if (unparsedValue === null) {
            rowCopy[column.name] = null;
          } else if (unparsedValue !== undefined) {
            rowCopy[column.name] = column.dataType.parseValue(unparsedValue);
          }
        }
      }

      return rowCopy;
    });

    await this.saveData(updatedData);

    return updatedData.map((row) => {
      return this.mapRawRow(row, this.columns);
    });
  }

  public async insertOne(
    options: InsertOneOptions,
  ): Promise<Record<string, DataValue>> {
    const rawData = await this.loadRawData();

    const valueToInsert: Record<string, DataValue> = {};

    for (const column of this.columns) {
      if (column.name in options.value) {
        const unparsedValue = options.value[column.name];

        if (unparsedValue === null) {
          continue;
        }

        valueToInsert[column.name] = new DataValue(
          column.dataType.parseValue(unparsedValue),
          column.dataType,
        );
      }
    }

    const rawValueToInsert = Object.fromEntries(
      this.columns.map((column) => {
        return [
          column.name,
          valueToInsert[column.name]
            ? valueToInsert[column.name].getValue()
            : null,
        ];
      }),
    );

    rawData.push(rawValueToInsert);

    await this.saveData(rawData);

    return valueToInsert;
  }

  static async loadTableByPath(tablePath: string): Promise<Table> {
    const metadata = await getTableMetadataByPath(tablePath);

    return new Table({
      tablePath: tablePath,
      ...metadata,
    });
  }

  private mapRawRow(
    row: Record<string, unknown>,
    columns: Column[],
  ): Record<string, DataValue> {
    return Object.fromEntries(
      columns.map((column) => {
        return [column.name, new DataValue(row[column.name], column.dataType)];
      }),
    );
  }

  private async saveData(data: Record<string, unknown>[]): Promise<void> {
    const dataFile = path.join(this.tablePath, 'data.json');

    await fs.writeFile(dataFile, JSON.stringify(data, null, 2), {
      encoding: 'utf-8',
    });
  }

  private async saveMetadata(): Promise<void> {
    const metadataToSave = {
      columns: this.columns.map((column) => {
        return {
          name: column.name,
          dataType: column.dataType.name,
        };
      }),
    };

    const metadataFile = path.join(this.tablePath, 'metadata.json');

    await fs.writeFile(metadataFile, JSON.stringify(metadataToSave, null, 2), {
      encoding: 'utf-8',
    });
  }

  private filterRawData(
    rawData: Record<string, unknown>[],
    columns: Column[],
    search?: SearchExpression,
  ): Record<string, unknown>[] {
    return rawData.filter((row) => {
      return this.evaluateSearchExpression(row, columns, search);
    });
  }

  private evaluateSearchExpression(
    row: Record<string, unknown>,
    columns: Column[],
    searchExpression?: SearchExpression,
  ): boolean {
    if (!searchExpression) {
      return true;
    }

    const searchExpressionCopy = { ...searchExpression };

    if (SO.AND in searchExpressionCopy) {
      const expressions = searchExpressionCopy[SO.AND] as SearchExpression[];

      if (
        !expressions.every((expression) =>
          this.evaluateSearchExpression(row, columns, expression),
        )
      ) {
        return false;
      }

      delete (searchExpressionCopy as any)[SO.AND];
    }

    if (SO.OR in searchExpressionCopy) {
      const expressions = searchExpressionCopy[SO.OR] as SearchExpression[];

      if (
        !expressions.some((expression) =>
          this.evaluateSearchExpression(row, columns, expression),
        )
      ) {
        return false;
      }

      delete (searchExpressionCopy as any)[SO.OR];
    }

    for (const [columnName, operation] of Object.entries(
      searchExpressionCopy,
    )) {
      const column = this.getColumnByName(columnName);
      const columnValue = row[columnName];
      const operationType = Object.keys(operation)[0];
      const operationValue = (operation as any)[operationType];

      switch (operationType) {
        case SO.EQUAL:
          if (!doesDataTypeSupportEqualsOperation(column.dataType)) {
            throw new UnsupportedSearchOperationError(SO.EQUAL, column);
          }

          if (!column.dataType.equals(columnValue, operationValue)) {
            return false;
          }

          break;
        case SO.PATTERN:
          if (!doesDataTypeSupportPatternOperation(column.dataType)) {
            throw new UnsupportedSearchOperationError(SO.PATTERN, column);
          }

          if (!column.dataType.doesMatchPattern(columnValue, operationValue)) {
            return false;
          }

          break;
        default:
          throw new MegaDbError(`Unknown operation ${operationType}`);
      }
    }

    return true;
  }

  private async loadRawData(): Promise<Record<string, unknown>[]> {
    const dataFile = path.join(this.tablePath, 'data.json');

    try {
      const dataFileContent = await fs.readFile(dataFile, {
        encoding: 'utf-8',
      });

      return JSON.parse(dataFileContent);
    } catch {
      throw new MegaDbError(`Table data not found at ${dataFile}.`);
    }
  }

  private getColumnByName(columnName: string): Column {
    const column = this.columns.find((c) => c.name === columnName);

    if (!column) {
      throw new MegaDbError(`Column ${columnName} not found`);
    }

    return column;
  }

  private getTablesOrThrow(): Table[] {
    if (this.tables === null) {
      throw new MegaDbError('Table is not initialized');
    }

    return this.tables;
  }

  private tablePath: string;
  private columns: Column[];
  private tables: Table[] | null = null;
  private logger: Logger;
}

export { Table, type TableMetadata };
