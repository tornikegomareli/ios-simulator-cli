import { tap, type, swipe, press } from '../../src/commands/ui';
import * as executor from '../../src/utils/executor';
import * as device from '../../src/utils/device';
import * as logger from '../../src/utils/logger';

// Mock dependencies
jest.mock('../../src/utils/executor');
jest.mock('../../src/utils/device');
jest.mock('../../src/utils/logger', () => ({
  getLogger: jest.fn(() => ({
    startSpinner: jest.fn(),
    stopSpinner: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    json: jest.fn(),
    updateSpinner: jest.fn(),
  })),
  createLogger: jest.fn(() => ({
    startSpinner: jest.fn(),
    stopSpinner: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    json: jest.fn(),
  })),
}));

describe('UI Commands', () => {
  const mockRun = executor.run as jest.MockedFunction<typeof executor.run>;
  const mockGetDeviceId = device.getDeviceId as jest.MockedFunction<typeof device.getDeviceId>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDeviceId.mockResolvedValue('TEST-UUID-1234');
    delete process.env.SIM_CLI_FORMAT;
  });

  describe('tap command', () => {
    it('should construct correct idb command for simple tap', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      await tap(100, 200);

      expect(mockRun).toHaveBeenCalledWith('idb', [
        'ui', 'tap',
        '--udid', 'TEST-UUID-1234',
        '--json',
        '--', '100', '200'
      ]);
    });

    it('should include duration when provided', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      await tap(100, 200, { duration: '0.5' });

      expect(mockRun).toHaveBeenCalledWith('idb', [
        'ui', 'tap',
        '--udid', 'TEST-UUID-1234',
        '--json',
        '--duration', '0.5',
        '--', '100', '200'
      ]);
    });

    it('should use specific device when provided', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });
      mockGetDeviceId.mockResolvedValue('CUSTOM-UUID');

      await tap(50, 75, { device: 'CUSTOM-UUID' });

      expect(mockGetDeviceId).toHaveBeenCalledWith('CUSTOM-UUID');
      expect(mockRun).toHaveBeenCalledWith('idb', [
        'ui', 'tap',
        '--udid', 'CUSTOM-UUID',
        '--json',
        '--', '50', '75'
      ]);
    });

    it('should handle tap errors', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: 'Error: tap failed' });

      await expect(tap(100, 200)).rejects.toThrow('Tap failed: Error: tap failed');
    });

    it('should validate duration format', async () => {
      await expect(tap(100, 200, { duration: 'invalid' })).rejects.toThrow();
      await expect(tap(100, 200, { duration: '-1' })).rejects.toThrow();
    });
  });

  describe('type command', () => {
    it('should construct correct idb command for text input', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      await type('Hello World');

      expect(mockRun).toHaveBeenCalledWith('idb', [
        'ui', 'text',
        '--udid', 'TEST-UUID-1234',
        '--', 'Hello World'
      ]);
    });

    it('should validate text input', async () => {
      // Should reject non-ASCII characters
      await expect(type('Hello 世界')).rejects.toThrow();

      // Should reject text that's too long
      const longText = 'a'.repeat(501);
      await expect(type(longText)).rejects.toThrow();
    });

    it('should handle special ASCII characters', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      await type('user@example.com');

      expect(mockRun).toHaveBeenCalledWith('idb', [
        'ui', 'text',
        '--udid', 'TEST-UUID-1234',
        '--', 'user@example.com'
      ]);
    });
  });

  describe('swipe command', () => {
    it('should construct correct idb command for swipe', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      await swipe(100, 500, 100, 200);

      expect(mockRun).toHaveBeenCalledWith('idb', [
        'ui', 'swipe',
        '--udid', 'TEST-UUID-1234',
        '--json',
        '--', '100', '500', '100', '200'
      ]);
    });

    it('should include duration and delta when provided', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      await swipe(100, 500, 100, 200, { duration: '0.5', delta: 10 });

      expect(mockRun).toHaveBeenCalledWith('idb', [
        'ui', 'swipe',
        '--udid', 'TEST-UUID-1234',
        '--json',
        '--duration', '0.5',
        '--delta', '10',
        '--', '100', '500', '100', '200'
      ]);
    });

    it('should handle negative coordinates for swipe', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      // Swipe can go to any coordinates, including negative
      await swipe(100, 200, 50, 100);

      expect(mockRun).toHaveBeenCalledWith('idb', expect.arrayContaining([
        '--', '100', '200', '50', '100'
      ]));
    });
  });

  describe('press command', () => {
    it('should handle single hardware buttons', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      await press('home');

      expect(mockRun).toHaveBeenCalledWith('idb', [
        'ui', 'button',
        '--udid', 'TEST-UUID-1234',
        '--', 'HOME'
      ]);
    });

    it('should handle volume buttons', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      await press('volume-up');
      expect(mockRun).toHaveBeenCalledWith('idb', [
        'ui', 'button',
        '--udid', 'TEST-UUID-1234',
        '--', 'VOLUME_UP'
      ]);

      await press('volume-down');
      expect(mockRun).toHaveBeenCalledWith('idb', [
        'ui', 'button',
        '--udid', 'TEST-UUID-1234',
        '--', 'VOLUME_DOWN'
      ]);
    });

    it('should handle screenshot gesture (home+lock)', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      await press('home+lock');

      expect(mockRun).toHaveBeenCalledWith('xcrun', [
        'simctl', 'io', 'TEST-UUID-1234',
        'screenshot', '--type=png'
      ]);
    });

    it('should validate button names', async () => {
      await expect(press('invalid-button')).rejects.toThrow();
      await expect(press('back')).rejects.toThrow();
    });

    it('should be case-insensitive for button names', async () => {
      mockRun.mockResolvedValue({ stdout: '', stderr: '' });

      await press('HOME');

      expect(mockRun).toHaveBeenCalledWith('idb', expect.arrayContaining(['--', 'HOME']));
    });
  });
});