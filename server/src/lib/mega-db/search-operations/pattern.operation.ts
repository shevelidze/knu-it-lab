import { DataType } from '../data-type.interface';

interface PatternOperationDataTypeMixin {
  doesMatchPattern(value: unknown, pattern: string): boolean;
}

function doesDataTypeSupportPatternOperation<T extends DataType>(
  dataType: T,
): dataType is T & PatternOperationDataTypeMixin {
  return 'doesMatchPattern' in dataType;
}

export {
  type PatternOperationDataTypeMixin,
  doesDataTypeSupportPatternOperation,
};
