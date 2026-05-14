// install-helper.js — called by install.bat to register hooks and apply SKILL.md patch
const fs = require('fs');
const path = require('path');

// Import version detector
const { detectGsdVersion, getVersionSummary } = require('./gsd-version-detector.js');

const claudeDir = path.join(process.env.USERPROFILE, '.claude');
const configHook = path.join(claudeDir, 'hooks', 'gsd-testing-config.js').replace(/\\/g, '/');
const patchHook  = path.join(claudeDir, 'hooks', 'gsd-testing-patch.js').replace(/\\/g, '/');

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

// Install GSD 1.x support (hooks)
if (versionInfo.gsd1.hasSkills) {
  console.log('=== Installing GSD 1.x Support ===');

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
    hooks: [{ type: 'command', command: 'node "' + configHook + '"', timeout: 10 }]
  };
  const sessionEntry = {
    hooks: [{ type: 'command', command: 'node "' + patchHook + '"' }]
  };

  for (const sp of settingsFiles) {
    if (!fs.existsSync(sp)) fs.writeFileSync(sp, '{}');
    const bak = sp + '.' + stamp + '.bak';
    fs.copyFileSync(sp, bak);
    console.log('Backed up ' + path.basename(sp) + ' to ' + path.basename(bak));

    let s = {};
    try { s = JSON.parse(fs.readFileSync(sp, 'utf8')); } catch {}
    if (!s.hooks) s.hooks = {};

    // PreToolUse hook
    if (!s.hooks.PreToolUse) s.hooks.PreToolUse = [];
    const hasPre = s.hooks.PreToolUse.some(
      h => h.hooks && h.hooks.some(hh => hh.command && hh.command.includes('gsd-testing-config'))
    );
    if (!hasPre) { s.hooks.PreToolUse.push(preToolEntry); console.log('Registered PreToolUse hook in ' + path.basename(sp)); }
    else { console.log('PreToolUse hook already in ' + path.basename(sp)); }

    // SessionStart hook
    if (!s.hooks.SessionStart) s.hooks.SessionStart = [];
    const hasSess = s.hooks.SessionStart.some(
      h => h.hooks && h.hooks.some(hh => hh.command && hh.command.includes('gsd-testing-patch'))
    );
    if (!hasSess) { s.hooks.SessionStart.push(sessionEntry); console.log('Registered SessionStart hook in ' + path.basename(sp)); }
    else { console.log('SessionStart hook already in ' + path.basename(sp)); }

    fs.writeFileSync(sp, JSON.stringify(s, null, 2) + '\n');
  }

  // Apply SKILL.md patch immediately
  const skillPath = path.join(process.env.USERPROFILE, '.claude', 'skills', 'gsd-new-project', 'SKILL.md');
  if (fs.existsSync(skillPath)) {
    const content = fs.readFileSync(skillPath, 'utf8');
    if (!content.includes('gsd-testing-plugin')) {
      try {
        const { execSync } = require('child_process');
        execSync('node "' + patchHook + '"', { stdio: 'inherit' });
        console.log('Applied SKILL.md patch');
      } catch (e) { console.log('Note: SKILL.md patch will apply on next session start'); }
    } else {
      console.log('SKILL.md already patched');
    }
  } else {
    console.log('Note: gsd-new-project skill not found - patch will apply on next session start');
  }
  console.log('');
} else {
  console.log('=== Skipping GSD 1.x Support ===');
  console.log('GSD 1.x skills directory not found');
  console.log('');
}

// Install GSD 2.x support (skill)
if (versionInfo.gsd2.hasSkills) {
  console.log('=== Installing GSD 2.x Support ===');
  try {
    const { installSkill } = require('./gsd2/install-gsd2-skill.js');
    const result = installSkill();
    console.log(result.message);
    console.log('');
  } catch (e) {
    console.log('Error installing GSD 2.x skill: ' + e.message);
    console.log('');
  }
} else {
  console.log('=== Skipping GSD 2.x Support ===');
  console.log('GSD 2.x skills directory not found');
  console.log('');
}

// Summary
console.log('=== Installation Summary ===');
if (versionInfo.gsd1.hasSkills) {
  console.log('✓ GSD 1.x support installed (hooks)');
}
if (versionInfo.gsd2.hasSkills) {
  console.log('✓ GSD 2.x support installed (skill)');
}
if (!versionInfo.gsd1.hasSkills && !versionInfo.gsd2.hasSkills) {
  console.log('⚠ No GSD installation detected');
  console.log('  Install GSD 1.x: npm install -g get-shit-done-cc');
  console.log('  Install GSD 2.x: npm install -g gsd-pi');
}
