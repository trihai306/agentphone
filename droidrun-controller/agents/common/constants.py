"""
Common Constants - Shared constants across the agent package
"""

# Maximum number of recent conversation steps to include in LLM prompt
LLM_HISTORY_LIMIT = 20

# Default agent settings
DEFAULT_MAX_STEPS = 30
DEFAULT_MODEL = "gpt-4o"
DEFAULT_DEVICE = "emulator-5554"

# Key codes for hardware buttons
KEY_CODES = {
    "BACK": 4,
    "HOME": 3,
    "ENTER": 66,
    "DELETE": 67,
    "RECENT_APPS": 187,
    "POWER": 26,
    "VOLUME_UP": 24,
    "VOLUME_DOWN": 25,
}

# Common app packages
APP_PACKAGES = {
    "facebook": "com.facebook.katana",
    "tiktok": "com.zhiliaoapp.musically",
    "shopee": "com.shopee.vn",
    "instagram": "com.instagram.android",
    "youtube": "com.google.android.youtube",
    "settings": "com.android.settings",
    "chrome": "com.android.chrome",
    "messenger": "com.facebook.orca",
    "whatsapp": "com.whatsapp",
    "telegram": "org.telegram.messenger",
}

# Portal APK settings (DroidRun standard)
PORTAL_PACKAGE = "com.droidrun.portal"
DEFAULT_TCP_PORT = 8080

# Screenshot settings
SCREENSHOT_DIR = "./screenshots"
AGENT_SCREENSHOT_DIR = "./screenshots/agent"

# Timeouts (in seconds)
TCP_TIMEOUT = 10
STATE_TIMEOUT = 10
SCREENSHOT_TIMEOUT = 10
ACTION_DELAY = 0.3
STEP_DELAY = 0.5
APP_START_DELAY = 1.0

# LLM settings
LLM_MAX_TOKENS = 1000
LLM_TEMPERATURE = 0.2

# Element limits
MAX_ELEMENTS_FOR_LLM = 50
MAX_TEXT_LENGTH = 40
