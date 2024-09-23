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
  name: string;
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

    const columns: Column[] = [];

    for (const parsedColumn of parsedJson.columns) {
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
      name: parsedJson.name,
      columns,
    };
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
  columns: string[];
}

class Table {
  constructor({
    tablePath,
    name,
    columns,
  }: {
    tablePath: string;
    name: string;
    columns: Column[];
  }) {
    this.tablePath = tablePath;
    this.name = name;
    this.columns = columns;
    this.logger = new Logger({ namespace: `Table - ${name}` });
  }

  public getName(): string {
    return this.name;
  }

  public setTables(tables: Table[]): void {
    this.tables = tables;
  }

  public async findAll(
    options: FindOptions = {
      columns: this.columns.map((column) => column.name),
    },
  ): Promise<Record<string, DataValue>[]> {
    const columns = options.columns.map((columnName) =>
      this.getColumnByName(columnName),
    );

    const rawData = await this.loadRawData();

    const filteredRawData = this.filterRawData(rawData, columns, options.where);

    return filteredRawData.map((row) => {
      return Object.fromEntries(
        columns.map((column) => {
          return [
            column.name,
            new DataValue(row[column.name] ?? null, column.dataType),
          ];
        }),
      );
    });
  }

  static async loadTableByPath(tablePath: string): Promise<Table> {
    const metadata = await getTableMetadataByPath(tablePath);

    return new Table({ tablePath: tablePath, ...metadata });
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
  private name: string;
  private columns: Column[];
  private tables: Table[] | null = null;
  private logger: Logger;
}

export { Table };
