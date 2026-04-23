#!/usr/bin/env node
// gsd-hook-version: 1.0.0
// GSD Testing Patch Hook — SessionStart hook
//
// Re-applies the testing setup patch to gsd-new-project/SKILL.md whenever
// GSD updates have reset it. Runs on every session start (lightweight file check).

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILL_PATH = path.join(os.homedir(), '.claude', 'skills', 'gsd-new-project', 'SKILL.md');
const MARKER = '<!-- gsd-testing-plugin v2.2.0 — auto-patched, do not remove this comment -->';

const PATCH = `${MARKER}
<pre_workflow_testing_setup>
MANDATORY STEP 0 — Run this BEFORE Step 1 of the workflow below:

Check if testing is already configured:
  bash: cat .planning/config.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('testing',{}).get('framework',''))" 2>/dev/null

If testing.framework is already set → skip this section entirely and jump to Step 1.

If NOT configured, call AskUserQuestion with exactly these 3 questions in a SINGLE call:

  {
    header: "Unit Testing Framework",
    question: "Which unit testing framework will this project use?",
    multiSelect: false,
    options: [
      { label: "JUnit 5 (Java)",     description: "Java unit testing standard — works with Mockito for mocking" },
      { label: "pytest (Python)",     description: "Python unit/integration testing — fixtures, richest plugin ecosystem" },
      { label: "Vitest (JS/TS)",      description: "Vite-native unit testing, fast ESM support" },
      { label: "Jest (JS/TS)",        description: "Most mature JS/TS unit testing ecosystem, built-in mocking" },
      { label: "go test (Go)",        description: "Go built-in unit testing — zero dependencies, fast, standard" },
      { label: "testify (Go)",        description: "go test + testify assertions — most popular Go enhancement" },
      { label: "Kotest (Kotlin)",     description: "Kotlin-first framework — expressive DSL, coroutine support" },
      { label: "cargo test (Rust)",   description: "Rust built-in unit testing — #[test] attribute, zero setup" },
      { label: "xUnit (.NET)",        description: "xUnit unit testing for C#/F# — most popular .NET framework" }
    ]
  },
  {
    header: "Coverage Threshold",
    question: "Set minimum unit test coverage?",
    multiSelect: false,
    options: [
      { label: "80% (Recommended)", description: "Standard — balance quality and velocity" },
      { label: "90%",               description: "High — critical paths well-tested" },
      { label: "100%",              description: "Full coverage — every line must be tested" }
    ]
  },
  {
    header: "TDD Mode",
    question: "Enable Test-Driven Development (write tests first)?",
    multiSelect: false,
    options: [
      { label: "Yes (Recommended)", description: "Enforce RED-GREEN-REFACTOR — planners generate test-first plans" },
      { label: "No",                description: "Write tests after implementation" }
    ]
  }

After collecting answers, run these commands:

FRAMEWORK_MAP:
  JUnit 5 (Java)    → id=junit5,      runner="mvn test",         coverage="mvn test jacoco:report"
  pytest (Python)   → id=pytest,      runner="pytest",           coverage="pytest --cov=src --cov-report=term-missing"
  Vitest (JS/TS)    → id=vitest,      runner="npm test",         coverage="npm run test:coverage"
  Jest (JS/TS)      → id=jest,        runner="npm test",         coverage="npm test -- --coverage"
  go test (Go)      → id=go-test,     runner="go test ./...",    coverage="go test -cover ./..."
  testify (Go)      → id=testify,     runner="go test ./...",    coverage="go test -cover ./..."
  Kotest (Kotlin)   → id=kotest,      runner="./gradlew test",   coverage="./gradlew test jacocoTestReport"
  cargo test (Rust) → id=cargo-test,  runner="cargo test",       coverage="cargo tarpaulin --out Html"
  xUnit (.NET)      → id=dotnet-test, runner="dotnet test",      coverage="dotnet test --collect:XPlat Code Coverage"

COVERAGE_MAP: "80% (Recommended)"→80  "90%"→90  "100%"→100
TDD_MAP: "Yes (Recommended)"→true  "No"→false

  gsd-sdk query config-set testing.framework "<id>"
  gsd-sdk query config-set testing.runner_command "<runner>"
  gsd-sdk query config-set testing.coverage_command "<coverage>"
  gsd-sdk query config-set testing.coverage_threshold <80|90|100>
  gsd-sdk query config-set workflow.tdd_mode <true|false>

After saving, proceed to Step 1 of the workflow.
</pre_workflow_testing_setup>

`;

const PROCESS_TAG = '<process>';

try {
  if (!fs.existsSync(SKILL_PATH)) process.exit(0);

  const content = fs.readFileSync(SKILL_PATH, 'utf8');

  // Already patched → nothing to do
  if (content.includes(MARKER)) process.exit(0);

  // Find injection point: just before <process>
  const idx = content.indexOf(PROCESS_TAG);
  if (idx === -1) process.exit(0);

  const patched = content.slice(0, idx) + PATCH + content.slice(idx);
  fs.writeFileSync(SKILL_PATH, patched, 'utf8');

  // Silent success — session continues normally
  process.exit(0);
} catch (e) {
  // Never block session start
  process.exit(0);
}
