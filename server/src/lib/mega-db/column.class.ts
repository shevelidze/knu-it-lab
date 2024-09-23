import { DataType } from './data-type.interface';

class Column {
  constructor(name: string, dataType: DataType) {
    this.name = name;
    this.dataType = dataType;
  }

  public readonly name: string;
  public readonly dataType: DataType;
}

export { Column };
