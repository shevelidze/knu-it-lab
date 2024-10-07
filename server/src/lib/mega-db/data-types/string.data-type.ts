import { DataType } from '../data-type.interface';
import {
  EqualsOperationDataTypeMixin,
  PatternOperationDataTypeMixin,
} from '../search-operations';

interface StringDataType
  extends DataType,
    PatternOperationDataTypeMixin,
    EqualsOperationDataTypeMixin {
  name: 'string';
}

const String: StringDataType = Object.freeze<StringDataType>({
  name: 'string',
  validate(value: unknown): void {
    if (typeof value !== 'string') {
      throw new Error('Value is not a string');
    }
  },
  formatValue(value: unknown): any {
    return `"${value}"`;
  },
  doesMatchPattern(value: unknown, pattern: string): boolean {
    return new RegExp(pattern).test(value as string);
  },
  equals(value: unknown, otherValue: unknown): boolean {
    return value === otherValue;
  },
  parseValue(value: string): string {
    return value;
  },
});

export { String };
