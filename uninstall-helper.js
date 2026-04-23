// uninstall-helper.js — called by uninstall.bat to remove hooks and SKILL.md patch
const fs = require('fs');
const path = require('path');

const claudeDir = path.join(process.env.USERPROFILE, '.claude');

const now = new Date();
const stamp = now.getFullYear().toString() +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0') + '-' +
  String(now.getHours()).padStart(2, '0') +
  String(now.getMinutes()).padStart(2, '0') +
  String(now.getSeconds()).padStart(2, '0');

let settingsFiles = [];
try {
  settingsFiles = fs.readdirSync(claudeDir)
    .filter(f => /^settings.*\.json$/.test(f) && !f.includes('.bak'))
    .map(f => path.join(claudeDir, f));
} catch (e) {}

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
    if (s.hooks.PreToolUse.length !== before) { changed = true; console.log('Removed PreToolUse hook from ' + path.basename(sp)); }
  }

  if (s.hooks && s.hooks.SessionStart) {
    const before = s.hooks.SessionStart.length;
    s.hooks.SessionStart = s.hooks.SessionStart.filter(
      h => !(h.hooks && h.hooks.some(hh => hh.command && hh.command.includes('gsd-testing-patch')))
    );
    if (s.hooks.SessionStart.length !== before) { changed = true; console.log('Removed SessionStart hook from ' + path.basename(sp)); }
  }

  if (changed) {
    const bak = sp + '.' + stamp + '.bak';
    fs.copyFileSync(sp, bak);
    fs.writeFileSync(sp, JSON.stringify(s, null, 2) + '\n');
  } else {
    console.log('No plugin hooks in ' + path.basename(sp) + ', skipping');
  }
}

// Remove SKILL.md patch
const skillPath = path.join(process.env.USERPROFILE, '.claude', 'skills', 'gsd-new-project', 'SKILL.md');
if (fs.existsSync(skillPath)) {
  const content = fs.readFileSync(skillPath, 'utf8');
  if (content.includes('gsd-testing-plugin')) {
    const cleaned = content.replace(/<!-- gsd-testing-plugin.*?<\/pre_workflow_testing_setup>\n\n/s, '');
    fs.writeFileSync(skillPath, cleaned, 'utf8');
    console.log('Removed SKILL.md patch');
  } else {
    console.log('SKILL.md patch not found, skipping');
  }
}
