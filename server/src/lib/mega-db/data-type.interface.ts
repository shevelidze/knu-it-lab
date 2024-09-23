interface DataType {
  name: string;
  validate: (value: unknown) => void;
  formatValue: (value: unknown) => string;
}

export type { DataType };
