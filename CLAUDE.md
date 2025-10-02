# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and other AI assistants when working with the iOS Simulator CLI project.

## Project Overview

iOS Simulator CLI (`sim-cli`) is a command-line tool for automating iOS simulator interactions. It provides a clean, testable alternative to MCP servers, making it easier to integrate into CI/CD pipelines, automation scripts, and AI agent workflows.

## Key Design Principles

### 1. **CLI First**
- Every feature is a discrete command with clear inputs/outputs
- No persistent server processes or complex protocols
- Standard UNIX philosophy: do one thing well

### 2. **Security by Design**
- ALWAYS use `--` separator before user-provided arguments in shell commands
- Validate ALL inputs with Zod schemas before execution
- Never interpolate user input directly into shell commands
- Use `shell: false` option in all exec/spawn calls

### 3. **Testability**
- Mock external commands (xcrun, idb) for unit tests
- Separate command construction from execution
- Use dependency injection for command runners
- Test input validation separately from command execution

### 4. **User Experience**
- Provide clear, actionable error messages
- Include examples in help text
- Support both human-readable and JSON output
- Fail fast with helpful suggestions

## Architecture Guidelines

### File Structure
```
src/
  cli.ts           # Main CLI entry point with Commander setup
  commands/        # Individual command implementations
    simulator.ts   # Simulator management commands
    ui.ts         # UI interaction commands
    media.ts      # Screenshot/recording commands
    app.ts        # App management commands
  utils/
    executor.ts   # Safe command execution wrapper
    validator.ts  # Input validation schemas
    formatter.ts  # Output formatting utilities
    paths.ts      # Path resolution helpers
tests/
  commands/       # Command-specific tests
  utils/          # Utility function tests
  fixtures/       # Mock data for tests
```

### Code Style

When implementing commands:

```typescript
// GOOD: Clear separation of concerns
export async function tapCommand(x: number, y: number, options: TapOptions) {
  // 1. Validate inputs
  const validated = tapSchema.parse({ x, y, ...options });

  // 2. Build command arguments
  const args = buildTapArgs(validated);

  // 3. Execute command
  const result = await executor.run('idb', args);

  // 4. Format output
  return formatter.format(result, options.format);
}

// BAD: Mixed concerns
export async function tapCommand(x: string, y: string) {
  const result = await exec(`idb ui tap ${x} ${y}`); // Security risk!
  console.log(result);
}
```

### Security Checklist

Before implementing any command:
- [ ] Are all user inputs validated with Zod?
- [ ] Is `--` separator used before positional arguments?
- [ ] Is `shell: false` set for exec calls?
- [ ] Are file paths properly resolved and validated?
- [ ] Are error messages safe (no sensitive data)?

## Command Implementation Template

```typescript
import { z } from 'zod';
import { executor } from '../utils/executor';
import { formatter } from '../utils/formatter';

// 1. Define validation schema
const myCommandSchema = z.object({
  requiredField: z.string(),
  optionalField: z.string().optional(),
  // Add UDID validation for device-specific commands
  udid: z.string().regex(UDID_REGEX).optional()
});

// 2. Define command function
export async function myCommand(args: unknown) {
  try {
    // Validate inputs
    const validated = myCommandSchema.parse(args);

    // Get device ID if needed
    const deviceId = await getDeviceId(validated.udid);

    // Build command arguments safely
    const cmdArgs = [
      'subcommand',
      '--device', deviceId,
      '--', // ALWAYS use separator before user input
      validated.requiredField
    ];

    // Execute command
    const result = await executor.run('xcrun', cmdArgs);

    // Return formatted output
    return formatter.success(result);
  } catch (error) {
    return formatter.error(error);
  }
}

// 3. Write tests
describe('myCommand', () => {
  it('validates inputs correctly', () => {
    // Test validation logic
  });

  it('builds correct command arguments', () => {
    // Test command construction
  });

  it('handles errors gracefully', () => {
    // Test error scenarios
  });
});
```

## Testing Guidelines

### What to Test
- Input validation (required fields, formats, ranges)
- Command argument construction
- Output formatting
- Error handling
- Path resolution
- Configuration loading

### What NOT to Test (Mock Instead)
- Actual simulator interactions
- External command execution
- File system operations (use temp directories)
- Network requests

### Test Example
```typescript
import { tapCommand } from '../src/commands/ui';
import { executor } from '../src/utils/executor';

jest.mock('../src/utils/executor');

describe('tap command', () => {
  it('constructs correct idb command', async () => {
    const mockExecutor = executor as jest.Mocked<typeof executor>;
    mockExecutor.run.mockResolvedValue({ stdout: '', stderr: '' });

    await tapCommand(100, 200, { device: 'test-uuid' });

    expect(mockExecutor.run).toHaveBeenCalledWith('idb', [
      'ui', 'tap',
      '--udid', 'test-uuid',
      '--', '100', '200'
    ]);
  });
});
```

## Common Patterns

### Device ID Resolution
```typescript
async function getDeviceId(providedId?: string): Promise<string> {
  if (providedId) return providedId;

  const booted = await getBootedSimulator();
  if (!booted) {
    throw new Error('No simulator is currently booted. Please specify --device or open a simulator.');
  }

  return booted.udid;
}
```

### Output Formatting
```typescript
function formatOutput(data: any, format: 'json' | 'text' | 'table'): void {
  switch (format) {
    case 'json':
      console.log(JSON.stringify(data, null, 2));
      break;
    case 'table':
      console.table(data);
      break;
    default:
      console.log(data.message || data);
  }
}
```

### Error Messages
```typescript
// GOOD: Helpful error with suggestions
throw new Error(
  'No booted simulator found.\n' +
  'Try one of the following:\n' +
  '  • Open Simulator.app\n' +
  '  • Run: sim-cli open\n' +
  '  • Specify a device: --device <udid>'
);

// BAD: Cryptic error
throw new Error('Device not found');
```

## Dependencies

Core dependencies to use:
- `commander`: CLI framework
- `zod`: Runtime validation
- `chalk`: Terminal colors
- `ora`: Spinner for long operations
- `jest`: Testing framework
- `ts-node`: TypeScript execution

Avoid these:
- Complex state management
- Database dependencies
- Web frameworks
- Heavy abstraction layers

## Build and Release

```bash
# Development
npm run dev       # Run TypeScript directly
npm run build     # Compile to JavaScript
npm run test      # Run test suite
npm run lint      # Check code style

# Release
npm run release   # Build, test, and publish
```

## Important Notes

1. **No MCP Protocol**: This is a pure CLI tool, not an MCP server
2. **Stateless**: Each command execution is independent
3. **Exit Codes**: Use proper exit codes (0 for success, 1-255 for errors)
4. **JSON Output**: Always support --json flag for programmatic use
5. **Backwards Compatibility**: Once released, maintain CLI interface stability

## When Working on This Project

1. Read TASK.md for the full feature list
2. Follow the security checklist for every command
3. Write tests before implementation when possible
4. Update README.md with examples for new commands
5. Keep commands focused and composable
6. Prefer explicit flags over magic behavior

## Quick Command Reference

```bash
# Always mock these in tests
xcrun simctl    # Apple's simulator control
idb             # Facebook's iOS Debug Bridge

# Common patterns
sim-cli <verb> [options]           # Action commands
sim-cli <noun>-<verb> [options]    # Resource commands
sim-cli --help                      # Show help
sim-cli <command> --help           # Command help
```