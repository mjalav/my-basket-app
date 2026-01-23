export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.context}] ${message}`;
  }

  info(message: string) {
    console.log(this.formatMessage('INFO', message));
  }

  error(message: string, error?: any) {
    console.error(this.formatMessage('ERROR', message));
    if (error) {
      console.error(error);
    }
  }

  debug(message: string) {
    // Only log debug in verbose mode or if CI environment variable is not set
    if (process.env.DEBUG || !process.env.CI) {
      console.log(this.formatMessage('DEBUG', message));
    }
  }

  warn(message: string) {
    console.warn(this.formatMessage('WARN', message));
  }
}
