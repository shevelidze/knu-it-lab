class Logger {
  constructor({ namespace }: { namespace: string }) {
    this.namespace = namespace;
  }

  public log(message: string): void {
    console.log(this.formatMessage(message));
  }

  public error(message: string): void {
    console.error(this.formatMessage(message));
  }

  public warn(message: string): void {
    console.warn(this.formatMessage(message));
  }

  public formatMessage(message: string): string {
    return `${new Date().toISOString()} [${this.namespace}] ${message}`;
  }

  private namespace: string;
}

export { Logger };
