import * as path from 'path';
import { run } from '../utils/executor';
import { getLogger } from '../utils/logger';
import { getDeviceId } from '../utils/device';
import { SimulatorError, ErrorCode } from '../utils/error-handler';
import { bundleIdSchema } from '../utils/validator';
import { fileExists, isDirectory } from '../utils/paths';

const logger = getLogger();

/**
 * Install an app on the simulator
 */
export async function install(appPath: string, options: { device?: string } = {}): Promise<void> {
  const deviceId = await getDeviceId(options.device);

  // Resolve to absolute path
  const absolutePath = path.isAbsolute(appPath) ? appPath : path.resolve(appPath);

  logger.startSpinner(`Installing app from: ${appPath}...`);

  try {
    // Check if app bundle exists
    if (!fileExists(absolutePath)) {
      throw new SimulatorError(
        `App bundle not found: ${absolutePath}`,
        ErrorCode.FILE_NOT_FOUND,
        ['Check the file path is correct', 'Ensure the .app or .ipa file exists']
      );
    }

    // Verify it's an app bundle or IPA
    const ext = path.extname(absolutePath).toLowerCase();
    if (ext !== '.app' && ext !== '.ipa') {
      // For .app, also check it's a directory
      if (ext === '.app' && !isDirectory(absolutePath)) {
        throw new SimulatorError(
          'Invalid app bundle: .app should be a directory',
          ErrorCode.INVALID_ARGUMENTS
        );
      }

      if (ext !== '.app') {
        throw new SimulatorError(
          'Invalid app bundle: must be .app directory or .ipa file',
          ErrorCode.INVALID_ARGUMENTS
        );
      }
    }

    // Install the app
    const { stderr } = await run('xcrun', [
      'simctl', 'install', deviceId, absolutePath
    ]);

    if (stderr && !stderr.includes('successfully')) {
      throw new SimulatorError(`Installation failed: ${stderr}`, ErrorCode.GENERAL_ERROR);
    }

    logger.success(`App installed successfully from: ${appPath}`);

    if (process.env.SIM_CLI_FORMAT === 'json') {
      logger.json({
        success: true,
        path: absolutePath,
        device: deviceId
      });
    }
  } catch (error) {
    logger.stopSpinner(false);
    throw error;
  }
}

/**
 * Launch an installed app
 */
export async function launch(
  bundleId: string,
  options: { terminate?: boolean; device?: string } = {}
): Promise<void> {
  const validatedBundleId = bundleIdSchema.parse(bundleId);
  const deviceId = await getDeviceId(options.device);

  logger.startSpinner(`Launching app: ${bundleId}...`);

  try {
    const args = ['simctl', 'launch'];

    if (options.terminate) {
      args.push('--terminate-running-process');
    }

    args.push(deviceId, validatedBundleId);

    const { stdout, stderr } = await run('xcrun', args);

    if (stderr && !stderr.includes('successfully')) {
      throw new SimulatorError(`Launch failed: ${stderr}`, ErrorCode.GENERAL_ERROR);
    }

    // Extract PID from output if available
    const pidMatch = stdout.match(/^(\d+)/);
    const pid = pidMatch ? pidMatch[1] : null;

    if (pid) {
      logger.success(`App ${bundleId} launched with PID: ${pid}`);
    } else {
      logger.success(`App ${bundleId} launched successfully`);
    }

    if (process.env.SIM_CLI_FORMAT === 'json') {
      logger.json({
        success: true,
        bundleId,
        pid,
        device: deviceId
      });
    }
  } catch (error) {
    logger.stopSpinner(false);

    // Provide helpful error message for common issues
    if (error instanceof Error && error.message.includes('Unable to find')) {
      throw new SimulatorError(
        `App not found: ${bundleId}`,
        ErrorCode.GENERAL_ERROR,
        [
          'Check the bundle ID is correct',
          'Ensure the app is installed: sim-cli install <app-path>',
          'List installed apps: sim-cli app-list'
        ]
      );
    }

    throw error;
  }
}

/**
 * Uninstall an app
 */
export async function uninstall(bundleId: string, options: { device?: string } = {}): Promise<void> {
  const validatedBundleId = bundleIdSchema.parse(bundleId);
  const deviceId = await getDeviceId(options.device);

  logger.startSpinner(`Uninstalling app: ${bundleId}...`);

  try {
    const { stderr } = await run('xcrun', [
      'simctl', 'uninstall', deviceId, validatedBundleId
    ]);

    if (stderr && !stderr.includes('successfully')) {
      throw new SimulatorError(`Uninstall failed: ${stderr}`, ErrorCode.GENERAL_ERROR);
    }

    logger.success(`App ${bundleId} uninstalled successfully`);

    if (process.env.SIM_CLI_FORMAT === 'json') {
      logger.json({
        success: true,
        bundleId,
        device: deviceId
      });
    }
  } catch (error) {
    logger.stopSpinner(false);

    // Provide helpful error message for common issues
    if (error instanceof Error && error.message.includes('No such file or directory')) {
      throw new SimulatorError(
        `App not found: ${bundleId}`,
        ErrorCode.GENERAL_ERROR,
        [
          'Check the bundle ID is correct',
          'List installed apps: sim-cli app-list'
        ]
      );
    }

    throw error;
  }
}

/**
 * List all installed apps
 */
export async function list(options: { device?: string } = {}): Promise<void> {
  const deviceId = await getDeviceId(options.device);

  logger.startSpinner('Fetching installed apps...');

  try {
    // Get container paths for all apps
    const { stdout, stderr } = await run('xcrun', [
      'simctl', 'listapps', deviceId
    ]);

    if (stderr) {
      throw new SimulatorError(`Failed to list apps: ${stderr}`, ErrorCode.GENERAL_ERROR);
    }

    // Parse the plist output
    // simctl listapps outputs in plist format, we need to parse it
    // For simplicity, we'll extract bundle IDs using regex
    const bundleIdMatches = stdout.matchAll(/CFBundleIdentifier\s*=\s*"([^"]+)"/g);
    const nameMatches = stdout.matchAll(/CFBundleName\s*=\s*"([^"]+)"/g);
    const displayNameMatches = stdout.matchAll(/CFBundleDisplayName\s*=\s*"([^"]+)"/g);

    const bundleIds = Array.from(bundleIdMatches).map(m => m[1]);
    const names = Array.from(nameMatches).map(m => m[1]);
    const displayNames = Array.from(displayNameMatches).map(m => m[1]);

    const apps = bundleIds.map((bundleId, index) => ({
      bundleId,
      name: displayNames[index] || names[index] || bundleId,
    }));

    logger.stopSpinner(true);

    if (apps.length === 0) {
      logger.warn('No apps installed on this simulator');
    } else {
      logger.success(`Found ${apps.length} installed app(s)`);

      if (process.env.SIM_CLI_FORMAT === 'json') {
        logger.json({
          success: true,
          apps,
          count: apps.length,
          device: deviceId
        });
      } else {
        // Display as table
        logger.table(apps);
      }
    }
  } catch (error) {
    logger.stopSpinner(false);
    throw error;
  }
}