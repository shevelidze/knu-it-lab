import { DataType } from '../data-type.interface';
import { MegaDbError } from '../errors';

interface CharIntervalDataType extends DataType {
  name: 'charInterval';
}

const CharInterval: CharIntervalDataType = Object.freeze<CharIntervalDataType>({
  name: 'charInterval',
  validate(value: unknown): void {
    if (
      !Array.isArray(value) ||
      value.length !== 2 ||
      !value.every((v) => typeof v === 'string' && v.length === 1) ||
      value[0].localeCompare(value[1]) > 0
    ) {
      throw new MegaDbError('Value is not a char interval');
    }
  },
  formatValue(value: unknown): any {
    return `'${(value as string[])[0]}' - '${(value as string[])[1]}'`;
  },
  parseValue(value: string): string[] {
    const match = value.match(/^(.) - (.)$/);

    if (!match) {
      throw new MegaDbError('Invalid char interval format');
    }

    return [match[1], match[2]];
  },
});

export { CharInterval };
