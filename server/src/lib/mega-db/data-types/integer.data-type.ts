import { DataType } from '../data-type.interface';
import { EqualsOperationDataTypeMixin } from '../search-operations';

interface IntegerDataType extends DataType, EqualsOperationDataTypeMixin {
  name: 'integer';
}

const Integer = Object.freeze<IntegerDataType>({
  name: 'integer',
  validate(value: unknown): void {
    if (typeof value !== 'number' || isNaN(value) || !Number.isInteger(value)) {
      throw new Error('Value is not an integer');
    }
  },
  formatValue(value: unknown): string {
    return (value as number).toString();
  },
  equals(value: unknown, otherValue: unknown): boolean {
    return value === otherValue;
  },
  parseValue(value: string): number {
    return parseFloat(value);
  },
});

export { Integer };
