#!/usr/bin/env bash
# uninstall.sh — Remove gsd-testing-plugin (dual version support)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 自动修复同目录所有 .sh 文件的 CRLF（Windows git clone 后行尾问题）
sed -i 's/\r//' "$SCRIPT_DIR"/*.sh 2>/dev/null || true

CONFIG_FILE="$HOME/.claude/hooks/gsd-testing-config.js"
PATCH_FILE="$HOME/.claude/hooks/gsd-testing-patch.js"

for f in "$CONFIG_FILE" "$PATCH_FILE"; do
  if [ -f "$f" ]; then
    rm "$f" && echo "✓ Removed $f"
  else
    echo "Not found, skipping: $f"
  fi
done

# Remove hooks from all settings*.json and strip SKILL.md patch
node - "$SCRIPT_DIR" <<'EOF'
const fs = require('fs');
const path = require('path');
const os = require('os');

const [,, scriptDir] = process.argv;
const claudeDir = path.join(os.homedir(), '.claude');

// Import version detector
const { detectGsdVersion, getVersionSummary } = require(path.join(scriptDir, 'gsd-version-detector.js'));

const now = new Date();
const stamp = now.getFullYear().toString() +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0') + '-' +
  String(now.getHours()).padStart(2, '0') +
  String(now.getMinutes()).padStart(2, '0') +
  String(now.getSeconds()).padStart(2, '0');

// Detect GSD versions
console.log('\n=== GSD Version Detection ===');
const versionInfo = detectGsdVersion();
const summary = getVersionSummary(versionInfo);
console.log(summary);
console.log('');

// Uninstall GSD 1.x support (hooks)
console.log('=== Uninstalling GSD 1.x Support ===');
let settingsFiles = [];
try {
  settingsFiles = fs.readdirSync(claudeDir)
    .filter(f => /^settings.*\.json$/.test(f) && !f.includes('.bak'))
    .map(f => path.join(claudeDir, f));
} catch (e) {}

let gsd1Removed = false;
for (const sp of settingsFiles) {
  if (!fs.existsSync(sp)) continue;
  let s = {};
  try { s = JSON.parse(fs.readFileSync(sp, 'utf8')); } catch { continue; }

  let changed = false;

  if (s.hooks && s.hooks.PreToolUse) {
    const before = s.hooks.PreToolUse.length;
    s.hooks.PreToolUse = s.hooks.PreToolUse.filter(
      h => !(h.hooks && h.hooks.some(hh => hh.command && hh.command.includes('gsd-testing-config')))
    );
    if (s.hooks.PreToolUse.length !== before) { changed = true; gsd1Removed = true; console.log(`✓ Removed PreToolUse hook from ${path.basename(sp)}`); }
  }

  if (s.hooks && s.hooks.SessionStart) {
    const before = s.hooks.SessionStart.length;
    s.hooks.SessionStart = s.hooks.SessionStart.filter(
      h => !(h.hooks && h.hooks.some(hh => hh.command && hh.command.includes('gsd-testing-patch')))
    );
    if (s.hooks.SessionStart.length !== before) { changed = true; gsd1Removed = true; console.log(`✓ Removed SessionStart hook from ${path.basename(sp)}`); }
  }

  if (changed) {
    const bak = sp + '.' + stamp + '.bak';
    fs.copyFileSync(sp, bak);
    fs.writeFileSync(sp, JSON.stringify(s, null, 2) + '\n');
  } else {
    console.log(`No plugin hooks in ${path.basename(sp)}, skipping`);
  }
}

// Remove SKILL.md patch
const skillPath = path.join(os.homedir(), '.claude', 'skills', 'gsd-new-project', 'SKILL.md');
if (fs.existsSync(skillPath)) {
  const content = fs.readFileSync(skillPath, 'utf8');
  if (content.includes('gsd-testing-plugin')) {
    const cleaned = content.replace(/<!-- gsd-testing-plugin.*?<\/pre_workflow_testing_setup>\n\n/s, '');
    fs.writeFileSync(skillPath, cleaned, 'utf8');
    console.log('✓ Removed SKILL.md patch');
    gsd1Removed = true;
  } else {
    console.log('SKILL.md patch not found, skipping');
  }
}

if (!gsd1Removed) {
  console.log('No GSD 1.x components found');
}
console.log('');

// Uninstall GSD 2.x support (skill)
console.log('=== Uninstalling GSD 2.x Support ===');
try {
  const { uninstallSkill } = require(path.join(scriptDir, 'gsd2', 'install-gsd2-skill.js'));
  const result = uninstallSkill();
  console.log(result.message);
} catch (e) {
  console.log('No GSD 2.x components found');
}
console.log('');

// Summary
console.log('=== Uninstallation Summary ===');
if (gsd1Removed) {
  console.log('✓ GSD 1.x support removed');
}
console.log('✓ Uninstallation complete');
EOF

echo ""
echo "Uninstall complete. Restart Claude Code to apply changes."
