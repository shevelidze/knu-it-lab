import { DataType } from '../data-type.interface';

interface EqualsOperationDataTypeMixin {
  equals: (value: unknown, otherValue: unknown) => boolean;
}

function doesDataTypeSupportEqualsOperation<T extends DataType>(
  dataType: T,
): dataType is T & EqualsOperationDataTypeMixin {
  return 'equals' in dataType;
}

export {
  type EqualsOperationDataTypeMixin,
  doesDataTypeSupportEqualsOperation,
};
