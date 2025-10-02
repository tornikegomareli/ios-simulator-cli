import { run } from './executor';
import { SimulatorError, ErrorCode } from './error-handler';
import { udidSchema } from './validator';

export interface SimulatorDevice {
  name: string;
  udid: string;
  state: 'Booted' | 'Shutdown' | 'Creating' | 'Booting' | 'Shutting Down';
  isAvailable: boolean;
  deviceTypeIdentifier: string;
  runtimeIdentifier: string;
}

/**
 * Get the currently booted simulator device
 */
export async function getBootedDevice(): Promise<SimulatorDevice> {
  const { stdout, stderr } = await run('xcrun', ['simctl', 'list', 'devices', '--json']);

  if (stderr) {
    throw new SimulatorError(`Failed to list devices: ${stderr}`, ErrorCode.GENERAL_ERROR);
  }

  try {
    const data = JSON.parse(stdout);
    const devices = data.devices;

    // Search through all runtime versions for booted device
    for (const runtime in devices) {
      const deviceList = devices[runtime];
      for (const device of deviceList) {
        if (device.state === 'Booted') {
          return {
            name: device.name,
            udid: device.udid,
            state: device.state,
            isAvailable: device.isAvailable ?? true,
            deviceTypeIdentifier: device.deviceTypeIdentifier,
            runtimeIdentifier: runtime,
          };
        }
      }
    }
  } catch (error) {
    throw new SimulatorError('Failed to parse device list', ErrorCode.GENERAL_ERROR);
  }

  throw new SimulatorError(
    'No simulator is currently booted',
    ErrorCode.SIMULATOR_NOT_FOUND,
    [
      'Open Simulator.app',
      'Run: sim-cli open',
      'Specify a device with --device <udid>',
    ]
  );
}

/**
 * Get device UDID, either from provided value or from booted device
 */
export async function getDeviceId(providedId?: string): Promise<string> {
  if (providedId) {
    // Validate the provided UDID
    const result = udidSchema.safeParse(providedId);
    if (!result.success) {
      throw new SimulatorError(
        'Invalid device UDID format',
        ErrorCode.INVALID_ARGUMENTS,
        ['UDID must be in format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX']
      );
    }
    return providedId;
  }

  // Check environment variable
  const envDevice = process.env.SIM_CLI_DEVICE;
  if (envDevice) {
    const result = udidSchema.safeParse(envDevice);
    if (!result.success) {
      throw new SimulatorError(
        'Invalid device UDID in SIM_CLI_DEVICE environment variable',
        ErrorCode.INVALID_ARGUMENTS
      );
    }
    return envDevice;
  }

  // Get the booted device
  const device = await getBootedDevice();
  return device.udid;
}

/**
 * List all available simulators
 */
export async function listDevices(options?: {
  iosVersion?: string;
  deviceType?: string;
  bootedOnly?: boolean;
}): Promise<SimulatorDevice[]> {
  const { stdout, stderr } = await run('xcrun', ['simctl', 'list', 'devices', '--json']);

  if (stderr) {
    throw new SimulatorError(`Failed to list devices: ${stderr}`, ErrorCode.GENERAL_ERROR);
  }

  try {
    const data = JSON.parse(stdout);
    const allDevices: SimulatorDevice[] = [];

    for (const runtime in data.devices) {
      const deviceList = data.devices[runtime];

      // Filter by iOS version if specified
      if (options?.iosVersion && !runtime.includes(options.iosVersion)) {
        continue;
      }

      for (const device of deviceList) {
        // Filter by device type if specified
        if (options?.deviceType && !device.name.includes(options.deviceType)) {
          continue;
        }

        // Filter by booted state if specified
        if (options?.bootedOnly && device.state !== 'Booted') {
          continue;
        }

        allDevices.push({
          name: device.name,
          udid: device.udid,
          state: device.state,
          isAvailable: device.isAvailable ?? true,
          deviceTypeIdentifier: device.deviceTypeIdentifier,
          runtimeIdentifier: runtime,
        });
      }
    }

    return allDevices;
  } catch (error) {
    throw new SimulatorError('Failed to parse device list', ErrorCode.GENERAL_ERROR);
  }
}