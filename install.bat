@echo off
REM install.bat - Install gsd-testing-plugin (dual version support) for Windows
setlocal

set "SCRIPT_DIR=%~dp0"
set "CONFIG_SRC_GSD1=%SCRIPT_DIR%gsd1\gsd-testing-config.js"
set "PATCH_SRC_GSD1=%SCRIPT_DIR%gsd1\gsd-testing-patch.js"

REM Fallback to root directory for backward compatibility
if not exist "%CONFIG_SRC_GSD1%" set "CONFIG_SRC_GSD1=%SCRIPT_DIR%gsd-testing-config.js"
if not exist "%PATCH_SRC_GSD1%" set "PATCH_SRC_GSD1=%SCRIPT_DIR%gsd-testing-patch.js"

set "HELPER=%SCRIPT_DIR%install-helper.js"
set "HOOK_DIR=%USERPROFILE%\.claude\hooks"
set "CONFIG_FILE=%HOOK_DIR%\gsd-testing-config.js"
set "PATCH_FILE=%HOOK_DIR%\gsd-testing-patch.js"

REM Check Node.js is available
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install from https://nodejs.org
    exit /b 1
)

REM Check source files exist
if not exist "%CONFIG_SRC_GSD1%" (
    echo ERROR: gsd-testing-config.js not found
    exit /b 1
)
if not exist "%PATCH_SRC_GSD1%" (
    echo ERROR: gsd-testing-patch.js not found
    exit /b 1
)
if not exist "%HELPER%" (
    echo ERROR: install-helper.js not found in the same directory as install.bat
    exit /b 1
)

REM Create hooks directory if needed
if not exist "%HOOK_DIR%" mkdir "%HOOK_DIR%"

REM Copy both hook files without BOM (PowerShell ensures UTF-8 no BOM)
powershell -Command "$content = Get-Content '%CONFIG_SRC_GSD1%' -Raw; [System.IO.File]::WriteAllText('%CONFIG_FILE%', $content, [System.Text.UTF8Encoding]::new($false))"
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy gsd-testing-config.js
    exit /b 1
)
echo Copied gsd-testing-config.js to %CONFIG_FILE%

powershell -Command "$content = Get-Content '%PATCH_SRC_GSD1%' -Raw; [System.IO.File]::WriteAllText('%PATCH_FILE%', $content, [System.Text.UTF8Encoding]::new($false))"
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy gsd-testing-patch.js
    exit /b 1
)
echo Copied gsd-testing-patch.js to %PATCH_FILE%

REM Run helper to detect versions and install components
node "%HELPER%"
if %errorlevel% neq 0 (
    echo ERROR: Failed to install components
    exit /b 1
)

echo.
echo Installation complete. Restart Claude Code to activate.
endlocal

