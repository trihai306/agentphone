#!/usr/bin/env node

/**
 * Antigravity Image Generator for OpenClaw
 * Uses the google-antigravity OAuth token to generate images via the Cloud Code sandbox API.
 * 
 * Usage:
 *   node generate-image.js --prompt "..." --output "..." [--aspect-ratio "16:9"]
 */

const fs = require('node:fs');
const https = require('node:https');
const { Buffer } = require('node:buffer');
const path = require('node:path');
const os = require('node:os');

// --- Config ---
const ENDPOINT = "https://daily-cloudcode-pa.sandbox.googleapis.com/v1internal:streamGenerateContent?alt=sse";

// OpenClaw auth profile paths (check multiple locations)
const AUTH_PATHS = [
    path.join(os.homedir(), '.openclaw/agents/clickai/agent/auth-profiles.json'),
    path.join(os.homedir(), '.openclaw/agents/main/agent/auth-profiles.json'),
    path.join(os.homedir(), '.openclaw/auth-profiles.json'),
];

// --- Args Parsing ---
const args = process.argv.slice(2);
let prompt = "";
let outputFile = "";
let aspectRatio = "1:1";

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prompt' && args[i+1]) {
        prompt = args[i+1];
        i++;
    } else if (args[i] === '--output' && args[i+1]) {
        outputFile = args[i+1];
        i++;
    } else if (args[i] === '--aspect-ratio' && args[i+1]) {
        aspectRatio = args[i+1];
        i++;
    }
}

if (!prompt) {
    console.error("Error: --prompt is required");
    process.exit(1);
}

if (!outputFile) {
    const dir = path.join(os.homedir(), 'duan/agent/generated-images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    outputFile = path.join(dir, `image_${Date.now()}.png`);
}

// Ensure output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// --- Auth Loading ---
console.log("🔐 Loading Antigravity credentials...");

let authPath = null;
for (const p of AUTH_PATHS) {
    if (fs.existsSync(p)) {
        authPath = p;
        break;
    }
}

if (!authPath) {
    console.error(`Error: Auth profile not found. Checked:\n${AUTH_PATHS.join('\n')}`);
    process.exit(1);
}

console.log(`   Found auth at: ${authPath}`);

let token = "";
let projectId = "";

try {
    const profiles = JSON.parse(fs.readFileSync(authPath, 'utf8'));
    // Look for google-antigravity profile
    const profileKey = Object.keys(profiles.profiles).find(k => k.startsWith("google-antigravity"));
    const auth = profiles.profiles[profileKey];

    if (!auth || !auth.access) {
        console.error("Error: No google-antigravity profile or access token found.");
        process.exit(1);
    }
    
    token = auth.access;
    projectId = auth.projectId || "junoai-465910";
    console.log(`   Project: ${projectId}`);
    
} catch (e) {
    console.error(`Error parsing auth profile: ${e.message}`);
    process.exit(1);
}

// --- Request ---
const payload = {
    project: projectId,
    model: "gemini-3-pro-image",
    request: {
        contents: [{
            role: "user",
            parts: [{ text: prompt }]
        }],
        systemInstruction: {
            parts: [{ text: "You are an AI image generator. Generate images based on user descriptions." }]
        },
        generationConfig: {
            imageConfig: { aspectRatio: aspectRatio },
            candidateCount: 1
        }
    },
    requestType: "agent",
    requestId: `agent-${Date.now()}`,
    userAgent: "antigravity"
};

console.log(`🎨 Generating image...`);
console.log(`   Prompt: "${prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt}"`);
console.log(`   Ratio:  ${aspectRatio}`);

const req = https.request(ENDPOINT, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'User-Agent': 'antigravity/2.0.0 darwin/arm64',
        'X-Goog-Api-Client': 'google-cloud-sdk vscode_cloudshelleditor/0.1',
        'Client-Metadata': JSON.stringify({
            ideType: "IDE_UNSPECIFIED",
            platform: "PLATFORM_UNSPECIFIED",
            pluginType: "GEMINI",
        })
    }
}, (res) => {
    if (res.statusCode !== 200) {
        console.error(`API Error: ${res.statusCode} ${res.statusMessage}`);
    }

    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk.toString();
    });

    res.on('end', () => {
        const lines = data.split('\n');
        for (const line of lines) {
            if (line.startsWith('data:')) {
                try {
                    const json = JSON.parse(line.substring(5));
                    
                    const parts = json.response?.candidates?.[0]?.content?.parts;
                    if (parts) {
                        for (const part of parts) {
                            if (part.inlineData && part.inlineData.data) {
                                // Success!
                                fs.writeFileSync(outputFile, Buffer.from(part.inlineData.data, 'base64'));
                                console.log(`✅ Image saved to: ${outputFile}`);
                                // OpenClaw MEDIA tag for auto-display
                                console.log(`MEDIA: ${outputFile}`);
                                process.exit(0);
                            } else if (part.text) {
                                console.log(`Model message: ${part.text}`);
                            }
                        }
                    }
                } catch (e) {
                    // Ignore parse errors for keep-alives
                }
            }
        }
        console.error("❌ No image data found in response.");
        console.error("Raw start:", data.substring(0, 500));
        process.exit(1);
    });
});

req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
    process.exit(1);
});

req.write(JSON.stringify(payload));
req.end();
