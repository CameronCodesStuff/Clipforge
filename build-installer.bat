@echo off
setlocal
cd /d "%~dp0"
title ClipForge - Build Installer

echo ================================
echo   ClipForge - Build Installer
echo ================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js was not found on this computer.
    echo.
    echo 1. Go to https://nodejs.org
    echo 2. Download and run the LTS installer ^(default options are fine^)
    echo 3. Close this window and double-click build-installer.bat again
    echo.
    pause
    exit /b 1
)

if not exist node_modules (
    echo Installing dependencies - this only happens once and can take a few minutes...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo npm install failed. Scroll up to see the error, then try again.
        pause
        exit /b 1
    )
)

echo.
echo Building ClipForge and packaging the Windows installer...
echo This can take a few minutes the first time.
echo.
call npm run build
if errorlevel 1 (
    echo.
    echo Build failed. Scroll up to see the error.
    pause
    exit /b 1
)

echo.
echo ================================
echo   Done!
echo ================================
echo Your installer is in the "release" folder as something like:
echo   ClipForge Setup 0.1.0.exe
echo.
echo Run that .exe to install ClipForge like any normal Windows app -
echo it adds a Start Menu entry, a desktop shortcut, and an uninstaller.
echo.
start "" "release"
pause
