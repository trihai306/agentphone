#!/usr/bin/env python3
"""
API Server for Job Action Configurations

This server provides action configurations for jobs
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

# Sample action configurations
ACTION_CONFIGS = {
    "login_flow": {
        "name": "Login Flow Automation",
        "description": "Automated login to app",
        "on_error": "stop",
        "timeout": 30000,
        "actions": [
            {
                "id": "action_1",
                "type": "start_app",
                "params": {
                    "package_name": "com.android.settings"
                },
                "wait_after": 2000
            },
            {
                "id": "action_2",
                "type": "tap",
                "params": {"x": 540, "y": 400},
                "wait_after": 500,
                "retry_on_fail": 1
            },
            {
                "id": "action_3",
                "type": "scroll",
                "params": {
                    "direction": "down",
                    "amount": 3
                },
                "wait_after": 500
            },
            {
                "id": "action_4",
                "type": "tap",
                "params": {"x": 540, "y": 800},
                "wait_after": 1000
            },
            {
                "id": "action_5",
                "type": "screenshot",
                "params": {
                    "save_path": "/screenshots/test.jpg"
                }
            },
            {
                "id": "action_6",
                "type": "press_key",
                "params": {"key_code": 4},
                "wait_after": 500
            }
        ]
    },
    "screenshot_flow": {
        "name": "Screenshot Test",
        "on_error": "continue",
        "actions": [
            {
                "id": "action_1",
                "type": "tap",
                "params": {"x": 540, "y": 1200},
                "wait_after": 1000
            },
            {
                "id": "action_2",
                "type": "screenshot",
                "params": {"save_path": "/screenshots/screen1.jpg"}
            },
            {
                "id": "action_3",
                "type": "swipe",
                "params": {
                    "start_x": 540,
                    "start_y": 1500,
                    "end_x": 540,
                    "end_y": 500,
                    "duration": 300
                },
                "wait_after": 500
            },
            {
                "id": "action_4",
                "type": "screenshot",
                "params": {"save_path": "/screenshots/screen2.jpg"}
            }
        ]
    }
}


@app.route('/api/jobs/<job_id>/config', methods=['GET'])
def get_job_config(job_id):
    """
    Get action configuration for a job

    Returns action sequence to execute
    """
    print(f"\n📥 Config request for job: {job_id}")

    # Generate config based on job_id or use default
    config = {
        "job_id": job_id,
        "name": f"Job {job_id} Automation",
        "description": "Automated test flow",
        "on_error": "stop",
        "timeout": 30000,
        "actions": [
            {
                "id": "action_1",
                "type": "start_app",
                "params": {
                    "package_name": "com.android.settings"
                },
                "wait_before": 0,
                "wait_after": 3000,
                "retry_on_fail": 0,
                "optional": False
            },
            {
                "id": "action_2",
                "type": "wait",
                "params": {
                    "duration": 1000
                },
                "wait_after": 0
            },
            {
                "id": "action_3",
                "type": "tap",
                "params": {
                    "x": 540,
                    "y": 400
                },
                "wait_after": 500,
                "retry_on_fail": 1
            },
            {
                "id": "action_4",
                "type": "scroll",
                "params": {
                    "direction": "down",
                    "amount": 2
                },
                "wait_after": 500
            },
            {
                "id": "action_5",
                "type": "tap",
                "params": {
                    "x": 540,
                    "y": 800
                },
                "wait_after": 1000
            },
            {
                "id": "action_6",
                "type": "screenshot",
                "params": {
                    "save_path": f"/screenshots/{job_id}_final.jpg"
                },
                "optional": True
            },
            {
                "id": "action_7",
                "type": "press_key",
                "params": {
                    "key_code": 4
                },
                "wait_after": 500
            }
        ],
        "metadata": {
            "created_at": int(time.time() * 1000),
            "version": "1.0"
        }
    }

    print(f"✅ Returning config with {len(config['actions'])} actions")
    return jsonify(config)


@app.route('/api/jobs/configs/<config_name>', methods=['GET'])
def get_named_config(config_name):
    """
    Get predefined config by name
    """
    config = ACTION_CONFIGS.get(config_name)

    if not config:
        return jsonify({
            "error": "Config not found",
            "available_configs": list(ACTION_CONFIGS.keys())
        }), 404

    return jsonify({
        **config,
        "job_id": f"{config_name}_{int(time.time())}"
    })


@app.route('/api/configs', methods=['GET'])
def list_configs():
    """List available configs"""
    return jsonify({
        "configs": list(ACTION_CONFIGS.keys())
    })


@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        "status": "ok",
        "timestamp": int(time.time() * 1000)
    })


@app.route('/', methods=['GET'])
def index():
    """Welcome page"""
    return f"""
    <h1>Job Action Config API</h1>
    <p>Server is running!</p>

    <h2>Endpoints:</h2>
    <ul>
        <li>GET /api/jobs/&lt;job_id&gt;/config - Get job configuration</li>
        <li>GET /api/jobs/configs/&lt;config_name&gt; - Get named config</li>
        <li>GET /api/configs - List available configs</li>
        <li>GET /health - Health check</li>
    </ul>

    <h2>Available Configs:</h2>
    <ul>
        {''.join(f'<li><a href="/api/jobs/configs/{name}">{name}</a></li>' for name in ACTION_CONFIGS.keys())}
    </ul>
    """


if __name__ == '__main__':
    import socket

    # Get local IP
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)

    print("\n" + "="*60)
    print("🚀 Job Action Config API Server")
    print("="*60)
    print(f"\n📡 Server URLs:")
    print(f"   - Local:   http://127.0.0.1:5000")
    print(f"   - Network: http://{local_ip}:5000")
    print(f"\n📚 Available configs:")
    for name in ACTION_CONFIGS.keys():
        print(f"   - {name}")
    print("\n" + "="*60 + "\n")

    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )
