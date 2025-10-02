import { run } from '../utils/executor';
import { getLogger } from '../utils/logger';
import { getBootedDevice, listDevices } from '../utils/device';
import { SimulatorError, ErrorCode } from '../utils/error-handler';

const logger = getLogger();

/**
 * Get information about the currently booted simulator
 */
export async function info(): Promise<void> {
  logger.startSpinner('Getting simulator information...');

  try {
    const device = await getBootedDevice();

    if (process.env.SIM_CLI_FORMAT === 'json') {
      logger.json({
        success: true,
        device,
      });
    } else {
      logger.success(`Booted Simulator: ${device.name}`);
      logger.info(`UDID: ${device.udid}`);
      logger.info(`State: ${device.state}`);
      logger.info(`Runtime: ${device.runtimeIdentifier}`);
    }
  } catch (error) {
    logger.stopSpinner(false);
    throw error;
  }
}

/**
 * Open the iOS Simulator application
 */
export async function open(options: {
  ios?: string;
  deviceType?: string;
} = {}): Promise<void> {
  logger.startSpinner('Opening iOS Simulator...');

  try {
    // If specific device requested, boot it first
    if (options.deviceType || options.ios) {
      const devices = await listDevices({
        ...(options.ios && { iosVersion: options.ios }),
        ...(options.deviceType && { deviceType: options.deviceType }),
      });

      if (devices.length === 0) {
        throw new SimulatorError(
          'No matching simulator found',
          ErrorCode.SIMULATOR_NOT_FOUND,
          ['Run: sim-cli list to see available devices']
        );
      }

      // Boot the first matching device if not already booted
      const device = devices[0];
      if (device && device.state !== 'Booted') {
        logger.updateSpinner(`Booting ${device.name}...`);
        await run('xcrun', ['simctl', 'boot', device.udid]);
      }
    }

    // Open the Simulator app
    await run('open', ['-a', 'Simulator.app']);

    logger.success('iOS Simulator opened successfully');

    if (process.env.SIM_CLI_FORMAT === 'json') {
      logger.json({ success: true, message: 'Simulator opened' });
    }
  } catch (error) {
    logger.stopSpinner(false);
    throw error;
  }
}

/**
 * List all available simulators
 */
export async function list(options: {
  ios?: string;
  deviceType?: string;
  booted?: boolean;
} = {}): Promise<void> {
  logger.startSpinner('Fetching simulator list...');

  try {
    const devices = await listDevices({
      ...(options.ios && { iosVersion: options.ios }),
      ...(options.deviceType && { deviceType: options.deviceType }),
      ...(options.booted && { bootedOnly: options.booted }),
    });

    logger.stopSpinner(true);

    if (process.env.SIM_CLI_FORMAT === 'json') {
      logger.json({
        success: true,
        devices,
        count: devices.length,
      });
    } else if (devices.length === 0) {
      logger.warn('No simulators found matching the criteria');
    } else {
      logger.success(`Found ${devices.length} simulator(s)`);

      // Group by runtime for better display
      const grouped = devices.reduce((acc, device) => {
        const runtime = device.runtimeIdentifier.split('.').pop() || 'Unknown';
        if (!acc[runtime]) acc[runtime] = [];
        acc[runtime]!.push(device);
        return acc;
      }, {} as Record<string, typeof devices>);

      for (const [runtime, deviceList] of Object.entries(grouped)) {
        console.log(`\n${runtime}:`);
        logger.table(
          deviceList.map(d => ({
            Name: d.name,
            UDID: d.udid,
            State: d.state,
            Available: d.isAvailable ? '✓' : '✗',
          }))
        );
      }
    }
  } catch (error) {
    logger.stopSpinner(false);
    throw error;
  }
}