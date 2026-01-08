# Smart Agent - Android Automation

Professional framework for Android automation using Vision + Accessibility + LLM reasoning.

## Project Structure

```
agents/
├── __init__.py              # Main package exports
├── core/                    # Core agent logic
│   ├── agent.py            # SmartAgent, Agent, run()
│   ├── executor.py         # Action executor
│   └── types.py            # AgentAction, StepResult, ExecutionResult
├── tools/                   # Device interaction
│   ├── device.py           # DeviceTools class
│   └── types.py            # UIElement, PhoneState, DeviceState
├── context/                 # Agent context
│   └── memory.py           # Memory management
├── prompts/                 # LLM prompts
│   └── system.py           # System & user prompts
├── utils/                   # Utilities
│   ├── llm.py              # LLM helpers
│   ├── logging.py          # Logging setup
│   └── async_utils.py      # Async utilities
└── common/                  # Shared constants
    └── constants.py        # Config, key codes, packages
```

## Quick Start

### Simple Usage

```python
import asyncio
from agents import Agent

async def main():
    agent = Agent()
    result = await agent.run("Open Facebook and watch videos")
    print(f"Success: {result.success}")

asyncio.run(main())
```

### One-liner

```python
from agents import run
result = await run("Open Settings and enable Wi-Fi")
```

### Advanced Usage

```python
from agents import SmartAgent

agent = SmartAgent(
    device_serial="emulator-5554",
    model="gpt-4o",
    debug=True
)

# Add memory
agent.remember("target_videos", 5)

# Run with goal
result = await agent.run(
    goal="Open TikTok and watch 5 videos",
    max_steps=25
)
```

### Direct Device Control

```python
from agents import DeviceTools

tools = DeviceTools(serial="emulator-5554")

# Get UI state
state = tools.get_state()
print(f"Current app: {state.phone_state.current_app}")

# Find elements
wifi = tools.find_elements_by_text("Wi-Fi")
if wifi:
    tools.tap_element(wifi[0].index)

# Screenshot
tools.save_screenshot("./screenshot.png")
```

## API Reference

### DeviceTools

```python
# State
state = tools.get_state()           # UIElements + PhoneState
app = tools.get_current_app()       # Current package

# Actions
tools.tap(x, y)                     # Tap coordinates
tools.tap_element(index)            # Tap by element index
tools.swipe(x1, y1, x2, y2)        # Swipe
tools.scroll_up() / scroll_down()   # Scroll
tools.input_text("text")            # Input text
tools.press_key("BACK")             # Press key (BACK, HOME, ENTER, DELETE)
tools.start_app("com.package")      # Start app

# Find elements
tools.find_elements_by_text("Search")
tools.find_elements_by_class("Button")
tools.find_clickable_elements()
```

### SmartAgent

```python
agent = SmartAgent(
    device_serial="emulator-5554",
    model="gpt-4o",
    debug=True
)

# Run
result = await agent.run(goal="...", max_steps=30)

# Memory
agent.remember("key", value)
value = agent.recall("key")
```

### Types

```python
from agents import (
    AgentAction,      # action_type, params, reasoning
    StepResult,       # step, action, success, message
    ExecutionResult,  # success, message, steps, total_steps, execution_time
    UIElement,        # index, text, class_name, bounds, center_x, center_y
    PhoneState,       # current_app, screen_width, screen_height
    DeviceState,      # elements, phone_state, raw_a11y_tree
)
```

## Architecture

```
┌─────────────────────────────────┐
│           SmartAgent            │
│   (Vision + A11y Reasoning)     │
├─────────────────────────────────┤
│         ActionExecutor          │
└─────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│          DeviceTools            │
│  tap, swipe, input, find, etc.  │
└─────────────────────────────────┘
              │
       ┌──────┴──────┐
       ▼             ▼
   TCP Mode     Content Provider
       │             │
       └──────┬──────┘
              ▼
┌─────────────────────────────────┐
│         Portal APK              │
│  Accessibility + HTTP Server    │
└─────────────────────────────────┘
              │
              ▼
        Android Device
```

## Installation

```bash
# Setup
cd droidrun-controller
source venv/bin/activate

# Environment
echo "OPENAI_API_KEY=your_key" > .env

# Run example
python examples/run_agent.py
```

## Features

- **Vision + Accessibility**: Combines screenshot analysis with accessibility tree
- **LLM Reasoning**: GPT-4o/Claude decides optimal actions
- **Element Detection**: Find elements by text, class, index
- **No Hardcode**: Agent adapts to any app automatically
- **Simple API**: Easy to use, powerful when needed
- **Modular Design**: Clean separation of concerns

---

**Version:** 2.0.0
