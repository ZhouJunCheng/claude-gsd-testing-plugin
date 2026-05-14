#!/usr/bin/env node

/**
 * Test script for GSD version detection and configuration
 */

const { detectGsdVersion, getVersionSummary, determineSupport } = require('./gsd-version-detector');
const { installGsd2Skill, isGsd2SkillInstalled } = require('./gsd2/install-gsd2-skill');

console.log('='.repeat(60));
console.log('GSD Version Detection Test');
console.log('='.repeat(60));
console.log('');

// Test 1: Version Detection
console.log('Test 1: Detecting GSD versions...');
console.log('');
const detection = detectGsdVersion();
console.log(JSON.stringify(detection, null, 2));
console.log('');

// Test 2: Version Summary
console.log('Test 2: Version summary...');
console.log('');
console.log(getVersionSummary());
console.log('');

// Test 3: Support Determination
console.log('Test 3: Determining support...');
console.log('');
const support = determineSupport();
console.log(`Support GSD 1.x: ${support.supportGsd1}`);
console.log(`Support GSD 2.x: ${support.supportGsd2}`);
console.log('');

// Test 4: GSD 2.x Skill Status
console.log('Test 4: GSD 2.x skill status...');
console.log('');
const skillInstalled = isGsd2SkillInstalled();
console.log(`GSD 2.x skill installed: ${skillInstalled ? 'Yes' : 'No'}`);
console.log('');

// Summary
console.log('='.repeat(60));
console.log('Summary');
console.log('='.repeat(60));
console.log('');

if (support.supportGsd1) {
  console.log('✓ GSD 1.x support available');
  console.log('  - SessionStart hook will inject testing config');
  console.log('  - PreToolUse hook will intercept gsd-new-project');
}

if (support.supportGsd2) {
  console.log('✓ GSD 2.x support available');
  if (skillInstalled) {
    console.log('  - Testing setup skill is installed');
  } else {
    console.log('  - Testing setup skill NOT installed (run install script)');
  }
}

if (!support.supportGsd1 && !support.supportGsd2) {
  console.log('⚠ No GSD installation detected');
  console.log('  Please install either:');
  console.log('  - GSD 1.x: npm install -g get-shit-done-cc');
  console.log('  - GSD 2.x: npm install -g gsd-pi');
}

console.log('');
