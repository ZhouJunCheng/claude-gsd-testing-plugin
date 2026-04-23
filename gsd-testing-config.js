#!/usr/bin/env node
// gsd-hook-version: 2.2.0
// GSD Testing Config Hook — PreToolUse hook
//
// Intercepts Skill(gsd-new-project) and BLOCKS execution until Claude has
// collected testing framework config. Uses decision:block so the skill
// cannot start until questions are answered. Does NOT modify GSD source code.

const fs = require('fs');
const path = require('path');
const os = require('os');

// All unit testing frameworks by language
const ALL_FRAMEWORKS = [
  // JavaScript / TypeScript
  { id: 'vitest',    label: 'Vitest (JS/TS)',    lang: 'js', desc: 'Vite-native unit testing, fast ESM support — preferred for Vite/React/Vue',   runner: 'npm test',        coverage: 'npm run test:coverage' },
  { id: 'jest',      label: 'Jest (JS/TS)',       lang: 'js', desc: 'Most mature JS/TS unit testing ecosystem, built-in mocking and snapshots',     runner: 'npm test',        coverage: 'npm test -- --coverage' },
  // Python
  { id: 'pytest',    label: 'pytest (Python)',    lang: 'py', desc: 'Python unit/integration testing — fixtures, parametrize, richest plugin ecosystem', runner: 'pytest',      coverage: 'pytest --cov=src --cov-report=term-missing' },
  { id: 'unittest',  label: 'unittest (Python)',  lang: 'py', desc: 'Python standard library — no install needed, basic unit testing',              runner: 'python -m unittest', coverage: 'coverage run -m unittest && coverage report' },
  // Go
  { id: 'go-test',   label: 'go test (Go)',       lang: 'go', desc: 'Go built-in unit testing — zero dependencies, fast, standard',                 runner: 'go test ./...',   coverage: 'go test -cover ./...' },
  { id: 'testify',   label: 'testify (Go)',        lang: 'go', desc: 'go test + testify assertions — most popular Go unit testing enhancement',      runner: 'go test ./...',   coverage: 'go test -cover ./...' },
  // Java / Kotlin
  { id: 'junit5',    label: 'JUnit 5 (Java)',     lang: 'java', desc: 'Java unit testing standard — works with Mockito for mocking',                runner: 'mvn test',        coverage: 'mvn test jacoco:report' },
  { id: 'kotest',    label: 'Kotest (Kotlin)',    lang: 'kotlin', desc: 'Kotlin-first unit testing framework — expressive DSL, coroutine support',  runner: './gradlew test',  coverage: './gradlew test jacocoTestReport' },
  // Rust
  { id: 'cargo-test', label: 'cargo test (Rust)', lang: 'rust', desc: 'Rust built-in unit testing — #[test] attribute, zero setup required',       runner: 'cargo test',      coverage: 'cargo tarpaulin --out Html' },
  // .NET
  { id: 'dotnet-test', label: 'xUnit (.NET)',     lang: 'dotnet', desc: 'xUnit unit testing for C#/F# — most popular .NET testing framework',       runner: 'dotnet test',     coverage: 'dotnet test --collect:"XPlat Code Coverage"' },
];

const DEBUG_LOG = '/tmp/gsd-testing-hook-debug.log';
function dbg(msg) {
  try { fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] ${msg}\n`); } catch(e) {}
}

let input = '';
const stdinTimeout = setTimeout(() => { dbg('TIMEOUT — no stdin data received'); process.exit(0); }, 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => (input += chunk));
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  dbg(`stdin received ${input.length} bytes`);
  try {
    const data = JSON.parse(input);
    dbg(`tool_name=${data.tool_name} skill=${data.tool_input?.skill} name=${data.tool_input?.name}`);

    if (data.tool_name !== 'Skill') { dbg('exit: not Skill tool'); process.exit(0); }

    const skillName = data.tool_input?.skill || data.tool_input?.name || data.tool_input?.skill_name || '';
    if (skillName !== 'gsd-new-project') process.exit(0);

    const cwd = data.cwd || process.cwd();

    // Check global skip / pre-configured
    const defaultsPath = path.join(os.homedir(), '.gsd', 'defaults.json');
    if (fs.existsSync(defaultsPath)) {
      try {
        const defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'));
        if (defaults.testing?.skip_prompt === true) process.exit(0);
        if (defaults.testing?.framework) process.exit(0);
      } catch (e) { /* ignore */ }
    }

    // Check if already configured in project
    const configPath = path.join(cwd, '.planning', 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.testing?.framework) process.exit(0);
        if (config.testing?.skip_prompt === true) process.exit(0);
      } catch (e) { /* ignore */ }
    }

    const recommended = detectRecommendedFramework(cwd);

    // Move recommended to front
    const ordered = [...ALL_FRAMEWORKS];
    if (recommended) {
      const idx = ordered.findIndex(f => f.id === recommended);
      if (idx > 0) ordered.unshift(ordered.splice(idx, 1)[0]);
    }

    const frameworkOptions = ordered
      .map(f => `      { label: "${f.label}${f.id === recommended ? ' ✓ Recommended' : ''}", description: "${f.desc}" }`)
      .join(',\n');

    const frameworkMap = ordered
      .map(f => `  ${f.label.padEnd(22)} → id=${f.id}, runner="${f.runner}", coverage="${f.coverage}"`)
      .join('\n');

    const output = {
      decision: 'block',
      reason:
`TESTING SETUP REQUIRED — collect testing config NOW before starting gsd-new-project.

Step 1: Call AskUserQuestion with exactly these three questions in a single call:

  Question 1 — header: "Unit Testing Framework"
    question: "Which unit testing framework will this project use?"
    multiSelect: false
    options:
${frameworkOptions}

  Question 2 — header: "Coverage Threshold"
    question: "Set minimum unit test coverage?"
    multiSelect: false
    options:
      { label: "80% (Recommended)", description: "Standard — balance quality and velocity" }
      { label: "90%", description: "High — critical paths well-tested" }
      { label: "100%", description: "Full coverage — every line must be tested" }

  Question 3 — header: "TDD Mode"
    question: "Enable Test-Driven Development (write tests first)?"
    multiSelect: false
    options:
      { label: "Yes (Recommended)", description: "Enforce RED-GREEN-REFACTOR — planners generate test-first plans" }
      { label: "No", description: "Write tests after implementation" }

Step 2: After collecting answers, run these bash commands to save config:

FRAMEWORK_MAP (look up id/runner/coverage by the label the user selected):
${frameworkMap}

COVERAGE_MAP:
  "80% (Recommended)" → 80
  "90%"               → 90
  "100%"              → 100

  gsd-sdk query config-set testing.framework "<id>"
  gsd-sdk query config-set testing.runner_command "<runner>"
  gsd-sdk query config-set testing.coverage_command "<coverage>"
  gsd-sdk query config-set testing.coverage_threshold <80|90|100>
  gsd-sdk query config-set workflow.tdd_mode <true|false>

Step 3: After saving config, invoke Skill(gsd-new-project) again to start the workflow.`,
    };

    process.stdout.write(JSON.stringify(output));
  } catch (e) {
    process.exit(0);
  }
});

function detectRecommendedFramework(cwd) {
  try {
    if (fs.readdirSync(cwd).some(f => f.endsWith('.csproj'))) return 'dotnet-test';
    if (fs.existsSync(path.join(cwd, 'Cargo.toml'))) return 'cargo-test';
    if (fs.existsSync(path.join(cwd, 'go.mod'))) return 'go-test';
    if (fs.existsSync(path.join(cwd, 'build.gradle')) ||
        fs.existsSync(path.join(cwd, 'build.gradle.kts'))) return 'kotest';
    if (fs.existsSync(path.join(cwd, 'pom.xml'))) return 'junit5';
    if (fs.existsSync(path.join(cwd, 'pyproject.toml')) ||
        fs.existsSync(path.join(cwd, 'requirements.txt')) ||
        fs.existsSync(path.join(cwd, 'setup.py'))) return 'pytest';

    const pkgPath = path.join(cwd, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.vitest || deps['@vitest/ui'] || deps.vite) return 'vitest';
      if (deps.jest || deps['@types/jest']) return 'jest';
      if (pkg.scripts?.test?.includes('vitest')) return 'vitest';
      if (pkg.scripts?.test?.includes('jest')) return 'jest';
      return 'jest';
    }
  } catch (e) { /* ignore */ }
  return null;
}
