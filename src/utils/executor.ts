import { spawn, execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface ExecutorResult {
  stdout: string;
  stderr: string;
}

export interface ExecutorOptions {
  timeout?: number;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

/**
 * Securely execute a command with arguments
 * ALWAYS uses shell: false to prevent command injection
 */
export async function run(
  command: string,
  args: string[],
  options: ExecutorOptions = {}
): Promise<ExecutorResult> {
  const timeout = options.timeout ? options.timeout * 1000 : 30000;

  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      shell: false,
      timeout,
      cwd: options.cwd,
      env: options.env,
    });

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  } catch (error: any) {
    if (error.code === 'ETIMEDOUT') {
      throw new Error(`Command timed out after ${timeout / 1000} seconds`);
    }
    throw error;
  }
}

/**
 * Run a command in the background (for long-running processes like video recording)
 */
export function runBackground(
  command: string,
  args: string[],
  options: ExecutorOptions = {}
): ReturnType<typeof spawn> {
  return spawn(command, args, {
    shell: false,
    cwd: options.cwd,
    env: options.env,
  });
}

/**
 * Kill a process by matching command pattern
 */
export async function killProcess(pattern: string): Promise<void> {
  try {
    await run('pkill', ['-SIGINT', '-f', pattern]);
  } catch (error: any) {
    // pkill returns 1 if no processes were matched, which is OK
    if (error.code !== 1) {
      throw error;
    }
  }
}