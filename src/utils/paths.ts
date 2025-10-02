import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

/**
 * Resolve a file path to an absolute path
 * Handles ~ expansion and relative paths
 */
export function resolveFilePath(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  // Handle ~/something paths
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }

  // Determine the default directory from env var or fallback to ~/Downloads
  let defaultDir = path.join(os.homedir(), 'Downloads');
  const customDefaultDir = process.env.SIM_CLI_OUTPUT_DIR;

  if (customDefaultDir) {
    // Also expand tilde for the custom directory path
    if (customDefaultDir.startsWith('~/')) {
      defaultDir = path.join(os.homedir(), customDefaultDir.slice(2));
    } else if (path.isAbsolute(customDefaultDir)) {
      defaultDir = customDefaultDir;
    } else {
      // Relative to current working directory
      defaultDir = path.resolve(customDefaultDir);
    }
  }

  // Ensure the default directory exists
  if (!fs.existsSync(defaultDir)) {
    fs.mkdirSync(defaultDir, { recursive: true });
  }

  // Join the relative filePath with the resolved default directory
  return path.join(defaultDir, filePath);
}

/**
 * Generate a timestamped filename
 */
export function generateTimestampedFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0];
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Check if a file exists and is accessible
 */
export function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a path is a directory
 */
export function isDirectory(filePath: string): boolean {
  try {
    const stats = fs.statSync(filePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Get file extension (without the dot)
 */
export function getFileExtension(filePath: string): string {
  const ext = path.extname(filePath);
  return ext.startsWith('.') ? ext.slice(1) : ext;
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Create a temporary directory
 */
export function createTempDirectory(prefix: string = 'sim-cli'): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
}

/**
 * Write data to a file
 */
export function writeFile(filePath: string, data: string | Buffer): void {
  const dir = path.dirname(filePath);
  ensureDirectory(dir);
  fs.writeFileSync(filePath, data);
}

/**
 * Read a file as a string
 */
export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Read a file as a buffer
 */
export function readFileBuffer(filePath: string): Buffer {
  return fs.readFileSync(filePath);
}