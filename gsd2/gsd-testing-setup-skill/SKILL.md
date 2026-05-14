---
name: gsd-testing-setup
description: Configure unit testing framework during GSD project initialization
triggers:
  - new project
  - project initialization
  - testing setup
  - test configuration
---

# GSD Testing Framework Setup

When initializing a new GSD project, configure the unit testing framework by asking the user about their testing preferences.

## When to Trigger

This skill should be invoked during project initialization, specifically:
- When the user runs `/gsd new-project`
- When discussing project setup and testing requirements
- When the user explicitly asks about testing configuration

## Step 1: Ask Testing Questions

Use the `AskUserQuestion` tool to collect testing preferences. Ask the following questions:

### Question 1: Unit Testing Framework

**Question:** "Which unit testing framework would you like to use for this project?"

**Options:**
1. **Jest** - Popular JavaScript testing framework with built-in coverage
2. **Vitest** - Fast Vite-native test runner, Jest-compatible API
3. **pytest** - Python testing framework with powerful fixtures
4. **JUnit** - Standard Java testing framework
5. **RSpec** - Ruby BDD testing framework
6. **Go testing** - Built-in Go testing package
7. **Rust cargo test** - Built-in Rust testing framework
8. **PHPUnit** - PHP testing framework
9. **Other** - Specify custom framework

### Question 2: Coverage Threshold

**Question:** "What code coverage threshold should be enforced?"

**Options:**
1. **80%** - Balanced coverage (recommended for most projects)
2. **90%** - High coverage (strict quality standards)
3. **100%** - Complete coverage (critical systems only)

### Question 3: TDD Mode

**Question:** "Enable Test-Driven Development (TDD) mode?"

**Options:**
1. **Yes** - Write tests before implementation (recommended)
2. **No** - Write tests after implementation

## Step 2: Process Answers

Based on the user's answers, construct the testing configuration object:

```javascript
{
  "framework": "<selected_framework>",
  "runner_command": "<framework_specific_command>",
  "coverage_command": "<framework_specific_coverage_command>",
  "coverage_threshold": <selected_threshold>,
  "tdd_mode": <true_or_false>
}
```

### Framework-Specific Commands

**Jest:**
- runner_command: `npm test`
- coverage_command: `npm test -- --coverage`

**Vitest:**
- runner_command: `npm test`
- coverage_command: `npm test -- --coverage`

**pytest:**
- runner_command: `pytest`
- coverage_command: `pytest --cov=. --cov-report=term-missing`

**JUnit:**
- runner_command: `mvn test`
- coverage_command: `mvn test jacoco:report`

**RSpec:**
- runner_command: `bundle exec rspec`
- coverage_command: `bundle exec rspec --format documentation`

**Go testing:**
- runner_command: `go test ./...`
- coverage_command: `go test -cover ./...`

**Rust cargo test:**
- runner_command: `cargo test`
- coverage_command: `cargo tarpaulin --out Stdout`

**PHPUnit:**
- runner_command: `./vendor/bin/phpunit`
- coverage_command: `./vendor/bin/phpunit --coverage-text`

**Other:**
- Ask the user to provide custom commands

## Step 3: Write Configuration

Create the configuration file at `.gsd/testing-config.json`:

```json
{
  "framework": "jest",
  "runner_command": "npm test",
  "coverage_command": "npm test -- --coverage",
  "coverage_threshold": 80,
  "tdd_mode": true
}
```

Use the `Write` tool to create this file in the project root's `.gsd/` directory.

## Step 4: Confirm to User

After writing the configuration, inform the user:

```
✓ Testing configuration saved successfully!

Framework: <framework_name>
Coverage threshold: <threshold>%
TDD mode: <enabled/disabled>

Configuration saved to: .gsd/testing-config.json
```

## Important Notes

1. **Always ask these questions** during project initialization, even if the user doesn't explicitly mention testing
2. **Create the .gsd directory** if it doesn't exist before writing the config file
3. **Validate the configuration** before writing to ensure all required fields are present
4. **Handle "Other" framework** by asking follow-up questions for custom commands

## Example Interaction

```
Assistant: I'll help you set up testing for this project.

[Uses AskUserQuestion with the three questions above]

User: [Selects Jest, 80%, Yes]