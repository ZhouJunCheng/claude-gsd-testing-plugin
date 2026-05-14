const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Install GSD 2.x testing setup skill to ~/.agents/skills/
 */
function installGsd2Skill() {
  const homedir = os.homedir();
  const skillSource = path.join(__dirname, 'gsd-testing-setup-skill');
  const skillDest = path.join(homedir, '.agents', 'skills', 'gsd-testing-setup');

  try {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(skillDest)) {
      fs.mkdirSync(skillDest, { recursive: true });
      console.log(`✓ Created skill directory: ${skillDest}`);
    }

    // Copy SKILL.md file
    const sourceFile = path.join(skillSource, 'SKILL.md');
    const destFile = path.join(skillDest, 'SKILL.md');

    if (!fs.existsSync(sourceFile)) {
      throw new Error(`Source skill file not found: ${sourceFile}`);
    }

    fs.copyFileSync(sourceFile, destFile);
    console.log(`✓ Installed GSD 2.x testing setup skill`);
    console.log(`  Location: ${destFile}`);

    return true;
  } catch (error) {
    console.error('✗ Failed to install GSD 2.x skill:', error.message);
    return false;
  }
}

/**
 * Uninstall GSD 2.x testing setup skill
 */
function uninstallGsd2Skill() {
  const homedir = os.homedir();
  const skillDest = path.join(homedir, '.agents', 'skills', 'gsd-testing-setup');

  try {
    if (fs.existsSync(skillDest)) {
      fs.rmSync(skillDest, { recursive: true, force: true });
      console.log(`✓ Removed GSD 2.x testing setup skill`);
      console.log(`  Location: ${skillDest}`);
    } else {
      console.log('ℹ GSD 2.x skill not found (already removed)');
    }

    return true;
  } catch (error) {
    console.error('✗ Failed to uninstall GSD 2.x skill:', error.message);
    return false;
  }
}

/**
 * Check if GSD 2.x skill is installed
 */
function isGsd2SkillInstalled() {
  const homedir = os.homedir();
  const skillPath = path.join(homedir, '.agents', 'skills', 'gsd-testing-setup', 'SKILL.md');
  return fs.existsSync(skillPath);
}

module.exports = {
  installGsd2Skill,
  uninstallGsd2Skill,
  isGsd2SkillInstalled
};

// Allow running as standalone script
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'install') {
    installGsd2Skill();
  } else if (command === 'uninstall') {
    uninstallGsd2Skill();
  } else if (command === 'check') {
    const installed = isGsd2SkillInstalled();
    console.log(`GSD 2.x skill installed: ${installed ? 'Yes' : 'No'}`);
  } else {
    console.log('Usage: node install-gsd2-skill.js [install|uninstall|check]');
    process.exit(1);
  }
}
