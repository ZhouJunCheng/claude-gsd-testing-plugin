#!/usr/bin/env bash
# install.sh — Register gsd-testing-config.js as a PreToolUse hook

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_SRC="$SCRIPT_DIR/gsd-testing-config.js"
HOOK_FILE="$HOME/.claude/hooks/gsd-testing-config.js"
SETTINGS_FILE="$HOME/.claude/settings.json"

if [ ! -f "$HOOK_SRC" ]; then
  echo "ERROR: gsd-testing-config.js not found in the same directory as install.sh"
  exit 1
fi

mkdir -p "$HOME/.claude/hooks"
cp "$HOOK_SRC" "$HOOK_FILE"
chmod +x "$HOOK_FILE"
echo "Copied gsd-testing-config.js to $HOOK_FILE"

# Ensure settings.json exists
if [ ! -f "$SETTINGS_FILE" ]; then
  echo '{}' > "$SETTINGS_FILE"
fi

# Use node to safely merge the hook into settings.json (with backup)
node - <<'EOF'
const fs = require('fs');
const path = require('path');
const settingsPath = process.env.HOME + '/.claude/settings.json';
const hookPath = process.env.HOME + '/.claude/hooks/gsd-testing-config.js';

// Backup settings.json before modifying
if (fs.existsSync(settingsPath)) {
  const now = new Date();
  const stamp = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const backupPath = settingsPath + '.' + stamp + '.bak';
  fs.copyFileSync(settingsPath, backupPath);
  console.log(`✓ Backed up settings.json → ${path.basename(backupPath)}`);
}

let settings = {};
try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch {}

if (!settings.hooks) settings.hooks = {};
if (!settings.hooks.PreToolUse) settings.hooks.PreToolUse = [];

const entry = { matcher: 'Skill', hooks: [{ type: 'command', command: `node ${hookPath}` }] };
const alreadyRegistered = settings.hooks.PreToolUse.some(
  h => h.hooks && h.hooks.some(hh => hh.command && hh.command.includes('gsd-testing-config'))
);

if (!alreadyRegistered) {
  settings.hooks.PreToolUse.push(entry);
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log('✓ Registered gsd-testing-config.js as PreToolUse hook (matcher: Skill)');
} else {
  console.log('✓ Hook already registered, skipping');
}
EOF

echo "Done. The testing config hook will trigger when /gsd-new-project is invoked."
