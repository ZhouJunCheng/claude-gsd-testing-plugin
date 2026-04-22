# GSD Testing Setup Skill

## Purpose

Automatically prompt users to configure their unit testing framework when starting a new GSD project via `/gsd-new-project`.

## Trigger

Triggered by the `gsd-testing-config.js` **PreToolUse hook** when:
- `Skill(gsd-new-project)` is called
- No `testing.framework` is configured in `.planning/config.json`
- No `skip_prompt` or pre-configured framework in `~/.gsd/defaults.json`

## What It Does

1. Detects project type from filesystem signals and recommends a framework (`✓ Recommended`)
2. Injects `additionalContext` instructing Claude to ask three required questions before the workflow starts
3. Persists answers to `.planning/config.json` via `gsd-sdk query config-set`
4. Continues the `new-project` workflow normally

## Questions (in order)

1. **Unit Testing Framework** — required, 10 options across 7 languages, no skip option
2. **Coverage Threshold** — required, 80% / 90% / 100%, no "no threshold" option
3. **TDD Mode** — Yes (Recommended) / No

## Supported Frameworks (10)

| id | Language |
|----|----------|
| vitest | JS/TS |
| jest | JS/TS |
| pytest | Python |
| unittest | Python |
| go-test | Go |
| testify | Go |
| junit5 | Java |
| kotest | Kotlin |
| cargo-test | Rust |
| dotnet-test | .NET |

## Configuration Schema

```json
{
  "testing": {
    "framework": "vitest|jest|pytest|unittest|go-test|testify|junit5|kotest|cargo-test|dotnet-test",
    "runner_command": "npm test",
    "coverage_command": "npm run test:coverage",
    "coverage_threshold": 80
  },
  "workflow": {
    "tdd_mode": true
  }
}
```

## Skip Prompt

```bash
mkdir -p ~/.gsd
echo '{"testing":{"skip_prompt":true}}' > ~/.gsd/defaults.json
```
