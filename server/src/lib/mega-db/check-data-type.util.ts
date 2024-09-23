import { DataType } from './data-type.interface';

function checkDataType<T extends DataType>(
  target: DataType,
  dataType: T,
): target is T {
  return target.name === dataType.name;
}

export { checkDataType };
