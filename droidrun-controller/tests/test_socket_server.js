#!/usr/bin/env node

/**
 * Socket.IO Server for Job Management
 *
 * This server sends jobs to Android devices via WebSocket
 */

const io = require('socket.io')(3000, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

console.log('\n========================================');
console.log('🚀 Socket Job Server');
console.log('========================================');
console.log('Server running on: ws://localhost:3000');
console.log('========================================\n');

// Connected devices
const devices = new Map();

io.on('connection', (socket) => {
  console.log(`✅ Device connected: ${socket.id}`);

  // Handle device info
  socket.on('device:info', (data) => {
    console.log('\n📱 Device Info Received:');
    console.log(JSON.stringify(data, null, 2));

    devices.set(socket.id, {
      ...data,
      socket_id: socket.id,
      connected_at: new Date()
    });

    // Send a test job after 2 seconds
    setTimeout(() => {
      sendTestJob(socket);
    }, 2000);
  });

  // Handle job status updates
  socket.on('job:status', (data) => {
    console.log(`\n📊 Job Status: ${data.job_id} -> ${data.status}`);
  });

  // Handle job results
  socket.on('job:result', (data) => {
    console.log('\n✅ Job Result Received:');
    console.log(JSON.stringify(data, null, 2));
  });

  // Handle job errors
  socket.on('job:error', (data) => {
    console.error('\n❌ Job Error:');
    console.error(JSON.stringify(data, null, 2));
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Device disconnected: ${socket.id}`);
    devices.delete(socket.id);
  });
});

/**
 * Send a test job to device
 */
function sendTestJob(socket) {
  const jobId = `job_${Date.now()}`;

  const job = {
    id: jobId,
    type: 'automation',
    priority: 'high',
    action_config_url: `http://192.168.1.100:5000/api/jobs/${jobId}/config`,
    params: {
      user_id: 'test_user_001',
      session_id: 'session_123'
    },
    timeout: 30000,
    retry: 2
  };

  console.log(`\n📤 Sending test job: ${jobId}`);
  console.log(JSON.stringify(job, null, 2));

  socket.emit('job:new', job);
}

/**
 * CLI Commands
 */
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '\nCommand> '
});

console.log('\nCommands:');
console.log('  devices     - List connected devices');
console.log('  send <id>   - Send job to device');
console.log('  cancel <id> - Cancel job');
console.log('  quit        - Exit server');
console.log('');

rl.prompt();

rl.on('line', (line) => {
  const [cmd, ...args] = line.trim().split(' ');

  switch (cmd) {
    case 'devices':
      console.log(`\nConnected devices: ${devices.size}`);
      devices.forEach((device, socketId) => {
        console.log(`  - ${socketId}: ${device.model} (${device.manufacturer})`);
      });
      break;

    case 'send':
      const socketId = args[0] || Array.from(devices.keys())[0];
      if (socketId && devices.has(socketId)) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          sendTestJob(socket);
          console.log(`✅ Job sent to ${socketId}`);
        }
      } else {
        console.log('❌ Device not found');
      }
      break;

    case 'cancel':
      const jobId = args[0];
      if (jobId) {
        io.emit('job:cancel', { job_id: jobId });
        console.log(`✅ Cancel command sent for ${jobId}`);
      } else {
        console.log('❌ Job ID required');
      }
      break;

    case 'quit':
    case 'exit':
      console.log('Shutting down...');
      process.exit(0);
      break;

    default:
      if (cmd) {
        console.log('Unknown command. Available: devices, send, cancel, quit');
      }
  }

  rl.prompt();
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});
