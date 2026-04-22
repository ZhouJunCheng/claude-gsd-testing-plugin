@echo off
REM uninstall.bat — Remove gsd-testing-config.js hook (Windows)
setlocal

set "HELPER=%~dp0uninstall-helper.js"
set "HOOK_FILE=%USERPROFILE%\.claude\hooks\gsd-testing-config.js"
set "SETTINGS_FILE=%USERPROFILE%\.claude\settings.json"

REM Check Node.js is available
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install from https://nodejs.org
    exit /b 1
)

REM Remove hook file
if exist "%HOOK_FILE%" (
    del /f "%HOOK_FILE%"
    echo Removed %HOOK_FILE%
) else (
    echo Hook file not found, skipping
)

REM Update settings.json
if not exist "%SETTINGS_FILE%" (
    echo settings.json not found, nothing to update
    goto done
)

if not exist "%HELPER%" (
    echo ERROR: uninstall-helper.js not found in the same directory as uninstall.bat
    exit /b 1
)

node "%HELPER%"
if %errorlevel% neq 0 (
    echo ERROR: Failed to update settings.json
    exit /b 1
)

:done
echo Done. Restart Claude Code for changes to take effect.
endlocal
