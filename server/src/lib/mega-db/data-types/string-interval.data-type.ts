import { DataType } from '../data-type.interface';
import { MegaDbError } from '../errors';

interface StringIntervalDataType extends DataType {
  name: 'stringInterval';
}

const StringInterval: StringIntervalDataType =
  Object.freeze<StringIntervalDataType>({
    name: 'stringInterval',
    validate(value: unknown): void {
      if (
        !Array.isArray(value) ||
        value.length !== 2 ||
        !value.every((v) => typeof v === 'string') ||
        value[0].length !== value[1].length ||
        value[0].localeCompare(value[1]) > 0
      ) {
        throw new MegaDbError('Value is not a string interval');
      }
    },
    formatValue(value: unknown): any {
      return `"${(value as string[])[0]}" - "${(value as string[])[1]}"`;
    },
    parseValue(value: string): string[] {
      const match = value.match(/^(.+) - (.+)$/);

      if (!match) {
        throw new MegaDbError('Invalid string interval format');
      }

      return [match[1], match[2]];
    },
  });

export { StringInterval };
