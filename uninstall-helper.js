// uninstall-helper.js — called by uninstall.bat to remove hook from settings.json
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(process.env.USERPROFILE, '.claude', 'settings.json');

if (!fs.existsSync(settingsPath)) {
  console.log('settings.json not found, nothing to update');
  process.exit(0);
}

// Backup before modifying
const now = new Date();
const stamp = now.getFullYear().toString() +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0') + '-' +
  String(now.getHours()).padStart(2, '0') +
  String(now.getMinutes()).padStart(2, '0') +
  String(now.getSeconds()).padStart(2, '0');
const backupPath = settingsPath + '.' + stamp + '.bak';
fs.copyFileSync(settingsPath, backupPath);
console.log('Backed up settings.json to ' + path.basename(backupPath));

let settings = {};
try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch { process.exit(0); }

if (!settings.hooks || !settings.hooks.PreToolUse) {
  console.log('No PreToolUse hooks found, nothing to remove');
  process.exit(0);
}

const before = settings.hooks.PreToolUse.length;
settings.hooks.PreToolUse = settings.hooks.PreToolUse.filter(
  h => !(h.hooks && h.hooks.some(hh => hh.command && hh.command.includes('gsd-testing-config')))
);
const after = settings.hooks.PreToolUse.length;

if (before !== after) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log('Removed gsd-testing-config hook from settings.json');
} else {
  console.log('Hook entry not found in settings.json, nothing to remove');
}
