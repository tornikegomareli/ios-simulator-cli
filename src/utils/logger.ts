import chalk from 'chalk';
import ora, { Ora } from 'ora';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

export class Logger {
  private level: LogLevel;
  private spinner: Ora | null = null;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = this.getLogLevelFromEnv() ?? level;
  }

  private getLogLevelFromEnv(): LogLevel | null {
    if (process.env.SIM_CLI_QUIET === '1') return LogLevel.ERROR;
    if (process.env.SIM_CLI_VERBOSE === '1') return LogLevel.VERBOSE;
    return null;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level && process.env.SIM_CLI_FORMAT !== 'json';
  }

  error(message: string, error?: Error): void {
    if (this.spinner) {
      this.spinner.fail(chalk.red(message));
      this.spinner = null;
    } else if (this.shouldLog(LogLevel.ERROR)) {
      console.error(chalk.red('✖ ' + message));
    }
    if (error && this.shouldLog(LogLevel.DEBUG)) {
      console.error(chalk.gray(error.stack ?? error.message));
    }
  }

  warn(message: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(chalk.yellow('⚠ ' + message));
    }
  }

  info(message: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(chalk.blue('ℹ ' + message));
    }
  }

  success(message: string): void {
    if (this.spinner) {
      this.spinner.succeed(chalk.green(message));
      this.spinner = null;
    } else if (this.shouldLog(LogLevel.INFO)) {
      console.log(chalk.green('✔ ' + message));
    }
  }

  debug(message: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(chalk.gray('🔍 ' + message));
    }
  }

  verbose(message: string): void {
    if (this.shouldLog(LogLevel.VERBOSE)) {
      console.log(chalk.gray('📝 ' + message));
    }
  }

  startSpinner(message: string): void {
    if (process.env.SIM_CLI_FORMAT !== 'json' && !process.env.SIM_CLI_QUIET) {
      this.spinner = ora(message).start();
    }
  }

  updateSpinner(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  stopSpinner(success: boolean = true, message?: string): void {
    if (this.spinner) {
      if (success) {
        this.spinner.succeed(message);
      } else {
        this.spinner.fail(message);
      }
      this.spinner = null;
    }
  }

  json(data: any): void {
    if (process.env.SIM_CLI_FORMAT === 'json') {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  table(data: any[]): void {
    if (process.env.SIM_CLI_FORMAT !== 'json') {
      console.table(data);
    }
  }
}

let logger: Logger | null = null;

export function createLogger(level?: LogLevel): Logger {
  if (!logger) {
    logger = new Logger(level);
  }
  return logger;
}

export function getLogger(): Logger {
  if (!logger) {
    logger = new Logger();
  }
  return logger;
}