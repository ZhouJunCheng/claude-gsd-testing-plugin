const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

/**
 * Detects installed GSD versions and their configuration paths
 * @returns {Object} Detection results for GSD 1.x and 2.x
 */
function detectGsdVersion() {
  const homedir = os.homedir();

  // Detect GSD 1.x
  const gsd1SkillPath = path.join(homedir, '.claude', 'skills', 'gsd-new-project');
  const hasGsd1Skills = fs.existsSync(gsd1SkillPath);

  // Detect GSD 2.x
  const gsd2AgentsPath = path.join(homedir, '.agents', 'skills');
  const hasGsd2Skills = fs.existsSync(gsd2AgentsPath);

  // Check global npm installations
  const gsd1Installed = checkNpmPackage('get-shit-done-cc');
  const gsd2Installed = checkNpmPackage('gsd-pi');

  return {
    gsd1: {
      installed: gsd1Installed,
      hasSkills: hasGsd1Skills,
      skillPath: gsd1SkillPath,
      configDir: '.planning'
    },
    gsd2: {
      installed: gsd2Installed,
      hasSkills: hasGsd2Skills,
      skillPath: gsd2AgentsPath,
      configDir: '.gsd'
    }
  };
}

/**
 * Check if an npm package is installed globally
 * @param {string} packageName - The npm package name
 * @returns {boolean} True if package is installed
 */
function checkNpmPackage(packageName) {
  try {
    execSync(`npm list -g ${packageName}`, {
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get a human-readable summary of detected versions
 * @returns {string} Summary text
 */
function getVersionSummary() {
  const detection = detectGsdVersion();
  const lines = [];

  lines.push('GSD Version Detection Results:');
  lines.push('');

  // GSD 1.x
  lines.push('GSD 1.x (get-shit-done-cc):');
  lines.push(`  - Globally installed: ${detection.gsd1.installed ? 'Yes' : 'No'}`);
  lines.push(`  - Skills directory exists: ${detection.gsd1.hasSkills ? 'Yes' : 'No'}`);
  lines.push(`  - Skill path: ${detection.gsd1.skillPath}`);
  lines.push(`  - Config directory: ${detection.gsd1.configDir}`);
  lines.push('');

  // GSD 2.x
  lines.push('GSD 2.x (gsd-pi):');
  lines.push(`  - Globally installed: ${detection.gsd2.installed ? 'Yes' : 'No'}`);
  lines.push(`  - Skills directory exists: ${detection.gsd2.hasSkills ? 'Yes' : 'No'}`);
  lines.push(`  - Skill path: ${detection.gsd2.skillPath}`);
  lines.push(`  - Config directory: ${detection.gsd2.configDir}`);

  return lines.join('\n');
}

/**
 * Determine which GSD version(s) should be supported
 * @returns {Object} Support flags for each version
 */
function determineSupport() {
  const detection = detectGsdVersion();

  return {
    supportGsd1: detection.gsd1.installed || detection.gsd1.hasSkills,
    supportGsd2: detection.gsd2.installed || detection.gsd2.hasSkills,
    detection: detection
  };
}

module.exports = {
  detectGsdVersion,
  checkNpmPackage,
  getVersionSummary,
  determineSupport
};
