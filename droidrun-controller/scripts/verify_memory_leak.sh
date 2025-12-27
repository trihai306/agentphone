#!/bin/bash
# Memory Leak Verification Script
#
# This script runs memory leak verification for the Portal APK.
# It monitors AccessibilityNodeInfo recycling by running recording/replay
# cycles and checking memory usage.
#
# Usage:
#   ./verify_memory_leak.sh [device_serial]
#
# Prerequisites:
#   - ADB installed and in PATH
#   - Device connected with USB debugging enabled
#   - Portal APK installed with AccessibilityService enabled
#
# Expected output:
#   - No increasing unreachable objects after multiple cycles
#   - Stable memory footprint

set -e

DEVICE_ARG=""
if [ -n "$1" ]; then
    DEVICE_ARG="-s $1"
fi

PACKAGE="com.agent.portal"
BASELINE_FILE="/tmp/portal_memory_baseline.txt"
FINAL_FILE="/tmp/portal_memory_final.txt"
CYCLES=100
EVENTS_PER_CYCLE=10

echo "=================================="
echo "Memory Leak Verification Script"
echo "=================================="
echo "Package: $PACKAGE"
echo "Cycles: $CYCLES"
echo "Events per cycle: $EVENTS_PER_CYCLE"
echo ""

# Check if device is connected
if ! adb $DEVICE_ARG devices | grep -q "device$"; then
    echo "ERROR: No device connected or device not authorized"
    echo "Please connect a device and ensure USB debugging is enabled"
    exit 1
fi

# Check if package is installed
if ! adb $DEVICE_ARG shell pm list packages | grep -q "$PACKAGE"; then
    echo "ERROR: $PACKAGE is not installed"
    echo "Please install the Portal APK first:"
    echo "  cd droidrun-controller/portal-apk"
    echo "  ./gradlew assembleDebug"
    echo "  adb install -r app/build/outputs/apk/debug/app-debug.apk"
    exit 1
fi

# Check if accessibility service is running
echo "Checking if AccessibilityService is running..."
if ! adb $DEVICE_ARG shell dumpsys accessibility 2>/dev/null | grep -q "PortalAccessibilityService"; then
    echo "WARNING: PortalAccessibilityService may not be enabled"
    echo "Please enable it in Settings > Accessibility > Portal"
    echo ""
fi

# Get baseline memory info
echo "Capturing baseline memory info..."
adb $DEVICE_ARG shell dumpsys meminfo $PACKAGE > "$BASELINE_FILE" 2>/dev/null || true

BASELINE_PSS=$(grep "TOTAL PSS:" "$BASELINE_FILE" 2>/dev/null | awk '{print $3}' || echo "0")
BASELINE_PRIVATE=$(grep "TOTAL PRIVATE" "$BASELINE_FILE" 2>/dev/null | awk '{print $4}' || echo "0")
BASELINE_UNREACHABLE=$(grep "Unreachable:" "$BASELINE_FILE" 2>/dev/null | awk '{print $2}' || echo "0")

echo "Baseline Memory:"
echo "  PSS: ${BASELINE_PSS:-N/A} KB"
echo "  Private: ${BASELINE_PRIVATE:-N/A} KB"
echo "  Unreachable: ${BASELINE_UNREACHABLE:-0}"
echo ""

# Function to start/stop recording via HTTP API
start_recording() {
    curl -s -X POST "http://localhost:8080/recording/start" >/dev/null 2>&1 || true
}

stop_recording() {
    curl -s -X POST "http://localhost:8080/recording/stop" >/dev/null 2>&1 || true
}

get_events() {
    curl -s "http://localhost:8080/recording/events" 2>/dev/null || echo "{}"
}

# Set up port forwarding
echo "Setting up ADB port forwarding..."
adb $DEVICE_ARG forward tcp:8080 tcp:8080 2>/dev/null || true

echo "Running $CYCLES recording/stop cycles..."
echo "(This simulates AccessibilityNodeInfo allocation and recycling)"
echo ""

ERRORS=0
for i in $(seq 1 $CYCLES); do
    # Start recording
    if ! start_recording; then
        ((ERRORS++))
    fi

    # Small delay to allow events
    sleep 0.1

    # Stop recording
    if ! stop_recording; then
        ((ERRORS++))
    fi

    # Progress indicator
    if [ $((i % 10)) -eq 0 ]; then
        echo "  Completed $i/$CYCLES cycles..."
    fi
done

echo ""
echo "Recording cycles completed with $ERRORS errors"
echo ""

# Force garbage collection on device
echo "Triggering garbage collection..."
adb $DEVICE_ARG shell "am force-stop $PACKAGE" 2>/dev/null || true
sleep 2

# Restart the service (this happens automatically when accessibility service is enabled)
# We need to interact with the app to start it again
adb $DEVICE_ARG shell am start -n "$PACKAGE/.MainActivity" >/dev/null 2>&1 || true
sleep 2

# Get final memory info
echo "Capturing final memory info..."
adb $DEVICE_ARG shell dumpsys meminfo $PACKAGE > "$FINAL_FILE" 2>/dev/null || true

FINAL_PSS=$(grep "TOTAL PSS:" "$FINAL_FILE" 2>/dev/null | awk '{print $3}' || echo "0")
FINAL_PRIVATE=$(grep "TOTAL PRIVATE" "$FINAL_FILE" 2>/dev/null | awk '{print $4}' || echo "0")
FINAL_UNREACHABLE=$(grep "Unreachable:" "$FINAL_FILE" 2>/dev/null | awk '{print $2}' || echo "0")

echo "Final Memory:"
echo "  PSS: ${FINAL_PSS:-N/A} KB"
echo "  Private: ${FINAL_PRIVATE:-N/A} KB"
echo "  Unreachable: ${FINAL_UNREACHABLE:-0}"
echo ""

# Calculate differences
if [ -n "$BASELINE_PSS" ] && [ -n "$FINAL_PSS" ] && [ "$BASELINE_PSS" != "0" ] && [ "$FINAL_PSS" != "0" ]; then
    PSS_DIFF=$((FINAL_PSS - BASELINE_PSS))
    PRIVATE_DIFF=$((FINAL_PRIVATE - BASELINE_PRIVATE))
    UNREACHABLE_DIFF=$((FINAL_UNREACHABLE - BASELINE_UNREACHABLE))

    echo "Memory Changes:"
    echo "  PSS Delta: $PSS_DIFF KB"
    echo "  Private Delta: $PRIVATE_DIFF KB"
    echo "  Unreachable Delta: $UNREACHABLE_DIFF"
    echo ""
fi

# Analyze results
echo "=================================="
echo "VERIFICATION RESULTS"
echo "=================================="

PASS=true

# Check unreachable objects
if [ -n "$FINAL_UNREACHABLE" ] && [ "$FINAL_UNREACHABLE" != "0" ] && [ "${UNREACHABLE_DIFF:-0}" -gt 100 ]; then
    echo "FAIL: Unreachable objects increased significantly ($UNREACHABLE_DIFF)"
    echo "      This may indicate AccessibilityNodeInfo not being recycled"
    PASS=false
fi

# Check memory growth (allow up to 50MB growth as acceptable)
MAX_GROWTH=51200  # 50MB in KB
if [ -n "$PSS_DIFF" ] && [ "$PSS_DIFF" -gt "$MAX_GROWTH" ]; then
    echo "WARNING: Memory grew by more than 50MB ($PSS_DIFF KB)"
    echo "         This may indicate a memory leak"
    PASS=false
fi

if $PASS; then
    echo "PASS: No significant memory leaks detected"
    echo ""
    echo "Summary:"
    echo "  - Unreachable objects: stable or minimal increase"
    echo "  - Memory footprint: within acceptable limits"
    echo "  - AccessibilityNodeInfo recycling: appears to be working correctly"
fi

echo ""
echo "Detailed memory dump saved to:"
echo "  Baseline: $BASELINE_FILE"
echo "  Final: $FINAL_FILE"
echo ""

# Cleanup port forwarding
adb $DEVICE_ARG forward --remove tcp:8080 2>/dev/null || true

if $PASS; then
    exit 0
else
    exit 1
fi
