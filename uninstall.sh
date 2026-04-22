#!/usr/bin/env bash
# uninstall.sh — Remove gsd-testing-config.js hook (macOS/Linux/WSL)

set -e

HOOK_FILE="$HOME/.claude/hooks/gsd-testing-config.js"
SETTINGS_FILE="$HOME/.claude/settings.json"

# Remove hook file
if [ -f "$HOOK_FILE" ]; then
  rm "$HOOK_FILE"
  echo "✓ Removed $HOOK_FILE"
else
  echo "Hook file not found, skipping"
fi

# Ensure settings.json exists
if [ ! -f "$SETTINGS_FILE" ]; then
  echo "settings.json not found, nothing to update"
  exit 0
fi

# Use node to remove hook entry from settings.json (with backup)
node - <<'EOF'
const fs = require('fs');
const path = require('path');
const settingsPath = process.env.HOME + '/.claude/settings.json';

if (!fs.existsSync(settingsPath)) process.exit(0);

// Backup before modifying
const now = new Date();
const stamp = now.getFullYear().toString() +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0');
const backupPath = settingsPath + '.' + stamp + '.bak';
fs.copyFileSync(settingsPath, backupPath);
console.log(`✓ Backed up settings.json → ${path.basename(backupPath)}`);

let settings = {};
try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch { process.exit(0); }

if (!settings.hooks?.PreToolUse) {
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
  console.log('✓ Removed gsd-testing-config hook from settings.json');
} else {
  console.log('Hook entry not found in settings.json, nothing to remove');
}
EOF

echo "Done. Restart Claude Code for changes to take effect."
