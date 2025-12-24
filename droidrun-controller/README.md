# Droidrun Controller

Android phone automation with workflow management using [droidrun](https://github.com/droidrun/droidrun).

## Features

- **Desktop Application** - Modern Electron UI with Python backend
- **Control Android devices** with natural language commands via OpenAI GPT
- **Record workflows** - Capture actions during execution for reuse
- **Save to SQLite** - Persist workflows with full action history
- **Edit workflows** - Modify saved workflows via Desktop app or CLI
- **Schedule executions** - Run workflows automatically (cron, interval)
- **Parallel execution** - Run on multiple devices simultaneously

## Installation

### Python Backend

```bash
cd droidrun-controller
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -e .
```

### Desktop App (Electron)

```bash
cd desktop
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env

# Edit .env with your settings
OPENAI_API_KEY=your_openai_api_key_here
```

## Quick Start

### Run Desktop App

```bash
# Development mode
cd desktop
npm run dev

# Or start directly
npm start
```

### Initialize Database (CLI)

```bash
python main.py --init
```

## CLI Usage

### Discover Devices

```bash
droidrun-ctl devices refresh
droidrun-ctl devices list
```

### Create Workflow

```bash
# Create a new workflow
droidrun-ctl workflow create --name "Open Settings" --app "com.android.settings"

# Show workflow details
droidrun-ctl workflow show 1
```

### Run Workflow

```bash
# Run on specific device
droidrun-ctl workflow run 1 --device <device_serial>

# Run on all devices in parallel
droidrun-ctl workflow run 1 --parallel
```

### Schedule Workflow

```bash
# Create cron schedule (every day at 9 AM)
droidrun-ctl schedule create --workflow 1 --cron "0 9 * * *"

# Create interval schedule (every 30 minutes)
droidrun-ctl schedule create --workflow 1 --interval 1800
```

### Export/Import Workflows

```bash
# Export workflow to JSON
droidrun-ctl workflow export 1 --output my_workflow.json

# Import workflow from JSON
droidrun-ctl workflow import my_workflow.json
```

## Build Desktop App

```bash
cd desktop

# Build for current platform
npm run build

# Build for specific platform
npm run build:mac
npm run build:win
npm run build:linux
```

## Project Structure

```
droidrun-controller/
├── desktop/              # Electron Desktop App
│   ├── main.js           # Electron main process
│   ├── preload.js        # IPC bridge
│   └── src/              # Frontend (HTML/CSS/JS)
├── droidrun_controller/  # Python Backend
│   ├── config/           # Configuration settings
│   ├── core/             # Core components
│   │   ├── agent.py      # Droidrun agent wrapper
│   │   ├── device_manager.py  # ADB device management
│   │   ├── action_recorder.py # Action recording
│   │   └── action_executor.py # Action execution
│   ├── models/           # SQLAlchemy models
│   ├── services/         # Business logic services
│   ├── workers/          # Parallel execution workers
│   ├── ipc/              # IPC handlers for Electron
│   └── cli/              # Typer CLI application
└── main.py               # Python entry point
```

## Requirements

- Python 3.10+
- Node.js 18+ (for Electron)
- ADB (Android Debug Bridge)
- OpenAI API key
- Connected Android device(s) with USB debugging enabled

## License

MIT
