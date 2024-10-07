interface DataType {
  name: string;
  validate: (value: unknown) => void;
  formatValue: (value: unknown) => string;
  parseValue: (value: string) => unknown;
}

export type { DataType };
