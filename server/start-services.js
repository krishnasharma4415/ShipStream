const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting DeployFast Services...\n');

const services = [
  {
    name: 'Auth Service',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'auth-service'),
    color: '\x1b[36m'
  },
  {
    name: 'Upload Service', 
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'upload-service'),
    color: '\x1b[33m'
  },
  {
    name: 'Deploy Service',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'deploy-service'),
    color: '\x1b[32m'
  },
  {
    name: 'Request Handler',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'request-handler'),
    color: '\x1b[35m'
  }
];

const processes = [];

services.forEach(service => {
  console.log(`${service.color}Starting ${service.name}...\x1b[0m`);
  
  const proc = spawn(service.command, service.args, {
    cwd: service.cwd,
    stdio: 'pipe',
    shell: true
  });

  proc.stdout.on('data', (data) => {
    console.log(`${service.color}[${service.name}]\x1b[0m ${data.toString().trim()}`);
  });

  proc.stderr.on('data', (data) => {
    console.error(`${service.color}[${service.name} ERROR]\x1b[0m ${data.toString().trim()}`);
  });

  proc.on('close', (code) => {
    console.log(`${service.color}[${service.name}]\x1b[0m Process exited with code ${code}`);
  });

  processes.push(proc);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down services...');
  processes.forEach(proc => proc.kill());
  process.exit(0);
});