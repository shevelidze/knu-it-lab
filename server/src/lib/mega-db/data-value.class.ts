import { DataType } from './data-type.interface';

class DataValue {
  constructor(value: unknown, dataType: DataType) {
    if (value !== null) {
      dataType.validate(value);
    }

    this.value = value;
    this.dataType = dataType;
  }

  public formatValue(): string {
    if (this.value === null) {
      return 'null';
    }

    return this.dataType.formatValue(this.value);
  }

  public getValue(): unknown {
    return this.value;
  }

  private dataType: DataType;
  private value: unknown;
}

export { DataValue };
