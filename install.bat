@echo off
REM install.bat — Register gsd-testing-config.js as a PreToolUse hook (Windows)
setlocal

set "SCRIPT_DIR=%~dp0"
set "HOOK_SRC=%SCRIPT_DIR%gsd-testing-config.js"
set "HELPER=%SCRIPT_DIR%install-helper.js"
set "HOOK_DIR=%USERPROFILE%\.claude\hooks"
set "HOOK_FILE=%HOOK_DIR%\gsd-testing-config.js"
set "SETTINGS_FILE=%USERPROFILE%\.claude\settings.json"

REM Check Node.js is available
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install from https://nodejs.org
    exit /b 1
)

REM Check source files exist
if not exist "%HOOK_SRC%" (
    echo ERROR: gsd-testing-config.js not found in the same directory as install.bat
    exit /b 1
)
if not exist "%HELPER%" (
    echo ERROR: install-helper.js not found in the same directory as install.bat
    exit /b 1
)

REM Create hooks directory if needed
if not exist "%HOOK_DIR%" mkdir "%HOOK_DIR%"

REM Copy hook file without BOM (use PowerShell to ensure UTF-8 no BOM)
powershell -Command "$content = Get-Content '%HOOK_SRC%' -Raw; [System.IO.File]::WriteAllText('%HOOK_FILE%', $content, [System.Text.UTF8Encoding]::new($false))"
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy gsd-testing-config.js
    exit /b 1
)
echo Copied gsd-testing-config.js to %HOOK_FILE%

REM Ensure settings.json exists
if not exist "%SETTINGS_FILE%" echo  > "%SETTINGS_FILE%"

REM Run helper to merge hook into settings.json
node "%HELPER%"
if %errorlevel% neq 0 (
    echo ERROR: Failed to update settings.json
    exit /b 1
)

echo Done. The testing config hook will trigger when /gsd-new-project is invoked.
endlocal
