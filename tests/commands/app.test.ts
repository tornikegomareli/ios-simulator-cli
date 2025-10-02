import { install, launch, uninstall } from '../../src/commands/app';
import * as executor from '../../src/utils/executor';
import * as device from '../../src/utils/device';
import * as paths from '../../src/utils/paths';
import * as logger from '../../src/utils/logger';

// Mock dependencies
jest.mock('../../src/utils/executor');
jest.mock('../../src/utils/device');
jest.mock('../../src/utils/paths');
jest.mock('../../src/utils/logger', () => ({
  getLogger: jest.fn(() => ({
    startSpinner: jest.fn(),
    stopSpinner: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    json: jest.fn(),
    warn: jest.fn(),
    table: jest.fn(),
  })),
}));

describe('App Commands', () => {
  const mockRun = executor.run as jest.MockedFunction<typeof executor.run>;
  const mockGetDeviceId = device.getDeviceId as jest.MockedFunction<typeof device.getDeviceId>;
  const mockFileExists = paths.fileExists as jest.MockedFunction<typeof paths.fileExists>;
  const mockIsDirectory = paths.isDirectory as jest.MockedFunction<typeof paths.isDirectory>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDeviceId.mockResolvedValue('TEST-UUID-1234');
    delete process.env.SIM_CLI_FORMAT;
  });

  describe('install command', () => {
    it('should install .app bundle', async () => {
      mockFileExists.mockReturnValue(true);
      mockIsDirectory.mockReturnValue(true);
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      await install('/path/to/MyApp.app');

      expect(mockRun).toHaveBeenCalledWith('xcrun', [
        'simctl', 'install', 'TEST-UUID-1234', '/path/to/MyApp.app'
      ]);
    });

    it('should install .ipa file', async () => {
      mockFileExists.mockReturnValue(true);
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      await install('/path/to/MyApp.ipa');

      expect(mockRun).toHaveBeenCalledWith('xcrun', [
        'simctl', 'install', 'TEST-UUID-1234', '/path/to/MyApp.ipa'
      ]);
    });

    it('should resolve relative paths', async () => {
      mockFileExists.mockReturnValue(true);
      mockIsDirectory.mockReturnValue(true);
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      await install('./MyApp.app');

      expect(mockRun).toHaveBeenCalledWith('xcrun', [
        'simctl', 'install', 'TEST-UUID-1234',
        expect.stringContaining('MyApp.app')
      ]);
    });

    it('should validate app bundle exists', async () => {
      mockFileExists.mockReturnValue(false);

      await expect(install('/nonexistent/MyApp.app')).rejects.toThrow(
        'App bundle not found: /nonexistent/MyApp.app'
      );
    });

    it('should validate .app is a directory', async () => {
      mockFileExists.mockReturnValue(true);
      mockIsDirectory.mockReturnValue(false);

      await expect(install('/path/to/MyApp.app')).rejects.toThrow(
        'Invalid app bundle: .app should be a directory'
      );
    });

    it('should reject invalid file extensions', async () => {
      mockFileExists.mockReturnValue(true);

      await expect(install('/path/to/file.zip')).rejects.toThrow(
        'Invalid app bundle: must be .app directory or .ipa file'
      );
    });

    it('should use specific device when provided', async () => {
      mockFileExists.mockReturnValue(true);
      mockIsDirectory.mockReturnValue(true);
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });
      mockGetDeviceId.mockResolvedValue('CUSTOM-UUID');

      await install('/path/to/MyApp.app', { device: 'CUSTOM-UUID' });

      expect(mockGetDeviceId).toHaveBeenCalledWith('CUSTOM-UUID');
      expect(mockRun).toHaveBeenCalledWith('xcrun', [
        'simctl', 'install', 'CUSTOM-UUID', '/path/to/MyApp.app'
      ]);
    });
  });

  describe('launch command', () => {
    it('should launch app by bundle ID', async () => {
      mockRun.mockResolvedValue({ stdout: '12345: com.example.app', stderr: '' });

      await launch('com.example.app');

      expect(mockRun).toHaveBeenCalledWith('xcrun', [
        'simctl', 'launch', 'TEST-UUID-1234', 'com.example.app'
      ]);
    });

    it('should extract PID from output', async () => {
      const mockLogger = logger.getLogger();
      mockRun.mockResolvedValue({ stdout: '12345: com.example.app', stderr: '' });

      await launch('com.example.app');

      expect(mockLogger.success).toHaveBeenCalledWith(
        'App com.example.app launched with PID: 12345'
      );
    });

    it('should handle launch without PID', async () => {
      const mockLogger = logger.getLogger();
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      await launch('com.example.app');

      expect(mockLogger.success).toHaveBeenCalledWith(
        'App com.example.app launched successfully'
      );
    });

    it('should terminate running app when flag is set', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      await launch('com.example.app', { terminate: true });

      expect(mockRun).toHaveBeenCalledWith('xcrun', [
        'simctl', 'launch',
        '--terminate-running-process',
        'TEST-UUID-1234', 'com.example.app'
      ]);
    });

    it('should validate bundle ID format', async () => {
      await expect(launch('invalid bundle id with spaces')).rejects.toThrow();
      await expect(launch('com.example.app@special')).rejects.toThrow();
    });

    it('should provide helpful error for app not found', async () => {
      mockRun.mockRejectedValue(new Error('Unable to find app'));

      await expect(launch('com.nonexistent.app')).rejects.toThrow(
        'App not found: com.nonexistent.app'
      );
    });
  });

  describe('uninstall command', () => {
    it('should uninstall app by bundle ID', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      await uninstall('com.example.app');

      expect(mockRun).toHaveBeenCalledWith('xcrun', [
        'simctl', 'uninstall', 'TEST-UUID-1234', 'com.example.app'
      ]);
    });

    it('should validate bundle ID format', async () => {
      await expect(uninstall('invalid@bundle')).rejects.toThrow();
      await expect(uninstall('')).rejects.toThrow();
    });

    it('should provide helpful error for app not found', async () => {
      mockRun.mockRejectedValue(new Error('No such file or directory'));

      await expect(uninstall('com.nonexistent.app')).rejects.toThrow(
        'App not found: com.nonexistent.app'
      );
    });

    it('should handle uninstall errors', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: 'Error: uninstall failed' });

      await expect(uninstall('com.example.app')).rejects.toThrow(
        'Uninstall failed: Error: uninstall failed'
      );
    });

    it('should use specific device when provided', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });
      mockGetDeviceId.mockResolvedValue('CUSTOM-UUID');

      await uninstall('com.example.app', { device: 'CUSTOM-UUID' });

      expect(mockGetDeviceId).toHaveBeenCalledWith('CUSTOM-UUID');
      expect(mockRun).toHaveBeenCalledWith('xcrun', [
        'simctl', 'uninstall', 'CUSTOM-UUID', 'com.example.app'
      ]);
    });
  });
});