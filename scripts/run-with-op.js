#!/usr/bin/env node

/**
 * Cross-platform helper to run commands with 1Password CLI if available
 * Usage: node run-with-op.js <command> [args...]
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');

// Check if op CLI is available
function isOpAvailable() {
  try {
    execSync('op --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Get the command from arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node run-with-op.js <command> [args...]');
  process.exit(1);
}

const command = args.join(' ');

// Look for .env.local in current directory first, then parent
const fs = require('fs');
let envFile = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envFile)) {
  envFile = path.join(process.cwd(), '..', '.env.local');
}

let finalCommand;
if (isOpAvailable()) {
  console.log('🔐 1Password CLI detected. Secrets will be injected from vault.');
  finalCommand = `op run --env-file="${envFile}" -- ${command}`;
} else {
  console.log('⚠️  1Password CLI not found. Using local environment only.');
  finalCommand = command;
}

// Execute the command
const result = spawnSync(finalCommand, {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

process.exit(result.status || 0);
