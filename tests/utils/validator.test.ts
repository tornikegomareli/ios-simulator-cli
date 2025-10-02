import {
  UDID_REGEX,
  udidSchema,
  coordinateSchema,
  durationSchema,
  textInputSchema,
  bundleIdSchema,
  hardwareButtonSchema,
  screenshotOptionsSchema,
} from '../../src/utils/validator';

describe('Validator Utilities', () => {
  describe('UDID validation', () => {
    it('should accept valid UDID format', () => {
      const validUDID = '37A360EC-75F9-4AEC-8EFA-10F4A58D8CCA';
      expect(UDID_REGEX.test(validUDID)).toBe(true);
      expect(udidSchema.parse(validUDID)).toBe(validUDID);
    });

    it('should reject invalid UDID formats', () => {
      const invalidUDIDs = [
        '37A360EC-75F9-4AEC-8EFA', // Too short
        '37A360EC-75F9-4AEC-8EFA-10F4A58D8CCA-EXTRA', // Too long
        '37A360EC75F94AEC8EFA10F4A58D8CCA', // Missing dashes
        'NOT-A-VALID-UUID-FORMAT-AT-ALL', // Invalid characters
        '37A360EC_75F9_4AEC_8EFA_10F4A58D8CCA', // Wrong separator
      ];

      invalidUDIDs.forEach(udid => {
        expect(UDID_REGEX.test(udid)).toBe(false);
        expect(() => udidSchema.parse(udid)).toThrow();
      });
    });
  });

  describe('Coordinate validation', () => {
    it('should accept valid coordinates', () => {
      const valid = { x: 100, y: 200 };
      expect(coordinateSchema.parse(valid)).toEqual(valid);
    });

    it('should accept zero coordinates', () => {
      const valid = { x: 0, y: 0 };
      expect(coordinateSchema.parse(valid)).toEqual(valid);
    });

    it('should reject negative coordinates', () => {
      expect(() => coordinateSchema.parse({ x: -1, y: 100 })).toThrow();
      expect(() => coordinateSchema.parse({ x: 100, y: -1 })).toThrow();
    });

    it('should reject non-numeric coordinates', () => {
      expect(() => coordinateSchema.parse({ x: 'abc', y: 100 })).toThrow();
      expect(() => coordinateSchema.parse({ x: 100, y: 'def' })).toThrow();
    });
  });

  describe('Duration validation', () => {
    it('should accept valid duration formats', () => {
      const validDurations = ['1', '0.5', '10.25', '0.001', '999.999'];

      validDurations.forEach(duration => {
        expect(durationSchema.parse(duration)).toBe(duration);
      });
    });

    it('should reject invalid duration formats', () => {
      const invalidDurations = [
        '-1', // Negative
        '1.2.3', // Multiple dots
        'abc', // Non-numeric
        '1,5', // Comma instead of dot
        '', // Empty string
      ];

      invalidDurations.forEach(duration => {
        expect(() => durationSchema.parse(duration)).toThrow();
      });
    });
  });

  describe('Text input validation', () => {
    it('should accept valid ASCII printable text', () => {
      const validTexts = [
        'Hello World',
        'user@example.com',
        '123-456-7890',
        'Special chars: !@#$%^&*()',
        'Mixed123ABC',
      ];

      validTexts.forEach(text => {
        expect(textInputSchema.parse(text)).toBe(text);
      });
    });

    it('should reject text with non-ASCII characters', () => {
      const invalidTexts = [
        'Hello 世界', // Contains Chinese characters
        'Café', // Contains accented character
        'Hello\nWorld', // Contains newline
        'Tab\there', // Contains tab
        'Emoji 😀', // Contains emoji
      ];

      invalidTexts.forEach(text => {
        expect(() => textInputSchema.parse(text)).toThrow();
      });
    });

    it('should reject text that is too long', () => {
      const longText = 'a'.repeat(501);
      expect(() => textInputSchema.parse(longText)).toThrow();
    });
  });

  describe('Bundle ID validation', () => {
    it('should accept valid bundle IDs', () => {
      const validBundleIds = [
        'com.apple.Safari',
        'com.example.app',
        'org.mozilla.firefox',
        'com.company.app-name',
        'com.company.app.beta',
        'MyApp',
      ];

      validBundleIds.forEach(bundleId => {
        expect(bundleIdSchema.parse(bundleId)).toBe(bundleId);
      });
    });

    it('should reject invalid bundle IDs', () => {
      const invalidBundleIds = [
        'com.example.app with spaces',
        'com.example.app@special',
        'com.example.app#hash',
        'com.example.app/slash',
        '', // Empty string
      ];

      invalidBundleIds.forEach(bundleId => {
        expect(() => bundleIdSchema.parse(bundleId)).toThrow();
      });
    });

    it('should reject bundle ID that is too long', () => {
      const longBundleId = 'com.' + 'a'.repeat(253);
      expect(() => bundleIdSchema.parse(longBundleId)).toThrow();
    });
  });

  describe('Hardware button validation', () => {
    it('should accept valid button names', () => {
      const validButtons = [
        'home',
        'lock',
        'volume-up',
        'volume-down',
        'ringer',
        'power',
        'home+lock',
      ];

      validButtons.forEach(button => {
        expect(hardwareButtonSchema.parse(button)).toBe(button);
      });
    });

    it('should reject invalid button names', () => {
      const invalidButtons = [
        'invalid',
        'HOME', // Wrong case (should be lowercase)
        'volume',
        'screen',
        'back',
      ];

      invalidButtons.forEach(button => {
        expect(() => hardwareButtonSchema.parse(button)).toThrow();
      });
    });
  });

  describe('Screenshot options validation', () => {
    it('should accept valid screenshot options', () => {
      const validOptions = [
        { type: 'png' },
        { type: 'jpeg' },
        { display: 'internal' },
        { display: 'external' },
        { mask: 'ignored' },
        { mask: 'alpha' },
        { mask: 'black' },
        { type: 'png', display: 'internal', mask: 'alpha' },
        {},
      ];

      validOptions.forEach(options => {
        expect(screenshotOptionsSchema.parse(options)).toMatchObject(options);
      });
    });

    it('should reject invalid screenshot options', () => {
      const invalidOptions = [
        { type: 'jpg' }, // Should be 'jpeg'
        { type: 'webp' }, // Not supported
        { display: 'both' }, // Invalid display
        { mask: 'transparent' }, // Invalid mask
      ];

      invalidOptions.forEach(options => {
        expect(() => screenshotOptionsSchema.parse(options)).toThrow();
      });
    });
  });
});