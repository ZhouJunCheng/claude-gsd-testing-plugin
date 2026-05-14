#!/usr/bin/env node
// gsd-hook-version: 2.3.0
// GSD Testing Config Hook — PreToolUse hook (Compatibility Wrapper)
//
// This file is kept for backward compatibility with older installations.
// It redirects to the actual implementation in gsd1/gsd-testing-config.js

const path = require('path');
const { spawn } = require('child_process');

// Redirect to the actual implementation
const actualScript = path.join(__dirname, 'gsd1', 'gsd-testing-config.js');

const child = spawn(process.execPath, [actualScript], {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

child.on('error', (err) => {
  // Silent failure
  process.exit(0);
});
