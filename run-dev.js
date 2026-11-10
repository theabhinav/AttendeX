import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('🚀 Starting AttendX Full-Stack Platform on localhost');
console.log('====================================================');

// Start Backend Server
const serverProcess = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true,
});

serverProcess.on('error', (err) => {
  console.error('[Backend Server Error]:', err);
});

// Start Frontend Client (Vite)
const clientProcess = spawn('npx', ['vite', '--host', 'localhost', '--port', '5173'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true,
});

clientProcess.on('error', (err) => {
  console.error('[Frontend Client Error]:', err);
});

const cleanup = () => {
  console.log('\nShutting down AttendX dev processes...');
  try {
    serverProcess.kill();
  } catch (e) {}
  try {
    clientProcess.kill();
  } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

