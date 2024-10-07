import { DataType } from 'src/enums';

const DATA_TYPE_TO_LABEL: Record<DataType, string> = {
  [DataType.INTEGER]: 'Integer',
  [DataType.REAL]: 'Real',
  [DataType.CHAR]: 'Char',
  [DataType.STRING]: 'String',
  [DataType.STRING_INTERVAL]: 'String Interval',
  [DataType.CHAR_INTERVAL]: 'Char Interval',
};

export { DATA_TYPE_TO_LABEL };
