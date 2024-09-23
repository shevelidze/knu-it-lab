import { DataType } from '../data-type.interface';
import { EqualsOperationDataTypeMixin } from '../search-operations';

interface RealDataType extends DataType, EqualsOperationDataTypeMixin {
  name: 'real';
}

const Real = Object.freeze<RealDataType>({
  name: 'real',
  validate(value: unknown): void {
    if (typeof value !== 'number') {
      throw new Error('Value is not a number');
    }
  },
  formatValue(value: unknown): string {
    return (value as number).toString();
  },
  equals(value: unknown, otherValue: unknown): boolean {
    return value === otherValue;
  },
});

export { Real };
