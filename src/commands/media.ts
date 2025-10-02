import { run, runBackground, killProcess } from '../utils/executor';
import { getLogger } from '../utils/logger';
import { getDeviceId } from '../utils/device';
import { SimulatorError, ErrorCode } from '../utils/error-handler';
import {
  resolveFilePath,
  generateTimestampedFilename,
  fileExists,
} from '../utils/paths';

const logger = getLogger();

/**
 * Take a screenshot of the simulator
 */
export async function screenshot(
  path?: string,
  options: {
    type?: 'png' | 'jpeg' | 'tiff' | 'bmp' | 'gif';
    display?: 'internal' | 'external';
    mask?: 'ignored' | 'alpha' | 'black';
    device?: string;
  } = {}
): Promise<void> {
  const deviceId = await getDeviceId(options.device);
  const fileType = options.type || 'png';

  const outputPath = resolveFilePath(
    path || generateTimestampedFilename('screenshot', fileType)
  );

  logger.startSpinner(`Taking screenshot...`);

  try {
    const args = [
      'simctl', 'io', deviceId, 'screenshot'
    ];

    if (options.type) {
      args.push(`--type=${options.type}`);
    }

    if (options.display) {
      args.push(`--display=${options.display}`);
    }

    if (options.mask) {
      args.push(`--mask=${options.mask}`);
    }

    args.push('--', outputPath);

    const { stderr } = await run('xcrun', args);

    if (stderr && !stderr.includes('Wrote screenshot to')) {
      throw new SimulatorError(`Screenshot failed: ${stderr}`, ErrorCode.GENERAL_ERROR);
    }

    logger.success(`Screenshot saved to: ${outputPath}`);

    if (process.env.SIM_CLI_FORMAT === 'json') {
      logger.json({
        success: true,
        path: outputPath,
        type: fileType,
        device: deviceId
      });
    }
  } catch (error) {
    logger.stopSpinner(false);
    throw error;
  }
}

/**
 * Start recording a video of the simulator
 */
export async function record(
  path?: string,
  options: {
    codec?: 'h264' | 'hevc';
    display?: 'internal' | 'external';
    mask?: 'ignored' | 'alpha' | 'black';
    force?: boolean;
    device?: string;
  } = {}
): Promise<void> {
  const deviceId = await getDeviceId(options.device);

  const outputPath = resolveFilePath(
    path || generateTimestampedFilename('recording', 'mp4')
  );

  if (fileExists(outputPath) && !options.force) {
    throw new SimulatorError(
      `File already exists: ${outputPath}`,
      ErrorCode.GENERAL_ERROR,
      ['Use --force to overwrite the existing file']
    );
  }

  logger.startSpinner(`Starting video recording...`);

  try {
    const args = [
      'simctl', 'io', deviceId, 'recordVideo'
    ];

    if (options.codec) {
      args.push(`--codec=${options.codec}`);
    }

    if (options.display) {
      args.push(`--display=${options.display}`);
    }

    if (options.mask) {
      args.push(`--mask=${options.mask}`);
    }

    if (options.force) {
      args.push('--force');
    }

    args.push('--', outputPath);

    const recordingProcess = runBackground('xcrun', args);

    let recordingStarted = false;
    let errorOutput = '';

    recordingProcess.stderr?.on('data', (data) => {
      const message = data.toString();
      if (message.includes('Recording started')) {
        recordingStarted = true;
      } else {
        errorOutput += message;
      }
    });

    await new Promise<void>((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (recordingStarted) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (!recordingStarted) {
          if (recordingProcess.killed) {
            reject(new SimulatorError(
              `Recording process terminated unexpectedly: ${errorOutput}`,
              ErrorCode.GENERAL_ERROR
            ));
          } else {
            resolve();
          }
        }
      }, 3000);
    });

    logger.success(`Recording started. Video will be saved to: ${outputPath}`);
    logger.info('Run "sim-cli record-stop" to stop recording');

    process.env.SIM_CLI_RECORDING_PATH = outputPath;
    process.env.SIM_CLI_RECORDING_PID = String(recordingProcess.pid);

    if (process.env.SIM_CLI_FORMAT === 'json') {
      logger.json({
        success: true,
        recording: true,
        path: outputPath,
        pid: recordingProcess.pid,
        device: deviceId
      });
    }
  } catch (error) {
    logger.stopSpinner(false);
    throw error;
  }
}

/**
 * Stop the current video recording
 */
export async function recordStop(): Promise<void> {
  logger.startSpinner('Stopping video recording...');

  try {
    await killProcess('simctl.*recordVideo');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const recordingPath = process.env.SIM_CLI_RECORDING_PATH;

    if (recordingPath && fileExists(recordingPath)) {
      logger.success(`Recording stopped. Video saved to: ${recordingPath}`);

      if (process.env.SIM_CLI_FORMAT === 'json') {
        logger.json({
          success: true,
          recording: false,
          path: recordingPath
        });
      }
    } else {
      logger.success('Recording stopped');

      if (process.env.SIM_CLI_FORMAT === 'json') {
        logger.json({
          success: true,
          recording: false
        });
      }
    }

    delete process.env.SIM_CLI_RECORDING_PATH;
    delete process.env.SIM_CLI_RECORDING_PID;
  } catch (error) {
    logger.stopSpinner(false);

    if (error instanceof Error && error.message.includes('No matching processes')) {
      logger.warn('No active recording found');

      if (process.env.SIM_CLI_FORMAT === 'json') {
        logger.json({
          success: false,
          message: 'No active recording found'
        });
      }
    } else {
      throw error;
    }
  }
}