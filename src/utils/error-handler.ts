import chalk from 'chalk';
import { ZodError } from 'zod';
import { getLogger } from './logger';

const logger = getLogger();

export enum ErrorCode {
  SUCCESS = 0,
  GENERAL_ERROR = 1,
  INVALID_ARGUMENTS = 2,
  SIMULATOR_NOT_FOUND = 3,
  TIMEOUT = 4,
  PERMISSION_DENIED = 5,
  FILE_NOT_FOUND = 6,
  COMMAND_NOT_FOUND = 127,
}

export class SimulatorError extends Error {
  constructor(
    message: string,
    public code: ErrorCode = ErrorCode.GENERAL_ERROR,
    public suggestions?: string[]
  ) {
    super(message);
    this.name = 'SimulatorError';
  }
}

export function handleError(error: unknown): void {
  let exitCode = ErrorCode.GENERAL_ERROR;
  let message = 'An unexpected error occurred';
  let suggestions: string[] = [];

  if (error instanceof SimulatorError) {
    exitCode = error.code;
    message = error.message;
    suggestions = error.suggestions ?? [];
  } else if (error instanceof ZodError) {
    exitCode = ErrorCode.INVALID_ARGUMENTS;
    message = 'Invalid arguments provided';
    suggestions = error.errors.map(e => `  • ${e.path.join('.')}: ${e.message}`);
  } else if (error instanceof Error) {
    message = error.message;

    // Detect specific error types
    if (message.includes('No booted simulator')) {
      exitCode = ErrorCode.SIMULATOR_NOT_FOUND;
      suggestions = [
        'Open Simulator.app',
        'Run: sim-cli open',
        'Specify a device: --device <udid>',
      ];
    } else if (message.includes('timed out')) {
      exitCode = ErrorCode.TIMEOUT;
      suggestions = [
        'Increase timeout with --timeout flag',
        'Check if simulator is responsive',
      ];
    } else if (message.includes('EACCES') || message.includes('permission denied')) {
      exitCode = ErrorCode.PERMISSION_DENIED;
      suggestions = [
        'Check file/directory permissions',
        'Ensure Xcode command line tools are installed',
        'Try: xcode-select --install',
      ];
    } else if (message.includes('ENOENT') || message.includes('not found')) {
      exitCode = ErrorCode.FILE_NOT_FOUND;
    } else if (message.includes('command not found')) {
      exitCode = ErrorCode.COMMAND_NOT_FOUND;
      suggestions = [
        'Ensure all dependencies are installed',
        'Check that idb is installed: brew install facebook/fb/idb-companion',
        'Verify Xcode installation',
      ];
    }
  }

  // Output error based on format
  if (process.env.SIM_CLI_FORMAT === 'json') {
    console.error(JSON.stringify({
      error: true,
      message,
      code: exitCode,
      suggestions,
    }, null, 2));
  } else {
    logger.error(message);

    if (suggestions.length > 0) {
      console.error(chalk.yellow('\nTry one of the following:'));
      suggestions.forEach(s => console.error(chalk.yellow(s.startsWith('  •') ? s : `  • ${s}`)));
    }

    console.error(chalk.gray(`\nFor more help, run: sim-cli --help`));
  }

  process.exit(exitCode);
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error);
    }
  }) as T;
}