// Test setup file for Jest
import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.SIM_CLI_QUIET = '1'; // Suppress output during tests

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to avoid cluttering test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};