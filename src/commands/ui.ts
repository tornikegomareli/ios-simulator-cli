import { run } from '../utils/executor';
import { getLogger } from '../utils/logger';
import { getDeviceId } from '../utils/device';
import { SimulatorError, ErrorCode } from '../utils/error-handler';
import {
  textInputSchema,
  durationSchema,
  hardwareButtonSchema
} from '../utils/validator';
import { writeFile } from '../utils/paths';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const logger = getLogger();

/**
 * Tap at specific screen coordinates
 */
export async function tap(
  x: number,
  y: number,
  options: { duration?: string; device?: string } = {}
): Promise<void> {
  const deviceId = await getDeviceId(options.device);

  logger.startSpinner(`Tapping at (${x}, ${y})...`);

  try {
    const args = [
      'ui', 'tap',
      '--udid', deviceId,
      '--json'
    ];

    if (options.duration) {
      const duration = durationSchema.parse(options.duration);
      args.push('--duration', duration);
    }

    args.push('--', String(x), String(y));

    const { stderr } = await run('idb', args);

    if (stderr) {
      throw new SimulatorError(`Tap failed: ${stderr}`, ErrorCode.GENERAL_ERROR);
    }

    logger.success(`Tapped at (${x}, ${y})`);

    if (process.env.SIM_CLI_FORMAT === 'json') {
      logger.json({ success: true, x, y, device: deviceId });
    }
  } catch (error) {
    logger.stopSpinner(false);
    throw error;
  }
}

/**
 * Type text into the currently focused field
 */
export async function type(text: string, options: { device?: string } = {}): Promise<void> {
  const validatedText = textInputSchema.parse(text);
  const deviceId = await getDeviceId(options.device);

  logger.startSpinner(`Typing text...`);

  try {
    const args = [
      'ui', 'text',
      '--udid', deviceId,
      '--', validatedText
    ];

    const { stderr } = await run('idb', args);

    if (stderr) {
      throw new SimulatorError(`Type failed: ${stderr}`, ErrorCode.GENERAL_ERROR);
    }

    logger.success(`Typed "${text}"`);

    if (process.env.SIM_CLI_FORMAT === 'json') {
      logger.json({ success: true, text, device: deviceId });
    }
  } catch (error) {
    logger.stopSpinner(false);
    throw error;
  }
}

/**
 * Perform a swipe gesture
 */
export async function swipe(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: { duration?: string; delta?: number; device?: string } = {}
): Promise<void> {
  const deviceId = await getDeviceId(options.device);

  logger.startSpinner(`Swiping from (${x1}, ${y1}) to (${x2}, ${y2})...`);

  try {
    const args = [
      'ui', 'swipe',
      '--udid', deviceId,
      '--json'
    ];

    if (options.duration) {
      const duration = durationSchema.parse(options.duration);
      args.push('--duration', duration);
    }

    if (options.delta) {
      args.push('--delta', String(options.delta));
    }

    args.push('--', String(x1), String(y1), String(x2), String(y2));

    const { stderr } = await run('idb', args);

    if (stderr) {
      throw new SimulatorError(`Swipe failed: ${stderr}`, ErrorCode.GENERAL_ERROR);
    }

    logger.success(`Swiped from (${x1}, ${y1}) to (${x2}, ${y2})`);

    if (process.env.SIM_CLI_FORMAT === 'json') {
      logger.json({ success: true, x1, y1, x2, y2, device: deviceId });
    }
  } catch (error) {
    logger.stopSpinner(false);
    throw error;
  }
}

/**
 * Press hardware buttons
 */
export async function press(button: string, options: { device?: string } = {}): Promise<void> {
  const validatedButton = hardwareButtonSchema.parse(button.toLowerCase());
  const deviceId = await getDeviceId(options.device);

  logger.startSpinner(`Pressing ${button} button...`);

  try {
    if (validatedButton.includes('+')) {
      const buttons = validatedButton.split('+');

      if (buttons.includes('home') && buttons.includes('lock')) {
        await run('xcrun', ['simctl', 'io', deviceId, 'screenshot', '--type=png']);
        logger.success('Screenshot gesture performed');
      } else {
        throw new SimulatorError(
          `Unsupported button combination: ${button}`,
          ErrorCode.INVALID_ARGUMENTS
        );
      }
    } else {
      const buttonMap: Record<string, string[]> = {
        'home': ['ui', 'button', '--udid', deviceId, '--', 'HOME'],
        'lock': ['ui', 'button', '--udid', deviceId, '--', 'LOCK'],
        'power': ['ui', 'button', '--udid', deviceId, '--', 'LOCK'],
        'volume-up': ['ui', 'button', '--udid', deviceId, '--', 'VOLUME_UP'],
        'volume-down': ['ui', 'button', '--udid', deviceId, '--', 'VOLUME_DOWN'],
        'ringer': ['ui', 'button', '--udid', deviceId, '--', 'RINGER'],
      };

      const args = buttonMap[validatedButton];
      if (!args) {
        throw new SimulatorError(
          `Unsupported button: ${button}`,
          ErrorCode.INVALID_ARGUMENTS
        );
      }

      await run('idb', args);
      logger.success(`Pressed ${button} button`);
    }

    if (process.env.SIM_CLI_FORMAT === 'json') {
      logger.json({ success: true, button: validatedButton, device: deviceId });
    }
  } catch (error) {
    logger.stopSpinner(false);
    throw error;
  }
}

/**
 * Get the complete accessibility tree of the current screen
 */
export async function inspect(options: {
  format?: 'json' | 'tree' | 'table';
  output?: string;
  device?: string;
} = {}): Promise<void> {
  const deviceId = await getDeviceId(options.device);
  const format = options.format || 'json';

  logger.startSpinner('Inspecting UI accessibility tree...');

  try {
    const { stdout, stderr } = await run('idb', [
      'ui', 'describe-all',
      '--udid', deviceId,
      '--json',
      '--nested'
    ]);

    if (stderr) {
      throw new SimulatorError(`Inspect failed: ${stderr}`, ErrorCode.GENERAL_ERROR);
    }

    logger.stopSpinner(true);

    const data = JSON.parse(stdout);

    if (options.output) {
      const outputPath = path.resolve(options.output);
      writeFile(outputPath, JSON.stringify(data, null, 2));
      logger.success(`Accessibility tree saved to: ${outputPath}`);
    }

    if (process.env.SIM_CLI_FORMAT === 'json' || format === 'json') {
      logger.json(data);
    } else if (format === 'tree') {
      console.log(JSON.stringify(data, null, 2));
    } else if (format === 'table') {
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    logger.stopSpinner(false);
    throw error;
  }
}

/**
 * Get accessibility information for element at coordinates
 */
export async function inspectPoint(
  x: number,
  y: number,
  options: { device?: string } = {}
): Promise<void> {
  const deviceId = await getDeviceId(options.device);

  logger.startSpinner(`Inspecting element at (${x}, ${y})...`);

  try {
    const { stdout, stderr } = await run('idb', [
      'ui', 'describe-point',
      '--udid', deviceId,
      '--json',
      '--', String(x), String(y)
    ]);

    if (stderr) {
      throw new SimulatorError(`Inspect failed: ${stderr}`, ErrorCode.GENERAL_ERROR);
    }

    logger.stopSpinner(true);

    const data = JSON.parse(stdout);

    if (process.env.SIM_CLI_FORMAT === 'json') {
      logger.json(data);
    } else {
      logger.success(`Element at (${x}, ${y}):`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    logger.stopSpinner(false);
    throw error;
  }
}

/**
 * Capture and display the current screen
 */
export async function view(options: {
  output?: string;
  format?: 'png' | 'jpeg';
  quality?: string;
  device?: string;
} = {}): Promise<void> {
  const deviceId = await getDeviceId(options.device);
  const format = options.format || 'jpeg';
  const quality = parseInt(options.quality || '80', 10);

  logger.startSpinner('Capturing screen...');

  try {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-cli-'));
    const tempPng = path.join(tmpDir, 'screen.png');
    const tempOutput = path.join(tmpDir, `screen.${format}`);

    await run('xcrun', [
      'simctl', 'io', deviceId,
      'screenshot', '--type=png',
      '--', tempPng
    ]);

    const { stdout: uiOutput } = await run('idb', [
      'ui', 'describe-all',
      '--udid', deviceId,
      '--json'
    ]);

    const uiData = JSON.parse(uiOutput);
    const frame = uiData[0]?.frame;

    if (frame && format === 'jpeg') {
      await run('sips', [
        '-z', String(frame.height), String(frame.width),
        '-s', 'format', 'jpeg',
        '-s', 'formatOptions', String(quality),
        tempPng,
        '--out', tempOutput
      ]);
    } else {
      fs.copyFileSync(tempPng, tempOutput);
    }

    if (options.output) {
      const outputPath = path.resolve(options.output);
      fs.copyFileSync(tempOutput, outputPath);
      logger.success(`Screen saved to: ${outputPath}`);
    } else {
      const imageData = fs.readFileSync(tempOutput);
      const base64 = imageData.toString('base64');

      if (process.env.SIM_CLI_FORMAT === 'json') {
        logger.json({
          success: true,
          format,
          data: base64,
          mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png'
        });
      } else {
        logger.success('Screen captured');
        console.log(`data:image/${format};base64,${base64.substring(0, 50)}...`);
      }
    }

    fs.rmSync(tmpDir, { recursive: true });
  } catch (error) {
    logger.stopSpinner(false);
    throw error;
  }
}