# iOS Simulator CLI - Implementation Tasks

## Overview
This document outlines all features to be implemented in the iOS Simulator CLI tool, which provides a command-line interface for iOS simulator automation.

## Core Infrastructure Tasks

### 1. Project Setup
- [x] Create project folder structure
- [ ] Initialize TypeScript project with tsconfig.json
- [ ] Set up package.json with dependencies
- [ ] Configure ESLint and Prettier
- [ ] Set up build scripts
- [ ] Create GitHub Actions workflow for CI/CD

### 2. CLI Framework
- [ ] Implement main CLI entry point using Commander.js
- [ ] Add global options (--verbose, --json, --help)
- [ ] Implement error handling and user-friendly error messages
- [ ] Add logging system with verbosity levels
- [ ] Create help documentation system

### 3. Core Utilities
- [ ] Implement secure command execution wrapper
- [ ] Add input validation with Zod schemas
- [ ] Create path resolution utilities
- [ ] Implement environment variable handling
- [ ] Add output formatting (plain text, JSON, table)

## Feature Implementation Tasks

### 4. Simulator Management Commands

#### `sim-cli info`
- [ ] Get currently booted simulator ID and details
- [ ] Show iOS version and device type
- [ ] Display simulator state (Booted/Shutdown)
- **Testable**: Yes - Mock xcrun simctl output

#### `sim-cli open`
- [ ] Open iOS Simulator application
- [ ] Add --device flag to specify device type
- [ ] Add --ios flag to specify iOS version
- **Testable**: Yes - Verify command execution

#### `sim-cli list`
- [ ] List all available simulators
- [ ] Filter by iOS version
- [ ] Filter by device type
- [ ] Show device states
- **Testable**: Yes - Mock xcrun simctl list output

### 5. UI Interaction Commands

#### `sim-cli tap <x> <y>`
- [ ] Tap at specific coordinates
- [ ] Add --duration flag for press duration
- [ ] Add --device flag for specific simulator
- [ ] Validate coordinate inputs
- **Testable**: Yes - Validate input parsing and command construction

#### `sim-cli type <text>`
- [ ] Type text into focused field
- [ ] Handle special characters safely
- [ ] Add --device flag
- [ ] Validate text input (ASCII printable only)
- **Testable**: Yes - Validate text sanitization

#### `sim-cli swipe <x1> <y1> <x2> <y2>`
- [ ] Perform swipe gesture
- [ ] Add --duration flag
- [ ] Add --delta flag for step size
- [ ] Add --device flag
- **Testable**: Yes - Validate coordinate parsing

#### `sim-cli press <button>`
- [ ] Press hardware buttons (home, lock, volume)
- [ ] Support button combinations
- [ ] Add --device flag
- **Testable**: Yes - Validate button mapping

### 6. UI Inspection Commands

#### `sim-cli inspect`
- [ ] Get full accessibility tree as JSON
- [ ] Add --format flag (json, tree, table)
- [ ] Add --output flag to save to file
- [ ] Add --device flag
- **Testable**: Yes - Mock idb output parsing

#### `sim-cli inspect-point <x> <y>`
- [ ] Get element at specific coordinates
- [ ] Show element properties
- [ ] Add --device flag
- **Testable**: Yes - Mock idb output parsing

#### `sim-cli view`
- [ ] Capture and display current screen
- [ ] Save as base64 or file
- [ ] Add --output flag for file path
- [ ] Add --format flag (png, jpeg)
- [ ] Add --quality flag for JPEG compression
- **Testable**: Partial - Validate options, skip actual capture

### 7. Media Capture Commands

#### `sim-cli screenshot [path]`
- [ ] Take screenshot and save to file
- [ ] Support multiple formats (png, jpeg, tiff, bmp, gif)
- [ ] Add --type flag for format
- [ ] Add --display flag (internal/external)
- [ ] Add --mask flag for non-rectangular displays
- [ ] Default to ~/Downloads if no path specified
- **Testable**: Yes - Validate path handling and options

#### `sim-cli record [path]`
- [ ] Start video recording
- [ ] Add --codec flag (h264, hevc)
- [ ] Add --display flag
- [ ] Add --mask flag
- [ ] Add --force flag to overwrite
- [ ] Generate default filename with timestamp
- **Testable**: Partial - Validate options

#### `sim-cli record-stop`
- [ ] Stop active video recording
- [ ] Show saved file path
- [ ] Handle no active recording gracefully
- **Testable**: No - Requires active recording

### 8. App Management Commands

#### `sim-cli install <app-path>`
- [ ] Install .app or .ipa bundle
- [ ] Validate app bundle exists
- [ ] Add --device flag
- [ ] Show installation progress
- **Testable**: Yes - Validate path and bundle detection

#### `sim-cli launch <bundle-id>`
- [ ] Launch app by bundle identifier
- [ ] Add --terminate flag to kill if running
- [ ] Add --device flag
- [ ] Show launched app PID
- **Testable**: Yes - Validate bundle ID format

#### `sim-cli uninstall <bundle-id>`
- [ ] Uninstall app by bundle identifier
- [ ] Add --device flag
- [ ] Confirm before uninstalling
- **Testable**: Yes - Validate bundle ID format

#### `sim-cli app-list`
- [ ] List all installed apps
- [ ] Show bundle IDs and names
- [ ] Add --device flag
- **Testable**: Yes - Mock output parsing

### 9. Advanced Features

#### `sim-cli batch <script-file>`
- [ ] Execute batch commands from file
- [ ] Support JSON and YAML formats
- [ ] Add --dry-run flag
- [ ] Show execution progress
- **Testable**: Yes - Validate script parsing

#### `sim-cli watch <command>`
- [ ] Watch and re-execute commands
- [ ] Add --interval flag
- [ ] Add --times flag for max iterations
- **Testable**: Partial - Validate watch logic

#### `sim-cli config`
- [ ] Manage CLI configuration
- [ ] Set default device
- [ ] Set default output directory
- [ ] Show current configuration
- **Testable**: Yes - Configuration file handling

## Testing Tasks

### 10. Unit Tests
- [ ] Command parsing tests
- [ ] Input validation tests
- [ ] Path resolution tests
- [ ] Output formatting tests
- [ ] Mock command execution tests

### 11. Integration Tests
- [ ] Test with actual simulator (manual)
- [ ] Test error scenarios
- [ ] Test edge cases
- [ ] Performance testing for batch operations

## Documentation Tasks

### 12. Documentation
- [ ] Write comprehensive README
- [ ] Create man pages
- [ ] Add inline help for all commands
- [ ] Create example scripts
- [ ] Write troubleshooting guide
- [ ] Create migration guide from MCP

## Release Tasks

### 13. Publishing
- [ ] Set up npm publishing
- [ ] Create release automation
- [ ] Add changelog generation
- [ ] Create homebrew formula
- [ ] Submit to package managers

## Non-Testable Features
These features require actual simulator interaction and are difficult to unit test:
- Actual screenshot/video capture
- Real device interaction
- Simulator app launching
- Active recording stop

## Testing Strategy
- Use Jest for unit testing
- Mock external commands (xcrun, idb) for predictable testing
- Create fixture files for command outputs
- Test error handling and edge cases
- Skip integration tests that require actual simulator

## Priority Order
1. Core infrastructure (CLI framework, utilities)
2. Basic simulator commands (info, open, list)
3. UI interaction commands (tap, type, swipe)
4. Media capture (screenshot, view)
5. App management (install, launch)
6. UI inspection (inspect, inspect-point)
7. Advanced features (batch, watch, config)
8. Documentation and release