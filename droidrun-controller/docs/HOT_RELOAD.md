# Development Mode - Hot Reload

Droidrun Controller hỗ trợ **hot reload** để tự động reload app khi có thay đổi code, giúp development nhanh hơn.

## 🚀 Cách sử dụng

### Method 1: Flet CLI (Recommended)

Sử dụng built-in hot reload của Flet CLI:

```bash
# Activate virtual environment
source .venv/bin/activate

# Run with hot reload
python dev.py
```

**Features:**
- ✅ Fast reload using Flet's built-in mechanism
- ✅ Watches all `.py` files in the project
- ✅ Automatic recursive directory watching
- ✅ Minimal overhead

### Method 2: Watchdog (Advanced)

Sử dụng watchdog cho control tốt hơn:

```bash
# Activate virtual environment
source .venv/bin/activate

# Run with custom watchdog
python dev_watchdog.py
```

**Features:**
- ✅ Custom reload logic
- ✅ Auto-restart on crash
- ✅ Debounced reloads (avoid multiple reloads)
- ✅ Filtered file watching (only `.py` files in `app/`)
- ✅ Detailed logging

### Method 3: Manual

Chạy thủ công như bình thường:

```bash
source .venv/bin/activate
python run_app.py
```

## 📝 So sánh

| Feature | Flet CLI | Watchdog | Manual |
|---------|----------|----------|--------|
| Hot Reload | ✅ | ✅ | ❌ |
| Auto-restart on crash | ❌ | ✅ | ❌ |
| Speed | ⚡⚡⚡ | ⚡⚡ | ⚡ |
| Custom logic | ❌ | ✅ | N/A |
| Dependencies | Flet only | watchdog | None |

## 🎯 Recommendations

### For Development:
```bash
python dev.py
```
Fast, simple, works great for most cases.

### For Debugging Crashes:
```bash
python dev_watchdog.py
```
Auto-restarts and shows error output when app crashes.

### For Production:
```bash
python run_app.py
```
No hot reload, stable.

## 🔧 Configuration

### Flet CLI Options

Edit `dev.py` to customize:

```python
cmd = [
    "flet", "run",
    "-d",  # Watch directory
    "-r",  # Recursive
    "-v",  # Verbose (optional)
    "--ignore-dirs", ".venv,venv,__pycache__",  # Ignore patterns
    "run_app.py"
]
```

### Watchdog Options

Edit `dev_watchdog.py` to customize:

```python
class AppReloadHandler(FileSystemEventHandler):
    def __init__(self, restart_callback):
        self.reload_delay = 1.0  # Change debounce delay
        # ...
```

## 📚 Tips

1. **Faster Reloads**: Exclude unnecessary directories in ignore patterns
2. **Multiple Changes**: Save multiple files, reload happens once (debounced)
3. **Crash Recovery**: Use watchdog method if app crashes frequently during development
4. **Clean Restart**: Press Ctrl+C and restart if hot reload misbehaves

## 🐛 Troubleshooting

### Hot reload not working?

1. Make sure you're editing files in `app/` directory
2. Check file is not in ignore list
3. Try restart the dev server

### App crashes on reload?

1. Check syntax errors in your code
2. Use `dev_watchdog.py` to see error output
3. Check database connections are properly closed

### Too many reloads?

1. Increase `reload_delay` in watchdog
2. Add more patterns to `--ignore-dirs`
3. Use Flet CLI instead (better filtering)

## 🎨 Workflow Example

```bash
# Terminal 1: Start hot reload server
source .venv/bin/activate
python dev.py

# Terminal 2: Edit files
code app/views/devices.py

# Save file → App auto-reloads!
```

## ⚙️ Advanced: VS Code Integration

Add to `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Flet Dev (Hot Reload)",
            "type": "python",
            "request": "launch",
            "program": "${workspaceFolder}/dev.py",
            "console": "integratedTerminal",
            "env": {
                "PYTHONUNBUFFERED": "1"
            }
        }
    ]
}
```

Now you can press F5 to start with hot reload!
