import { run, runBackground } from '../utils/executor';
import { bundleIdSchema } from '../utils/validator';
import { getDeviceId } from '../utils/device';
import { createLogger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger();

interface NotificationPayload {
  aps: {
    alert?: {
      title?: string;
      subtitle?: string;
      body?: string;
    } | string;
    badge?: number;
    sound?: string;
    category?: string;
    'thread-id'?: string;
    'mutable-content'?: number;
    'content-available'?: number;
  };
  [key: string]: any; // Custom data fields
}

interface NotificationOptions {
  title?: string;
  subtitle?: string;
  body?: string;
  badge?: number;
  sound?: string;
  category?: string;
  threadId?: string;
  customData?: Record<string, any>;
  payload?: string; // Raw JSON payload
  file?: string; // Path to JSON file
  machineReadable?: boolean; // For LLM-friendly output
}

/**
 * Send a push notification to an app on the simulator
 */
export async function sendNotification(bundleId: string, options: NotificationOptions = {}): Promise<void> {
  try {
    // Validate bundle ID
    bundleIdSchema.parse(bundleId);

    // Get device ID
    const deviceId = await getDeviceId();

    // Build notification payload
    let payload: NotificationPayload;

    if (options.file) {
      // Load from file
      const content = fs.readFileSync(options.file, 'utf-8');
      payload = JSON.parse(content);
    } else if (options.payload) {
      // Use raw payload
      payload = JSON.parse(options.payload);
    } else {
      // Build from options
      payload = {
        aps: {}
      };

      // Handle alert content
      if (options.title || options.body || options.subtitle) {
        payload.aps.alert = {
          title: options.title,
          subtitle: options.subtitle,
          body: options.body
        };
      }

      // Add other APS fields
      if (options.badge !== undefined) payload.aps.badge = options.badge;
      if (options.sound) payload.aps.sound = options.sound;
      if (options.category) payload.aps.category = options.category;
      if (options.threadId) payload.aps['thread-id'] = options.threadId;

      // Add custom data
      if (options.customData) {
        Object.assign(payload, options.customData);
      }
    }

    // Create temporary file with payload
    const tmpDir = path.join(process.env.TMPDIR || '/tmp', 'sim-cli');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const tmpFile = path.join(tmpDir, `notification-${Date.now()}.json`);
    fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2));

    try {
      // Send notification using simctl
      const result = await run('xcrun', [
        'simctl', 'push',
        deviceId,
        bundleId,
        tmpFile
      ]);

      // Clean up temp file
      fs.unlinkSync(tmpFile);

      if (options.machineReadable || process.env.SIM_CLI_MACHINE_READABLE === '1') {
        // LLM-friendly output
        console.log(JSON.stringify({
          success: true,
          action: 'send_notification',
          bundleId,
          deviceId,
          payload,
          timestamp: new Date().toISOString()
        }, null, 2));
      } else if (!process.env.SIM_CLI_QUIET) {
        logger.success('Push notification sent successfully');
        if (process.env.SIM_CLI_VERBOSE) {
          logger.info(`Bundle ID: ${bundleId}`);
          logger.info(`Payload: ${JSON.stringify(payload, null, 2)}`);
        }
      }
    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
      throw error;
    }
  } catch (error: any) {
    if (options.machineReadable || process.env.SIM_CLI_MACHINE_READABLE === '1') {
      console.log(JSON.stringify({
        success: false,
        action: 'send_notification',
        error: error.message || String(error),
        bundleId,
        timestamp: new Date().toISOString()
      }, null, 2));
      process.exit(1);
    } else {
      throw error;
    }
  }
}

/**
 * Send a simple text notification
 */
export async function sendSimpleNotification(
  bundleId: string,
  title: string,
  body?: string,
  options: { machineReadable?: boolean } = {}
): Promise<void> {
  return sendNotification(bundleId, {
    title,
    body,
    sound: 'default',
    machineReadable: options.machineReadable
  });
}

/**
 * Test notification delivery to an app
 */
export async function testNotification(bundleId: string, options: { machineReadable?: boolean } = {}): Promise<void> {
  return sendNotification(bundleId, {
    title: 'Test Notification',
    subtitle: 'From iOS Simulator CLI',
    body: `Test notification sent at ${new Date().toLocaleTimeString()}`,
    badge: 1,
    sound: 'default',
    customData: {
      test: true,
      timestamp: Date.now()
    },
    machineReadable: options.machineReadable
  });
}

/**
 * Clear badge count for an app
 */
export async function clearBadge(bundleId: string, options: { machineReadable?: boolean } = {}): Promise<void> {
  return sendNotification(bundleId, {
    badge: 0,
    machineReadable: options.machineReadable
  });
}

/**
 * Send a silent notification (content-available)
 */
export async function sendSilentNotification(
  bundleId: string,
  customData?: Record<string, any>,
  options: { machineReadable?: boolean } = {}
): Promise<void> {
  const payload: NotificationPayload = {
    aps: {
      'content-available': 1
    }
  };

  if (customData) {
    Object.assign(payload, customData);
  }

  return sendNotification(bundleId, {
    payload: JSON.stringify(payload),
    machineReadable: options.machineReadable
  });
}