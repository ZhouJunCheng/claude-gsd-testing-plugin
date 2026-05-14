const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Write testing configuration for the appropriate GSD version
 * @param {string} version - '1.x' or '2.x'
 * @param {Object} config - Testing configuration object
 * @param {string} config.framework - Testing framework name
 * @param {string} config.runner_command - Command to run tests
 * @param {string} config.coverage_command - Command to generate coverage
 * @param {number} config.coverage_threshold - Coverage threshold percentage
 * @param {boolean} config.tdd_mode - Whether TDD mode is enabled
 */
function writeTestingConfig(version, config) {
  if (version === '1.x') {
    writeGsd1Config(config);
  } else if (version === '2.x') {
    writeGsd2Config(config);
  } else {
    throw new Error(`Unknown GSD version: ${version}`);
  }
}

/**
 * Write configuration for GSD 1.x using gsd-sdk CLI
 * @param {Object} config - Testing configuration
 */
function writeGsd1Config(config) {
  try {
    // Check if gsd-sdk is available
    execSync('gsd-sdk --version', { stdio: 'pipe' });

    // Write each configuration value using gsd-sdk
    execSync(`gsd-sdk query config-set testing.framework "${config.framework}"`, { stdio: 'pipe' });
    execSync(`gsd-sdk query config-set testing.runner_command "${config.runner_command}"`, { stdio: 'pipe' });
    execSync(`gsd-sdk query config-set testing.coverage_command "${config.coverage_command}"`, { stdio: 'pipe' });
    execSync(`gsd-sdk query config-set testing.coverage_threshold ${config.coverage_threshold}`, { stdio: 'pipe' });
    execSync(`gsd-sdk query config-set testing.tdd_mode ${config.tdd_mode}`, { stdio: 'pipe' });

    console.log('✓ GSD 1.x configuration written successfully');
  } catch (error) {
    console.error('✗ Failed to write GSD 1.x configuration:', error.message);
    throw error;
  }
}

/**
 * Write configuration for GSD 2.x to .gsd/testing-config.json
 * @param {Object} config - Testing configuration
 */
function writeGsd2Config(config) {
  try {
    const configDir = path.join(process.cwd(), '.gsd');
    const configPath = path.join(configDir, 'testing-config.json');

    // Create .gsd directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Write configuration file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    console.log('✓ GSD 2.x configuration written successfully');
    console.log(`  Location: ${configPath}`);
  } catch (error) {
    console.error('✗ Failed to write GSD 2.x configuration:', error.message);
    throw error;
  }
}

/**
 * Read testing configuration for the appropriate GSD version
 * @param {string} version - '1.x' or '2.x'
 * @returns {Object|null} Configuration object or null if not found
 */
function readTestingConfig(version) {
  if (version === '1.x') {
    return readGsd1Config();
  } else if (version === '2.x') {
    return readGsd2Config();
  } else {
    throw new Error(`Unknown GSD version: ${version}`);
  }
}

/**
 * Read configuration for GSD 1.x using gsd-sdk CLI
 * @returns {Object|null} Configuration object or null
 */
function readGsd1Config() {
  try {
    const framework = execSync('gsd-sdk query config-get testing.framework', {
      stdio: 'pipe',
      encoding: 'utf-8'
    }).trim();

    const runner_command = execSync('gsd-sdk query config-get testing.runner_command', {
      stdio: 'pipe',
      encoding: 'utf-8'
    }).trim();

    const coverage_command = execSync('gsd-sdk query config-get testing.coverage_command', {
      stdio: 'pipe',
      encoding: 'utf-8'
    }).trim();

    const coverage_threshold = parseInt(execSync('gsd-sdk query config-get testing.coverage_threshold', {
      stdio: 'pipe',
      encoding: 'utf-8'
    }).trim());

    const tdd_mode = execSync('gsd-sdk query config-get testing.tdd_mode', {
      stdio: 'pipe',
      encoding: 'utf-8'
    }).trim() === 'true';

    return {
      framework,
      runner_command,
      coverage_command,
      coverage_threshold,
      tdd_mode
    };
  } catch (error) {
    return null;
  }
}

/**
 * Read configuration for GSD 2.x from .gsd/testing-config.json
 * @returns {Object|null} Configuration object or null
 */
function readGsd2Config() {
  try {
    const configPath = path.join(process.cwd(), '.gsd', 'testing-config.json');

    if (!fs.existsSync(configPath)) {
      return null;
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

module.exports = {
  writeTestingConfig,
  readTestingConfig,
  writeGsd1Config,
  writeGsd2Config,
  readGsd1Config,
  readGsd2Config
};
