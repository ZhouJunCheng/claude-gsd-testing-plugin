@echo off
REM uninstall.bat — Remove gsd-testing-plugin (hooks + SKILL.md patch) for Windows
setlocal

set "HELPER=%~dp0uninstall-helper.js"
set "CONFIG_FILE=%USERPROFILE%\.claude\hooks\gsd-testing-config.js"
set "PATCH_FILE=%USERPROFILE%\.claude\hooks\gsd-testing-patch.js"

REM Check Node.js is available
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install from https://nodejs.org
    exit /b 1
)

REM Remove hook files
if exist "%CONFIG_FILE%" (
    del /f "%CONFIG_FILE%"
    echo Removed %CONFIG_FILE%
) else (
    echo gsd-testing-config.js not found, skipping
)

if exist "%PATCH_FILE%" (
    del /f "%PATCH_FILE%"
    echo Removed %PATCH_FILE%
) else (
    echo gsd-testing-patch.js not found, skipping
)

REM Run helper to remove hooks from settings*.json and strip SKILL.md patch
if not exist "%HELPER%" (
    echo ERROR: uninstall-helper.js not found in the same directory as uninstall.bat
    exit /b 1
)

node "%HELPER%"
if %errorlevel% neq 0 (
    echo ERROR: Failed to update settings files
    exit /b 1
)

echo.
echo Uninstall complete. Restart Claude Code to apply changes.
endlocal
