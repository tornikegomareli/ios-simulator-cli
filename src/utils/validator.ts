import { z } from 'zod';

/**
 * Strict UDID/UUID pattern: 8-4-4-4-12 hexadecimal characters
 * Example: 37A360EC-75F9-4AEC-8EFA-10F4A58D8CCA
 */
export const UDID_REGEX = /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/;

export const udidSchema = z.string().regex(UDID_REGEX, 'Invalid UDID format');

export const coordinateSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
});

export const durationSchema = z.string().regex(/^\d+(\.\d+)?$/, 'Duration must be a positive number');

export const textInputSchema = z.string()
  .max(500, 'Text is too long (max 500 characters)')
  .regex(/^[\x20-\x7E]+$/, 'Text must contain only ASCII printable characters');

export const filePathSchema = z.string()
  .max(1024, 'Path is too long (max 1024 characters)');

export const bundleIdSchema = z.string()
  .max(256, 'Bundle ID is too long (max 256 characters)')
  .regex(/^[a-zA-Z0-9.-]+$/, 'Invalid bundle ID format');

export const tapOptionsSchema = z.object({
  duration: durationSchema.optional(),
  device: udidSchema.optional(),
});

export const swipeOptionsSchema = z.object({
  duration: durationSchema.optional(),
  delta: z.coerce.number().min(1).optional(),
  device: udidSchema.optional(),
});

export const screenshotOptionsSchema = z.object({
  type: z.enum(['png', 'tiff', 'bmp', 'gif', 'jpeg']).optional(),
  display: z.enum(['internal', 'external']).optional(),
  mask: z.enum(['ignored', 'alpha', 'black']).optional(),
  device: udidSchema.optional(),
});

export const recordOptionsSchema = z.object({
  codec: z.enum(['h264', 'hevc']).optional(),
  display: z.enum(['internal', 'external']).optional(),
  mask: z.enum(['ignored', 'alpha', 'black']).optional(),
  force: z.boolean().optional(),
  device: udidSchema.optional(),
});

export const hardwareButtonSchema = z.enum([
  'home',
  'lock',
  'volume-up',
  'volume-down',
  'ringer',
  'power',
  'home+lock',
]);