#!/usr/bin/env bash
# install.sh — Install gsd-testing-plugin (SKILL.md patch + hooks)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 自动修复同目录所有 .sh 文件的 CRLF（Windows git clone 后行尾问题）
sed -i 's/\r//' "$SCRIPT_DIR"/*.sh 2>/dev/null || true

CONFIG_SRC="$SCRIPT_DIR/gsd-testing-config.js"
PATCH_SRC="$SCRIPT_DIR/gsd-testing-patch.js"
CONFIG_FILE="$HOME/.claude/hooks/gsd-testing-config.js"
PATCH_FILE="$HOME/.claude/hooks/gsd-testing-patch.js"

for f in "$CONFIG_SRC" "$PATCH_SRC"; do
  if [ ! -f "$f" ]; then
    echo "ERROR: $(basename $f) not found in $SCRIPT_DIR"
    exit 1
  fi
done

mkdir -p "$HOME/.claude/hooks"
cp "$CONFIG_SRC" "$CONFIG_FILE" && chmod +x "$CONFIG_FILE"
cp "$PATCH_SRC"  "$PATCH_FILE"  && chmod +x "$PATCH_FILE"
echo "✓ Copied hook files to $HOME/.claude/hooks/"

# Register hooks and apply SKILL.md patch via node
node - "$CONFIG_FILE" "$PATCH_FILE" <<'EOF'
const fs = require('fs');
const path = require('path');
const os = require('os');

const [,, configHook, patchHook] = process.argv;
const claudeDir = path.join(os.homedir(), '.claude');

const now = new Date();
const stamp = now.getFullYear().toString() +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0') + '-' +
  String(now.getHours()).padStart(2, '0') +
  String(now.getMinutes()).padStart(2, '0') +
  String(now.getSeconds()).padStart(2, '0');

// Scan all settings*.json (exclude backups)
let settingsFiles = [];
try {
  settingsFiles = fs.readdirSync(claudeDir)
    .filter(f => /^settings.*\.json$/.test(f) && !f.includes('.bak'))
    .map(f => path.join(claudeDir, f));
} catch (e) {}
if (settingsFiles.length === 0) settingsFiles = [path.join(claudeDir, 'settings.json')];

const preToolEntry = {
  matcher: 'Skill',
  hooks: [{ type: 'command', command: `node "${configHook}"`, timeout: 10 }]
};
const sessionEntry = {
  hooks: [{ type: 'command', command: `node "${patchHook}"` }]
};

for (const sp of settingsFiles) {
  if (!fs.existsSync(sp)) fs.writeFileSync(sp, '{}');
  const bak = sp + '.' + stamp + '.bak';
  fs.copyFileSync(sp, bak);
  console.log(`✓ Backed up ${path.basename(sp)} → ${path.basename(bak)}`);

  let s = {};
  try { s = JSON.parse(fs.readFileSync(sp, 'utf8')); } catch {}
  if (!s.hooks) s.hooks = {};

  // PreToolUse hook (gsd-testing-config.js)
  if (!s.hooks.PreToolUse) s.hooks.PreToolUse = [];
  const hasPre = s.hooks.PreToolUse.some(
    h => h.hooks && h.hooks.some(hh => hh.command && hh.command.includes('gsd-testing-config'))
  );
  if (!hasPre) { s.hooks.PreToolUse.push(preToolEntry); console.log(`✓ Registered PreToolUse hook in ${path.basename(sp)}`); }
  else { console.log(`✓ PreToolUse hook already in ${path.basename(sp)}`); }

  // SessionStart hook (gsd-testing-patch.js)
  if (!s.hooks.SessionStart) s.hooks.SessionStart = [];
  const hasSess = s.hooks.SessionStart.some(
    h => h.hooks && h.hooks.some(hh => hh.command && hh.command.includes('gsd-testing-patch'))
  );
  if (!hasSess) { s.hooks.SessionStart.push(sessionEntry); console.log(`✓ Registered SessionStart hook in ${path.basename(sp)}`); }
  else { console.log(`✓ SessionStart hook already in ${path.basename(sp)}`); }

  fs.writeFileSync(sp, JSON.stringify(s, null, 2) + '\n');
}

// Apply SKILL.md patch immediately
const skillPath = path.join(os.homedir(), '.claude', 'skills', 'gsd-new-project', 'SKILL.md');
if (fs.existsSync(skillPath)) {
  const content = fs.readFileSync(skillPath, 'utf8');
  if (!content.includes('gsd-testing-plugin')) {
    // Run the patch hook directly
    const { execSync } = require('child_process');
    try {
      execSync(`node "${patchHook}"`, { stdio: 'inherit' });
      console.log('✓ Applied SKILL.md patch');
    } catch (e) { console.log('Note: SKILL.md patch will be applied on next session start'); }
  } else {
    console.log('✓ SKILL.md already patched');
  }
} else {
  console.log('Note: gsd-new-project skill not found — patch will apply on next session start');
}
EOF

echo ""
echo "Installation complete. Restart Claude Code to activate."
