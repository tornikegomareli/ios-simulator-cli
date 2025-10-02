import { run, runBackground, killProcess } from '../../src/utils/executor';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';

// Mock child_process module
jest.mock('child_process', () => ({
  execFile: jest.fn(),
  spawn: jest.fn(),
}));

jest.mock('util', () => ({
  promisify: jest.fn((fn) => {
    // Return a function that returns a promise
    return (...args: any[]) => {
      return new Promise((resolve, reject) => {
        // Remove the callback from args (it's the last argument)
        const argsWithoutCallback = args.slice(0, -1);
        // Add our own callback
        fn(...argsWithoutCallback, (err: any, stdout: any, stderr: any) => {
          if (err) {
            reject(err);
          } else {
            resolve({ stdout, stderr });
          }
        });
      });
    };
  }),
}));

describe('Executor Utilities', () => {
  const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;
  const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('run', () => {
    it('should execute command with arguments successfully', async () => {
      const mockResult = { stdout: 'success output\n', stderr: '' };
      mockExecFile.mockImplementation((cmd, args, options, callback: any) => {
        callback(null, mockResult.stdout, mockResult.stderr);
        return {} as any;
      });

      const result = await run('echo', ['hello', 'world']);

      expect(result).toEqual({
        stdout: 'success output',
        stderr: '',
      });

      expect(mockExecFile).toHaveBeenCalledWith(
        'echo',
        ['hello', 'world'],
        expect.objectContaining({
          shell: false,
          timeout: 30000,
        }),
        expect.any(Function)
      );
    });

    it('should trim stdout and stderr', async () => {
      const mockResult = { stdout: '  output with spaces  \n', stderr: '  error  \n' };
      mockExecFile.mockImplementation((cmd, args, options, callback: any) => {
        callback(null, mockResult.stdout, mockResult.stderr);
        return {} as any;
      });

      const result = await run('test', []);

      expect(result).toEqual({
        stdout: 'output with spaces',
        stderr: 'error',
      });
    });

    it('should respect custom timeout', async () => {
      mockExecFile.mockImplementation((cmd, args, options, callback: any) => {
        callback(null, 'output', '');
        return {} as any;
      });

      await run('test', [], { timeout: 60 });

      expect(mockExecFile).toHaveBeenCalledWith(
        'test',
        [],
        expect.objectContaining({
          timeout: 60000, // 60 seconds in milliseconds
        }),
        expect.any(Function)
      );
    });

    it('should handle timeout errors', async () => {
      const timeoutError: any = new Error('Command timed out');
      timeoutError.code = 'ETIMEDOUT';

      mockExecFile.mockImplementation((cmd, args, options, callback: any) => {
        callback(timeoutError);
        return {} as any;
      });

      await expect(run('test', [], { timeout: 5 })).rejects.toThrow(
        'Command timed out after 5 seconds'
      );
    });

    it('should propagate other errors', async () => {
      const error = new Error('Command failed');

      mockExecFile.mockImplementation((cmd, args, options, callback: any) => {
        callback(error);
        return {} as any;
      });

      await expect(run('test', [])).rejects.toThrow('Command failed');
    });

    it('should use shell: false for security', async () => {
      mockExecFile.mockImplementation((cmd, args, options, callback: any) => {
        callback(null, '', '');
        return {} as any;
      });

      await run('test', ['--arg']);

      expect(mockExecFile).toHaveBeenCalledWith(
        'test',
        ['--arg'],
        expect.objectContaining({
          shell: false,
        }),
        expect.any(Function)
      );
    });
  });

  describe('runBackground', () => {
    it('should spawn a background process', () => {
      const mockProcess = {
        pid: 12345,
        kill: jest.fn(),
      } as any;

      mockSpawn.mockReturnValue(mockProcess);

      const process = runBackground('node', ['script.js']);

      expect(process).toBe(mockProcess);
      expect(mockSpawn).toHaveBeenCalledWith('node', ['script.js'], {
        shell: false,
        cwd: undefined,
        env: undefined,
      });
    });

    it('should pass options to spawn', () => {
      const mockProcess = {} as any;
      mockSpawn.mockReturnValue(mockProcess);

      const options = {
        cwd: '/test/dir',
        env: { TEST: 'value' },
      };

      runBackground('test', [], options);

      expect(mockSpawn).toHaveBeenCalledWith('test', [], {
        shell: false,
        cwd: '/test/dir',
        env: { TEST: 'value' },
      });
    });
  });

  describe('killProcess', () => {
    it('should kill process by pattern', async () => {
      mockExecFile.mockImplementation((cmd, args, options, callback: any) => {
        callback(null, '', '');
        return {} as any;
      });

      await killProcess('test-pattern');

      expect(mockExecFile).toHaveBeenCalledWith(
        'pkill',
        ['-SIGINT', '-f', 'test-pattern'],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should not throw error if no processes matched (exit code 1)', async () => {
      const error: any = new Error('No processes matched');
      error.code = 1;

      mockExecFile.mockImplementation((cmd, args, options, callback: any) => {
        callback(error);
        return {} as any;
      });

      await expect(killProcess('non-existent')).resolves.not.toThrow();
    });

    it('should throw error for other exit codes', async () => {
      const error: any = new Error('Permission denied');
      error.code = 2;

      mockExecFile.mockImplementation((cmd, args, options, callback: any) => {
        callback(error);
        return {} as any;
      });

      await expect(killProcess('test-pattern')).rejects.toThrow('Permission denied');
    });
  });
});