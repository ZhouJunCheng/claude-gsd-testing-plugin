// install-helper.js — called by install.bat to merge hook into settings.json
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(process.env.USERPROFILE, '.claude', 'settings.json');
const hookPath = path.join(process.env.USERPROFILE, '.claude', 'hooks', 'gsd-testing-config.js');

// Backup settings.json before modifying
if (fs.existsSync(settingsPath)) {
  const now = new Date();
  const stamp = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const backupPath = settingsPath + '.' + stamp + '.bak';
  fs.copyFileSync(settingsPath, backupPath);
  console.log('Backed up settings.json to ' + path.basename(backupPath));
}

let settings = {};
try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch {}

if (!settings.hooks) settings.hooks = {};
if (!settings.hooks.PreToolUse) settings.hooks.PreToolUse = [];

// Normalize path separators for Claude Code
const hookPathNorm = hookPath.replace(/\\/g, '/');
const entry = { matcher: 'Skill', hooks: [{ type: 'command', command: 'node ' + hookPathNorm }] };
const alreadyRegistered = settings.hooks.PreToolUse.some(
  h => h.hooks && h.hooks.some(hh => hh.command && hh.command.includes('gsd-testing-config'))
);

if (!alreadyRegistered) {
  settings.hooks.PreToolUse.push(entry);
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log('Registered gsd-testing-config.js as PreToolUse hook (matcher: Skill)');
} else {
  console.log('Hook already registered, skipping');
}
