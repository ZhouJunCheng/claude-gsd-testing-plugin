@echo off
REM install.bat — Register gsd-testing-config.js as a PreToolUse hook (Windows)
setlocal enabledelayedexpansion

set "HOOK_SRC=%~dp0gsd-testing-config.js"
set "CLAUDE_DIR=%USERPROFILE%\.claude"
set "HOOK_DIR=%CLAUDE_DIR%\hooks"
set "HOOK_FILE=%HOOK_DIR%\gsd-testing-config.js"
set "SETTINGS_FILE=%CLAUDE_DIR%\settings.json"

REM Check Node.js is available
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install from https://nodejs.org
    exit /b 1
)

REM Check source hook file exists next to this script
if not exist "%HOOK_SRC%" (
    echo ERROR: gsd-testing-config.js not found in the same directory as install.bat
    exit /b 1
)

REM Create hooks directory if needed
if not exist "%HOOK_DIR%" mkdir "%HOOK_DIR%"

REM Copy hook file into place
copy /y "%HOOK_SRC%" "%HOOK_FILE%" >nul
echo Copied gsd-testing-config.js to %HOOK_FILE%

REM Ensure settings.json exists
if not exist "%SETTINGS_FILE%" echo {} > "%SETTINGS_FILE%"

REM Use Node.js to merge hook into settings.json (with backup)
node -e "
const fs = require('fs');
const path = require('path');
const settingsPath = process.env.USERPROFILE + '\\.claude\\settings.json';
const hookPath = process.env.USERPROFILE + '\\.claude\\hooks\\gsd-testing-config.js';

if (fs.existsSync(settingsPath)) {
  const now = new Date();
  const stamp = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const backupPath = settingsPath + '.' + stamp + '.bak';
  fs.copyFileSync(settingsPath, backupPath);
  console.log('Backed up settings.json to ' + path.basename(backupPath));
}

let settings = {};
try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch {}

if (!settings.hooks) settings.hooks = {};
if (!settings.hooks.PreToolUse) settings.hooks.PreToolUse = [];

const hookPathNorm = hookPath.replace(/\\\\/g, '/');
const entry = { matcher: 'Skill', hooks: [{ type: 'command', command: 'node ' + hookPathNorm }] };
const alreadyRegistered = settings.hooks.PreToolUse.some(
  h => h.hooks && h.hooks.some(hh => hh.command && hh.command.includes('gsd-testing-config'))
);

if (!alreadyRegistered) {
  settings.hooks.PreToolUse.push(entry);
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log('Registered gsd-testing-config.js as PreToolUse hook (matcher: Skill)');
} else {
  console.log('Hook already registered, skipping');
}
"

if %errorlevel% neq 0 (
    echo ERROR: Failed to update settings.json
    exit /b 1
)

echo Done. The testing config hook will trigger when /gsd-new-project is invoked.
endlocal
