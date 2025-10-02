#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { z } from 'zod';
import * as simulatorCommands from './commands/simulator';
import * as uiCommands from './commands/ui';
import * as mediaCommands from './commands/media';
import * as appCommands from './commands/app';
import * as notificationCommands from './commands/notification';
import { createLogger } from './utils/logger';
import { handleError } from './utils/error-handler';
import * as fs from 'fs';
import * as path from 'path';

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
);
const version = packageJson.version;

const logger = createLogger();
const program = new Command();

// Global configuration
program
  .name('sim-cli')
  .description('iOS Simulator CLI - A powerful command-line interface for iOS Simulator automation')
  .version(version)
  .option('-v, --verbose', 'Enable verbose output')
  .option('-q, --quiet', 'Suppress non-error output')
  .option('--json', 'Format output as JSON')
  .option('--machine-readable', 'LLM-friendly structured output format')
  .option('-d, --device <udid>', 'Target specific simulator by UDID')
  .option('-t, --timeout <seconds>', 'Command timeout in seconds', '30')
  .hook('preAction', (thisCommand, actionCommand) => {
    const opts = actionCommand.opts();
    if (opts.verbose) {
      process.env.SIM_CLI_VERBOSE = '1';
    }
    if (opts.quiet) {
      process.env.SIM_CLI_QUIET = '1';
    }
    if (opts.json) {
      process.env.SIM_CLI_FORMAT = 'json';
    }
    if (opts.machineReadable) {
      process.env.SIM_CLI_MACHINE_READABLE = '1';
      process.env.SIM_CLI_FORMAT = 'json';
    }
    if (opts.device) {
      process.env.SIM_CLI_DEVICE = opts.device;
    }
    if (opts.timeout) {
      process.env.SIM_CLI_TIMEOUT = opts.timeout;
    }
  });

// Simulator Management Commands
program
  .command('info')
  .description('Get information about the currently booted simulator')
  .action(async () => {
    try {
      await simulatorCommands.info();
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('open')
  .description('Open the iOS Simulator application')
  .option('--ios <version>', 'iOS version (e.g., 17.0)')
  .option('--device-type <type>', 'Device type (e.g., "iPhone 15 Pro")')
  .action(async (options) => {
    try {
      await simulatorCommands.open(options);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('list')
  .description('List all available simulators')
  .option('--ios <version>', 'Filter by iOS version')
  .option('--device-type <type>', 'Filter by device type')
  .option('--booted', 'Show only booted devices')
  .action(async (options) => {
    try {
      await simulatorCommands.list(options);
    } catch (error) {
      handleError(error);
    }
  });

// UI Interaction Commands
program
  .command('tap <x> <y>')
  .description('Tap at specific screen coordinates')
  .option('--duration <seconds>', 'Press duration in seconds')
  .action(async (x: string, y: string, options) => {
    try {
      const coords = z.object({
        x: z.coerce.number().min(0),
        y: z.coerce.number().min(0),
      }).parse({ x, y });

      await uiCommands.tap(coords.x, coords.y, options);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('type <text>')
  .description('Type text into the currently focused field')
  .action(async (text: string) => {
    try {
      await uiCommands.type(text);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('swipe <x1> <y1> <x2> <y2>')
  .description('Perform a swipe gesture')
  .option('--duration <seconds>', 'Swipe duration in seconds')
  .option('--delta <pixels>', 'Step size in pixels', '1')
  .action(async (x1: string, y1: string, x2: string, y2: string, options) => {
    try {
      const coords = z.object({
        x1: z.coerce.number().min(0),
        y1: z.coerce.number().min(0),
        x2: z.coerce.number().min(0),
        y2: z.coerce.number().min(0),
      }).parse({ x1, y1, x2, y2 });

      await uiCommands.swipe(coords.x1, coords.y1, coords.x2, coords.y2, options);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('press <button>')
  .description('Press hardware buttons (home, lock, volume-up, volume-down)')
  .action(async (button: string) => {
    try {
      await uiCommands.press(button);
    } catch (error) {
      handleError(error);
    }
  });

// UI Inspection Commands
program
  .command('inspect')
  .description('Get the complete accessibility tree of the current screen')
  .option('--format <type>', 'Output format (json, tree, table)', 'json')
  .option('-o, --output <path>', 'Save output to file')
  .action(async (options) => {
    try {
      await uiCommands.inspect(options);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('inspect-point <x> <y>')
  .description('Get accessibility information for element at coordinates')
  .action(async (x: string, y: string) => {
    try {
      const coords = z.object({
        x: z.coerce.number().min(0),
        y: z.coerce.number().min(0),
      }).parse({ x, y });

      await uiCommands.inspectPoint(coords.x, coords.y);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('view')
  .description('Capture and display the current screen')
  .option('-o, --output <path>', 'Save to file')
  .option('--format <type>', 'Image format (png, jpeg)', 'jpeg')
  .option('--quality <number>', 'JPEG quality (1-100)', '80')
  .action(async (options) => {
    try {
      await uiCommands.view(options);
    } catch (error) {
      handleError(error);
    }
  });

// Media Capture Commands
program
  .command('screenshot [path]')
  .description('Take a screenshot of the simulator')
  .option('--type <format>', 'Image format (png, jpeg, tiff, bmp, gif)', 'png')
  .option('--display <type>', 'Display to capture (internal, external)')
  .option('--mask <policy>', 'Mask policy for notch (ignored, alpha, black)')
  .action(async (path: string | undefined, options) => {
    try {
      await mediaCommands.screenshot(path, options);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('record [path]')
  .description('Start recording a video of the simulator')
  .option('--codec <type>', 'Video codec (h264, hevc)', 'hevc')
  .option('--display <type>', 'Display to capture (internal, external)')
  .option('--mask <policy>', 'Mask policy for notch')
  .option('-f, --force', 'Overwrite existing file')
  .action(async (path: string | undefined, options) => {
    try {
      await mediaCommands.record(path, options);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('record-stop')
  .description('Stop the current video recording')
  .action(async () => {
    try {
      await mediaCommands.recordStop();
    } catch (error) {
      handleError(error);
    }
  });

// App Management Commands
program
  .command('install <app-path>')
  .description('Install an app on the simulator')
  .action(async (appPath: string) => {
    try {
      await appCommands.install(appPath);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('launch <bundle-id>')
  .description('Launch an installed app')
  .option('--terminate', 'Terminate app if already running')
  .action(async (bundleId: string, options) => {
    try {
      await appCommands.launch(bundleId, options);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('uninstall <bundle-id>')
  .description('Uninstall an app')
  .action(async (bundleId: string) => {
    try {
      await appCommands.uninstall(bundleId);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('app-list')
  .description('List all installed apps')
  .action(async () => {
    try {
      await appCommands.list();
    } catch (error) {
      handleError(error);
    }
  });

// Push Notification Commands
program
  .command('notify <bundle-id>')
  .description('Send a push notification to an app')
  .option('--title <text>', 'Notification title')
  .option('--subtitle <text>', 'Notification subtitle')
  .option('--body <text>', 'Notification body')
  .option('--badge <number>', 'Badge number')
  .option('--sound <name>', 'Sound name (e.g., "default")')
  .option('--category <id>', 'Category identifier')
  .option('--thread-id <id>', 'Thread identifier for grouping')
  .option('--data <json>', 'Custom data as JSON string')
  .option('--payload <json>', 'Full notification payload as JSON')
  .option('--file <path>', 'Load notification from JSON file')
  .action(async (bundleId: string, options) => {
    try {
      const customData = options.data ? JSON.parse(options.data) : undefined;
      await notificationCommands.sendNotification(bundleId, {
        title: options.title,
        subtitle: options.subtitle,
        body: options.body,
        badge: options.badge ? parseInt(options.badge) : undefined,
        sound: options.sound,
        category: options.category,
        threadId: options.threadId,
        customData,
        payload: options.payload,
        file: options.file,
        machineReadable: process.env.SIM_CLI_MACHINE_READABLE === '1'
      });
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('notify-simple <bundle-id> <title> [body]')
  .description('Send a simple text notification')
  .action(async (bundleId: string, title: string, body?: string) => {
    try {
      await notificationCommands.sendSimpleNotification(bundleId, title, body, {
        machineReadable: process.env.SIM_CLI_MACHINE_READABLE === '1'
      });
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('notify-test <bundle-id>')
  .description('Send a test notification to verify delivery')
  .action(async (bundleId: string) => {
    try {
      await notificationCommands.testNotification(bundleId, {
        machineReadable: process.env.SIM_CLI_MACHINE_READABLE === '1'
      });
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('notify-silent <bundle-id>')
  .description('Send a silent (content-available) notification')
  .option('--data <json>', 'Custom data as JSON string')
  .action(async (bundleId: string, options) => {
    try {
      const customData = options.data ? JSON.parse(options.data) : undefined;
      await notificationCommands.sendSilentNotification(bundleId, customData, {
        machineReadable: process.env.SIM_CLI_MACHINE_READABLE === '1'
      });
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('clear-badge <bundle-id>')
  .description('Clear the badge count for an app')
  .action(async (bundleId: string) => {
    try {
      await notificationCommands.clearBadge(bundleId, {
        machineReadable: process.env.SIM_CLI_MACHINE_READABLE === '1'
      });
    } catch (error) {
      handleError(error);
    }
  });

// Advanced Commands
program
  .command('batch <script-file>')
  .description('Execute multiple commands from a script file')
  .option('--dry-run', 'Preview commands without executing')
  .action(async (scriptFile: string, options) => {
    try {
      logger.info('Batch command not yet implemented');
      // TODO: Implement batch execution
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('watch <command>')
  .description('Watch and repeatedly execute a command')
  .option('-i, --interval <seconds>', 'Interval between executions', '1')
  .option('--times <count>', 'Maximum number of iterations')
  .action(async (command: string, options) => {
    try {
      logger.info('Watch command not yet implemented');
      // TODO: Implement watch functionality
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('config <action> [key] [value]')
  .description('Manage CLI configuration (get, set, list, reset)')
  .action(async (action: string, key?: string, value?: string) => {
    try {
      logger.info('Config command not yet implemented');
      // TODO: Implement configuration management
    } catch (error) {
      handleError(error);
    }
  });

// Error handling for unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`\nError: Unknown command '${program.args.join(' ')}'`));
  console.log(chalk.yellow('\nRun `sim-cli --help` for a list of available commands'));
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}