import { DataType } from '../data-type.interface';
import { EqualsOperationDataTypeMixin } from '../search-operations';

interface CharDataType extends DataType, EqualsOperationDataTypeMixin {
  name: 'char';
}

const Char: CharDataType = Object.freeze<CharDataType>({
  name: 'char',
  validate(value: unknown): void {
    if (typeof value !== 'string' || value.length !== 1) {
      throw new Error('Value is not a char');
    }
  },
  formatValue(value: unknown): any {
    return `'${value}'`;
  },
  equals(value: unknown, otherValue: unknown): boolean {
    return value === otherValue;
  },
  parseValue(value: string): string {
    return value;
  },
});

export { Char };
