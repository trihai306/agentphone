#!/usr/bin/env python3
"""
Test Backend for Agent Portal Real-Time Upload
Receives events + screenshots from Android APK

Usage:
    python test_realtime_backend.py

The server will listen on http://0.0.0.0:5000
Configure APK to send to: http://<your_ip>:5000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Create directories for storing data
SCREENSHOT_DIR = "received_screenshots"
EVENTS_DIR = "received_events"

os.makedirs(SCREENSHOT_DIR, exist_ok=True)
os.makedirs(EVENTS_DIR, exist_ok=True)

# Counter for received events
event_counter = 0


@app.route('/api/events/realtime', methods=['POST'])
def receive_event():
    """
    Receive real-time event + screenshot from Android APK
    """
    global event_counter
    event_counter += 1

    try:
        data = request.json

        if not data:
            return jsonify({
                "status": "error",
                "error": "No JSON data received"
            }), 400

        # Extract event info
        event_type = data.get('eventType', 'unknown')
        timestamp = data.get('timestamp', 0)
        sequence = data.get('sequenceNumber', 0)
        package_name = data.get('packageName', '')
        app_name = data.get('appName', '')
        resource_id = data.get('resourceId', '')
        text = data.get('text', '')
        x = data.get('x')
        y = data.get('y')
        screenshot_b64 = data.get('screenshot')

        # Format timestamp
        dt = datetime.fromtimestamp(timestamp / 1000.0)
        time_str = dt.strftime('%H:%M:%S')

        # Print event info
        print(f"\n{'='*80}")
        print(f"✅ Event #{event_counter} (seq: {sequence}) - {event_type} at {time_str}")
        print(f"{'='*80}")
        print(f"  App: {app_name or package_name}")
        if resource_id:
            print(f"  Element: {resource_id}")
        if text:
            print(f"  Text: {text}")
        if x is not None and y is not None:
            print(f"  Position: ({x}, {y})")

        # Save event JSON
        event_filename = f"event_{sequence:04d}_{timestamp}.json"
        event_path = os.path.join(EVENTS_DIR, event_filename)

        # Remove screenshot from saved JSON (too large)
        event_data = data.copy()
        if 'screenshot' in event_data:
            event_data['screenshot'] = f"<base64 data - {len(screenshot_b64)} chars>"

        with open(event_path, 'w', encoding='utf-8') as f:
            json.dump(event_data, f, indent=2, ensure_ascii=False)

        print(f"  Event saved: {event_filename}")

        # Decode and save screenshot if present
        if screenshot_b64:
            try:
                screenshot_bytes = base64.b64decode(screenshot_b64)
                screenshot_filename = f"screenshot_{sequence:04d}_{timestamp}.jpg"
                screenshot_path = os.path.join(SCREENSHOT_DIR, screenshot_filename)

                with open(screenshot_path, 'wb') as f:
                    f.write(screenshot_bytes)

                size_kb = len(screenshot_bytes) / 1024
                print(f"  Screenshot saved: {screenshot_filename} ({size_kb:.1f} KB)")
            except Exception as e:
                print(f"  ⚠️ Screenshot decode error: {e}")
        else:
            print(f"  No screenshot attached")

        # Print action data if present
        action_data = data.get('actionData')
        if action_data:
            print(f"  Action Data:")
            for key, value in action_data.items():
                print(f"    {key}: {value}")

        print(f"{'='*80}\n")

        # Return success response
        return jsonify({
            "status": "success",
            "message": f"Event #{sequence} received successfully",
            "event_counter": event_counter
        }), 200

    except Exception as e:
        print(f"\n❌ Error processing event: {e}")
        import traceback
        traceback.print_exc()

        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "events_received": event_counter,
        "timestamp": datetime.now().isoformat()
    })


@app.route('/stats', methods=['GET'])
def stats():
    """Get statistics"""
    num_events = len([f for f in os.listdir(EVENTS_DIR) if f.endswith('.json')])
    num_screenshots = len([f for f in os.listdir(SCREENSHOT_DIR) if f.endswith('.jpg')])

    return jsonify({
        "status": "ok",
        "stats": {
            "events_received_session": event_counter,
            "events_saved": num_events,
            "screenshots_saved": num_screenshots
        }
    })


@app.route('/', methods=['GET'])
def index():
    """Welcome page"""
    return f"""
    <h1>Agent Portal Real-Time Upload Backend</h1>
    <p>Server is running!</p>
    <ul>
        <li>Events received this session: {event_counter}</li>
        <li>Events saved: {len([f for f in os.listdir(EVENTS_DIR) if f.endswith('.json')])}</li>
        <li>Screenshots saved: {len([f for f in os.listdir(SCREENSHOT_DIR) if f.endswith('.jpg')])}</li>
    </ul>
    <h2>Endpoints:</h2>
    <ul>
        <li>POST /api/events/realtime - Receive events</li>
        <li>GET /health - Health check</li>
        <li>GET /stats - Statistics</li>
    </ul>
    <p>Data saved to:
        <ul>
            <li>Events: {os.path.abspath(EVENTS_DIR)}</li>
            <li>Screenshots: {os.path.abspath(SCREENSHOT_DIR)}</li>
        </ul>
    </p>
    """


if __name__ == '__main__':
    import socket

    # Get local IP
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)

    print("\n" + "="*80)
    print("🚀 Agent Portal Real-Time Upload Backend")
    print("="*80)
    print(f"\n📡 Server starting on:")
    print(f"   - Local:   http://127.0.0.1:5000")
    print(f"   - Network: http://{local_ip}:5000")
    print(f"\n📁 Data will be saved to:")
    print(f"   - Events:      {os.path.abspath(EVENTS_DIR)}/")
    print(f"   - Screenshots: {os.path.abspath(SCREENSHOT_DIR)}/")
    print(f"\n⚙️  Configure Android APK:")
    print(f"""
    curl -X POST http://<device_ip>:8080/recording/config/realtime \\
      -H "Content-Type: application/json" \\
      -d '{{
        "enabled": true,
        "backend_url": "http://{local_ip}:5000"
      }}'
    """)
    print("="*80 + "\n")

    # Run Flask server
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )
