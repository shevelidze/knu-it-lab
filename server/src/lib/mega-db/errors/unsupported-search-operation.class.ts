import { Column } from '../column.class';
import { MegaDbError } from './error.class';

class UnsupportedSearchOperationError extends MegaDbError {
  constructor(operation: string, column: Column) {
    super(
      `Operation ${operation} not supported for ${column.dataType.name} of column ${column.name}`,
    );
  }
}

export { UnsupportedSearchOperationError };
