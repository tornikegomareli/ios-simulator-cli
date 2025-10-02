import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import {
  resolveFilePath,
  generateTimestampedFilename,
  fileExists,
  isDirectory,
  getFileExtension,
  ensureDirectory,
  createTempDirectory,
} from '../../src/utils/paths';

// Mock fs and os modules
jest.mock('fs');
jest.mock('os');

describe('Path Utilities', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockOs = os as jest.Mocked<typeof os>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOs.homedir.mockReturnValue('/Users/testuser');
    mockOs.tmpdir.mockReturnValue('/tmp');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockReturnValue(undefined);
  });

  describe('resolveFilePath', () => {
    it('should return absolute paths unchanged', () => {
      const absolutePath = '/absolute/path/to/file.txt';
      expect(resolveFilePath(absolutePath)).toBe(absolutePath);
    });

    it('should expand tilde paths to home directory', () => {
      const tildePath = '~/Documents/file.txt';
      expect(resolveFilePath(tildePath)).toBe('/Users/testuser/Documents/file.txt');
    });

    it('should resolve relative paths to default Downloads directory', () => {
      delete process.env.SIM_CLI_OUTPUT_DIR;
      const relativePath = 'file.txt';
      expect(resolveFilePath(relativePath)).toBe('/Users/testuser/Downloads/file.txt');
    });

    it('should use custom output directory from environment', () => {
      process.env.SIM_CLI_OUTPUT_DIR = '/custom/output';
      const relativePath = 'file.txt';
      expect(resolveFilePath(relativePath)).toBe('/custom/output/file.txt');
    });

    it('should expand tilde in custom output directory', () => {
      process.env.SIM_CLI_OUTPUT_DIR = '~/MyOutput';
      const relativePath = 'file.txt';
      expect(resolveFilePath(relativePath)).toBe('/Users/testuser/MyOutput/file.txt');
    });

    it('should create directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      resolveFilePath('file.txt');
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ recursive: true })
      );
    });
  });

  describe('generateTimestampedFilename', () => {
    it('should generate filename with timestamp', () => {
      const mockDate = new Date('2024-01-15T10:30:45.123Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const filename = generateTimestampedFilename('screenshot', 'png');
      expect(filename).toBe('screenshot_2024-01-15_10-30-45-123.png');

      (global.Date as any).mockRestore();
    });

    it('should handle different prefixes and extensions', () => {
      const mockDate = new Date('2024-01-15T10:30:45.123Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      expect(generateTimestampedFilename('video', 'mp4')).toBe('video_2024-01-15_10-30-45-123.mp4');
      expect(generateTimestampedFilename('log', 'txt')).toBe('log_2024-01-15_10-30-45-123.txt');

      (global.Date as any).mockRestore();
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', () => {
      mockFs.accessSync.mockImplementation(() => {});
      expect(fileExists('/path/to/file.txt')).toBe(true);
    });

    it('should return false if file does not exist', () => {
      mockFs.accessSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });
      expect(fileExists('/path/to/nonexistent.txt')).toBe(false);
    });
  });

  describe('isDirectory', () => {
    it('should return true for directories', () => {
      const mockStats = { isDirectory: () => true } as fs.Stats;
      mockFs.statSync.mockReturnValue(mockStats);
      expect(isDirectory('/path/to/dir')).toBe(true);
    });

    it('should return false for files', () => {
      const mockStats = { isDirectory: () => false } as fs.Stats;
      mockFs.statSync.mockReturnValue(mockStats);
      expect(isDirectory('/path/to/file.txt')).toBe(false);
    });

    it('should return false if path does not exist', () => {
      mockFs.statSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });
      expect(isDirectory('/nonexistent')).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('should return extension without dot', () => {
      expect(getFileExtension('file.txt')).toBe('txt');
      expect(getFileExtension('image.png')).toBe('png');
      expect(getFileExtension('document.pdf')).toBe('pdf');
    });

    it('should handle files with multiple dots', () => {
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
      expect(getFileExtension('file.test.js')).toBe('js');
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('Makefile')).toBe('');
    });

    it('should handle paths with directories', () => {
      expect(getFileExtension('/path/to/file.txt')).toBe('txt');
      expect(getFileExtension('relative/path/image.jpg')).toBe('jpg');
    });
  });

  describe('ensureDirectory', () => {
    it('should create directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      ensureDirectory('/path/to/new/dir');
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        '/path/to/new/dir',
        expect.objectContaining({ recursive: true })
      );
    });

    it('should not create directory if it already exists', () => {
      mockFs.existsSync.mockReturnValue(true);
      ensureDirectory('/existing/dir');
      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('createTempDirectory', () => {
    it('should create temporary directory with default prefix', () => {
      mockFs.mkdtempSync.mockReturnValue('/tmp/sim-cli-abc123');
      const tempDir = createTempDirectory();
      expect(tempDir).toBe('/tmp/sim-cli-abc123');
      expect(mockFs.mkdtempSync).toHaveBeenCalledWith('/tmp/sim-cli-');
    });

    it('should create temporary directory with custom prefix', () => {
      mockFs.mkdtempSync.mockReturnValue('/tmp/test-xyz789');
      const tempDir = createTempDirectory('test');
      expect(tempDir).toBe('/tmp/test-xyz789');
      expect(mockFs.mkdtempSync).toHaveBeenCalledWith('/tmp/test-');
    });
  });
});