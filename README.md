# iOS Simulator CLI

> 🚀 A powerful, LLM-friendly command-line interface for iOS Simulator automation - simpler, faster, and more reliable than MCP servers.

[![npm version](https://img.shields.io/npm/v/ios-simulator-cli.svg)](https://www.npmjs.com/package/ios-simulator-cli)
[![npm downloads](https://img.shields.io/npm/dm/ios-simulator-cli.svg)](https://www.npmjs.com/package/ios-simulator-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Designed for AI Agents & LLMs

This CLI is specifically optimized for integration with AI agents and Large Language Models (LLMs):

### Machine-Readable Output
```bash
# Standard output for humans
sim-cli tap 100 200
✅ Tap successful at (100, 200)

# Machine-readable output for LLMs/agents
sim-cli tap 100 200 --machine-readable
{
  "success": true,
  "action": "tap",
  "coordinates": { "x": 100, "y": 200 },
  "deviceId": "A1B2C3D4-5678-90AB-CDEF-1234567890AB",
  "timestamp": "2024-03-15T10:30:00.000Z"
}
```

### Predictable Responses
- **Structured JSON output** with `--machine-readable` flag
- **Consistent error codes** for reliable error handling
- **Standardized timestamps** in ISO 8601 format
- **Clear action identifiers** for command tracking

### Agent Integration Example
```python
import subprocess
import json

def execute_simulator_command(command):
    """Execute a simulator command with structured output."""
    result = subprocess.run(
        f"sim-cli {command} --machine-readable",
        shell=True,
        capture_output=True,
        text=True
    )

    if result.stdout:
        return json.loads(result.stdout)
    return {"success": False, "error": result.stderr}

# Example: Send a notification
response = execute_simulator_command(
    'notify com.example.app --title "Test" --body "Hello from AI"'
)

if response["success"]:
    print(f"Notification sent at {response['timestamp']}")
```

## 🤖 AI Agent Integration

### Automatic Discovery & Usage

AI agents like Claude, Codex, and others can automatically discover and use this CLI by reading a simple specification file. Just add a `CLAUDE.md` file (or similar agent spec file) to your project root:

#### Example: CLAUDE.md
```markdown
# iOS Simulator Automation

This project has iOS Simulator CLI installed for automated testing.

## Available Commands

- `sim-cli tap <x> <y>` - Tap at coordinates
- `sim-cli swipe <x1> <y1> <x2> <y2>` - Swipe gesture
- `sim-cli type "<text>"` - Type text into focused field
- `sim-cli screenshot [path]` - Take a screenshot
- `sim-cli record start/stop` - Record video
- `sim-cli install <app-path>` - Install an app
- `sim-cli launch <bundle-id>` - Launch an app
- `sim-cli notify <bundle-id> --title "<title>" --body "<body>"` - Send push notification

## Usage Examples

To test the login flow:
1. Launch app: `sim-cli launch com.myapp.ios`
2. Tap username field: `sim-cli tap 200 300`
3. Type username: `sim-cli type "testuser@example.com"`
4. Tap password field: `sim-cli tap 200 400`
5. Type password: `sim-cli type "password123"`
6. Tap login button: `sim-cli tap 200 500`
7. Take screenshot: `sim-cli screenshot login-success.png`
```

### How Agents Use It

When an AI agent encounters tasks like "test the iOS app login flow" or "take a screenshot of the app", it will:

1. **Read the spec file** to understand available commands
2. **Plan the automation** sequence needed
3. **Execute commands** step by step
4. **Verify results** using machine-readable output

#### Real Example with Claude

```markdown
User: "Test if the app's notification system works"

Claude: I'll test the notification system for you. Let me:
1. First check if a simulator is running
2. Send a test notification
3. Take a screenshot to verify

[Executes automatically:]
$ sim-cli info --json
$ sim-cli notify com.myapp.ios --title "Test Alert" --body "This is a test notification"
$ sim-cli screenshot notification-test.png

✅ Notification sent successfully and screenshot saved.
```

### Creating Your Own Agent Spec

For other AI agents or automation tools, create a spec file with:

1. **Command inventory** - List all available sim-cli commands
2. **Common workflows** - Provide task-specific command sequences
3. **Context hints** - Explain when to use each command
4. **Output format** - Specify `--json` for machine parsing

Example spec files:
- `CLAUDE.md` - For Anthropic's Claude
- `cursor-rules.md` - For Cursor IDE
- `.github/copilot-instructions.md` - For GitHub Copilot
- `aider.md` - For Aider AI assistant
- `.ai/commands.yaml` - Generic YAML format

## Installation

### Via npm (Recommended)
```bash
npm install -g ios-simulator-cli
```

### From Source
```bash
git clone https://github.com/yourusername/ios-simulator-cli.git
cd ios-simulator-cli
npm install
npm run build
npm link
```

## Prerequisites

- **macOS** 12.0 or later
- **Node.js** 18.0 or later
- **Facebook IDB** (iOS Debug Bridge)

### Installing IDB
```bash
brew tap facebook/fb
brew install facebook/fb/idb-companion
pip3 install fb-idb
```

## Quick Start

```bash
# Check if a simulator is running
sim-cli info

# Open the iOS Simulator
sim-cli open

# Take a screenshot
sim-cli screenshot ~/Desktop/screenshot.png

# Tap at coordinates
sim-cli tap 100 200

# Type text
sim-cli type "Hello, World!"

# Install and launch an app
sim-cli install ./MyApp.app
sim-cli launch com.example.myapp
```

## Command Reference

### Simulator Management

#### `sim-cli info`
Get information about the currently booted simulator.

```bash
sim-cli info
sim-cli info --json  # Output as JSON
```

#### `sim-cli open`
Open the iOS Simulator application.

```bash
sim-cli open
sim-cli open --device "iPhone 15 Pro"
sim-cli open --ios 17.0
```

#### `sim-cli list`
List all available simulators.

```bash
sim-cli list
sim-cli list --ios 17.0     # Filter by iOS version
sim-cli list --device iPhone # Filter by device type
sim-cli list --booted        # Show only booted devices
```

### UI Interaction

#### `sim-cli tap <x> <y>`
Tap at specific screen coordinates.

```bash
sim-cli tap 100 200
sim-cli tap 100 200 --duration 0.5  # Long press for 0.5 seconds
sim-cli tap 100 200 --device <udid>  # Specific simulator
```

#### `sim-cli type <text>`
Type text into the currently focused field.

```bash
sim-cli type "Hello, World!"
sim-cli type "user@example.com" --device <udid>
```

#### `sim-cli swipe <x1> <y1> <x2> <y2>`
Perform a swipe gesture.

```bash
sim-cli swipe 100 500 100 200           # Swipe up
sim-cli swipe 50 300 250 300            # Swipe right
sim-cli swipe 200 400 200 100 --duration 0.5  # Slow swipe
sim-cli swipe 100 100 200 200 --delta 10      # Step size
```

#### `sim-cli press <button>`
Press hardware buttons.

```bash
sim-cli press home
sim-cli press lock
sim-cli press volume-up
sim-cli press volume-down
sim-cli press "home+lock"  # Screenshot gesture
```

### UI Inspection

#### `sim-cli inspect`
Get the complete accessibility tree of the current screen.

```bash
sim-cli inspect
sim-cli inspect --format json    # JSON output
sim-cli inspect --format tree    # Tree visualization
sim-cli inspect --output ui.json # Save to file
```

#### `sim-cli inspect-point <x> <y>`
Get accessibility information for element at coordinates.

```bash
sim-cli inspect-point 150 300
sim-cli inspect-point 150 300 --json
```

#### `sim-cli view`
Capture and display the current screen.

```bash
sim-cli view                      # Display in terminal (if supported)
sim-cli view --output screen.jpg # Save to file
sim-cli view --format png        # PNG format
sim-cli view --quality 80        # JPEG quality (1-100)
```

### Media Capture

#### `sim-cli screenshot [path]`
Take a screenshot of the simulator.

```bash
sim-cli screenshot                           # Save to ~/Downloads with timestamp
sim-cli screenshot screenshot.png            # Save to specific file
sim-cli screenshot ~/Desktop/screen.jpg --type jpeg
sim-cli screenshot screen.png --display external  # External display
sim-cli screenshot screen.png --mask alpha       # Handle notch
```

#### `sim-cli record [path]`
Start recording a video of the simulator.

```bash
sim-cli record                           # Default filename with timestamp
sim-cli record demo.mp4                  # Specific filename
sim-cli record demo.mp4 --codec h264     # H.264 codec
sim-cli record demo.mp4 --display external
sim-cli record demo.mp4 --force         # Overwrite existing
```

#### `sim-cli record-stop`
Stop the current video recording.

```bash
sim-cli record-stop
```

### App Management

#### `sim-cli install <app-path>`
Install an app on the simulator.

```bash
sim-cli install ./MyApp.app
sim-cli install ~/Downloads/MyApp.ipa
sim-cli install ./MyApp.app --device <udid>
```

#### `sim-cli launch <bundle-id>`
Launch an installed app.

```bash
sim-cli launch com.apple.mobilesafari
sim-cli launch com.example.myapp --terminate  # Kill if running
sim-cli launch com.example.myapp --device <udid>
```

#### `sim-cli uninstall <bundle-id>`
Uninstall an app.

```bash
sim-cli uninstall com.example.myapp
sim-cli uninstall com.example.myapp --device <udid>
```

#### `sim-cli app-list`
List all installed apps.

```bash
sim-cli app-list
sim-cli app-list --json
sim-cli app-list --device <udid>
```

### Push Notifications

#### `sim-cli notify <bundle-id>`
Send a push notification to an app.

```bash
# Simple notification
sim-cli notify com.example.app --title "Hello" --body "World"

# Full notification with options
sim-cli notify com.example.app \
  --title "New Message" \
  --subtitle "John Doe" \
  --body "Hey, how are you?" \
  --badge 5 \
  --sound default \
  --category MESSAGE_CATEGORY

# Custom data payload
sim-cli notify com.example.app \
  --title "Update Available" \
  --data '{"version": "2.0.1", "priority": "high"}'

# Load from JSON file
sim-cli notify com.example.app --file notification.json

# Machine-readable output for AI agents
sim-cli notify com.example.app --title "Test" --machine-readable
```

#### `sim-cli notify-simple <bundle-id> <title> [body]`
Send a simple text notification quickly.

```bash
sim-cli notify-simple com.example.app "Lunch Time!"
sim-cli notify-simple com.example.app "Reminder" "Meeting at 3 PM"
```

#### `sim-cli notify-test <bundle-id>`
Send a test notification to verify delivery.

```bash
sim-cli notify-test com.example.app
# Sends: "Test Notification" with timestamp
```

#### `sim-cli notify-silent <bundle-id>`
Send a silent (content-available) notification for background updates.

```bash
sim-cli notify-silent com.example.app
sim-cli notify-silent com.example.app --data '{"sync": true}'
```

#### `sim-cli clear-badge <bundle-id>`
Clear the badge count for an app.

```bash
sim-cli clear-badge com.example.app
```

#### Notification JSON Format
Create a `notification.json` file:

```json
{
  "aps": {
    "alert": {
      "title": "Breaking News",
      "subtitle": "Sports",
      "body": "Your team won!"
    },
    "badge": 1,
    "sound": "default",
    "category": "NEWS_CATEGORY",
    "thread-id": "sports-news"
  },
  "custom_field": "custom_value",
  "article_id": "12345"
}
```

Then send it:
```bash
sim-cli notify com.example.app --file notification.json
```

### Advanced Features

#### `sim-cli batch <script-file>`
Execute multiple commands from a script file.

```bash
sim-cli batch commands.json
sim-cli batch commands.yaml
sim-cli batch commands.json --dry-run  # Preview without executing
```

Example script (commands.json):
```json
{
  "commands": [
    { "action": "tap", "x": 100, "y": 200 },
    { "action": "wait", "duration": 2 },
    { "action": "type", "text": "Hello" },
    { "action": "screenshot", "path": "result.png" }
  ]
}
```

#### `sim-cli watch <command>`
Watch and repeatedly execute a command.

```bash
sim-cli watch "inspect-point 100 200" --interval 1
sim-cli watch "screenshot" --interval 5 --times 10
```

#### `sim-cli config`
Manage CLI configuration.

```bash
sim-cli config set default.device "iPhone 15 Pro"
sim-cli config set default.output ~/Documents/sim-output
sim-cli config get default.device
sim-cli config list
sim-cli config reset
```

## Global Options

All commands support these global options:

- `--help, -h` - Show help for command
- `--version, -v` - Show version number
- `--verbose` - Enable verbose output
- `--quiet, -q` - Suppress non-error output
- `--json` - Format output as JSON
- `--machine-readable` - LLM-friendly structured output (implies JSON with additional metadata)
- `--device <udid>` - Target specific simulator
- `--timeout <seconds>` - Command timeout (default: 30)

## Environment Variables

- `SIM_CLI_DEFAULT_DEVICE` - Default simulator UDID
- `SIM_CLI_OUTPUT_DIR` - Default output directory for media files
- `SIM_CLI_VERBOSE` - Enable verbose logging (1 or true)
- `SIM_CLI_FORMAT` - Default output format (text, json, table)

## Examples

### Automated Testing Script
```bash
#!/bin/bash

# Open simulator and wait for boot
sim-cli open --device "iPhone 15 Pro"
sleep 5

# Launch Safari
sim-cli launch com.apple.mobilesafari

# Navigate to website
sim-cli tap 200 100  # URL bar
sim-cli type "example.com"
sim-cli press return

# Take screenshot
sim-cli screenshot test-result.png

# Close Safari
sim-cli press home
```

### Python Integration
```python
import subprocess
import json

def tap(x, y):
    result = subprocess.run(
        ['sim-cli', 'tap', str(x), str(y), '--json'],
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

def get_element_at(x, y):
    result = subprocess.run(
        ['sim-cli', 'inspect-point', str(x), str(y), '--json'],
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

# Use in test
element = get_element_at(150, 300)
if element['type'] == 'button':
    tap(150, 300)
```

### GitHub Actions Workflow
```yaml
name: iOS App Testing

on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install iOS Simulator CLI
        run: npm install -g ios-simulator-cli

      - name: Start Simulator
        run: sim-cli open --device "iPhone 15"

      - name: Install App
        run: sim-cli install ./build/MyApp.app

      - name: Run UI Tests
        run: |
          sim-cli launch com.example.myapp
          sim-cli screenshot before.png
          sim-cli tap 100 200
          sim-cli type "Test Input"
          sim-cli screenshot after.png

      - name: Upload Screenshots
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: "*.png"
```

### AI Agent Integration

#### LangChain Tool Example
```python
from langchain.tools import Tool
from langchain.agents import AgentExecutor
import subprocess
import json

def simulator_command(cmd: str) -> dict:
    """Execute a simulator CLI command with machine-readable output."""
    result = subprocess.run(
        f"sim-cli {cmd} --machine-readable",
        shell=True,
        capture_output=True,
        text=True
    )

    if result.stdout:
        return json.loads(result.stdout)
    return {"success": False, "error": result.stderr}

# Define tools for LangChain
tools = [
    Tool(
        name="tap_screen",
        func=lambda coords: simulator_command(f"tap {coords}"),
        description="Tap at x,y coordinates. Input: 'x y' (e.g., '100 200')"
    ),
    Tool(
        name="type_text",
        func=lambda text: simulator_command(f'type "{text}"'),
        description="Type text into focused field"
    ),
    Tool(
        name="send_notification",
        func=lambda args: simulator_command(f'notify {args}'),
        description="Send push notification. Input: 'bundle-id --title \"text\" --body \"text\"'"
    ),
    Tool(
        name="take_screenshot",
        func=lambda path: simulator_command(f"screenshot {path}"),
        description="Take a screenshot and save to path"
    ),
    Tool(
        name="inspect_ui",
        func=lambda _: simulator_command("inspect"),
        description="Get full accessibility tree of current screen"
    )
]
```

#### OpenAI Function Calling Example
```javascript
const tools = [
  {
    type: "function",
    function: {
      name: "control_ios_simulator",
      description: "Control iOS simulator with various actions",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["tap", "type", "swipe", "screenshot", "notify", "inspect"],
            description: "The action to perform"
          },
          parameters: {
            type: "object",
            description: "Action-specific parameters"
          }
        },
        required: ["action", "parameters"]
      }
    }
  }
];

async function executeSimulatorAction(action, params) {
  const { exec } = require('child_process').promises;

  let command = `sim-cli ${action}`;

  switch(action) {
    case 'tap':
      command += ` ${params.x} ${params.y}`;
      break;
    case 'type':
      command += ` "${params.text}"`;
      break;
    case 'notify':
      command += ` ${params.bundleId} --title "${params.title}"`;
      if (params.body) command += ` --body "${params.body}"`;
      break;
    // ... other actions
  }

  command += ' --machine-readable';

  try {
    const { stdout } = await exec(command);
    return JSON.parse(stdout);
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

#### Autonomous Agent Example
```python
class IOSSimulatorAgent:
    """Autonomous agent for iOS app testing."""

    def __init__(self):
        self.command_history = []

    def execute(self, command: str) -> dict:
        """Execute command with full telemetry."""
        import subprocess
        import json
        from datetime import datetime

        start_time = datetime.now()
        result = subprocess.run(
            f"sim-cli {command} --machine-readable",
            shell=True,
            capture_output=True,
            text=True
        )

        response = json.loads(result.stdout) if result.stdout else {}
        response['execution_time'] = (datetime.now() - start_time).total_seconds()

        self.command_history.append({
            'command': command,
            'response': response,
            'timestamp': start_time.isoformat()
        })

        return response

    def test_notification_flow(self, bundle_id: str):
        """Test complete notification flow."""
        # Send notification
        notif = self.execute(f'notify {bundle_id} --title "Test" --body "Automated test"')

        if notif['success']:
            # Take screenshot to verify
            screenshot = self.execute('screenshot notification-test.png')

            # Clear badge after test
            self.execute(f'clear-badge {bundle_id}')

            return {
                'test': 'notification_flow',
                'success': True,
                'steps': len(self.command_history),
                'evidence': 'notification-test.png'
            }

        return {'test': 'notification_flow', 'success': False, 'error': notif.get('error')}
```

## Error Handling

The CLI provides clear error messages with actionable suggestions:

```bash
$ sim-cli tap 100 200
Error: No simulator is currently booted.

Try one of the following:
  • Open Simulator.app
  • Run: sim-cli open
  • Specify a device: --device <udid>

For more help, run: sim-cli tap --help
```

Exit codes:
- `0` - Success
- `1` - General error
- `2` - Invalid arguments
- `3` - Simulator not found
- `4` - Command timeout
- `5` - Permission denied

## Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testPathPattern=commands/tap

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Troubleshooting

### Simulator not found
```bash
# Check available simulators
sim-cli list

# Open default simulator
sim-cli open

# Specify exact device
sim-cli tap 100 200 --device "37A360EC-75F9-4AEC-8EFA-10F4A58D8CCA"
```

### IDB not working
```bash
# Check IDB installation
idb --version

# Reinstall IDB
brew reinstall facebook/fb/idb-companion
pip3 install --upgrade fb-idb
```

### Permission errors
```bash
# Ensure Xcode command line tools are installed
xcode-select --install

# Reset Xcode path
sudo xcode-select --reset
```

## Comparison with MCP Server

| Feature | iOS Simulator CLI | MCP Server |
|---------|------------------|------------|
| **Setup** | Zero config | Server configuration required |
| **Integration** | Any language/tool | MCP client required |
| **State** | Stateless | Stateful connections |
| **Testing** | Easy to mock | Complex protocol mocking |
| **CI/CD** | Native support | Additional setup needed |
| **Debugging** | Standard CLI debugging | Protocol-specific tools |
| **Performance** | Direct execution | Protocol overhead |
| **Scripting** | Bash/Python/etc. | MCP client libraries |

## Roadmap

- [ ] Gesture recording and replay
- [ ] Visual regression testing
- [ ] Parallel simulator control
- [ ] Web dashboard for remote control
- [ ] Appium integration
- [ ] Cross-platform support (Android)

## License

MIT License - see [LICENSE](LICENSE) file for details.
