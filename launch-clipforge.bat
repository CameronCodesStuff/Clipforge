@echo off
setlocal
cd /d "%~dp0"
title ClipForge

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js was not found on this computer.
    echo Install it from https://nodejs.org ^(LTS version^), then run this again.
    pause
    exit /b 1
)

if not exist node_modules (
    echo First-time setup - installing dependencies, this can take a few minutes...
    call npm install
    if errorlevel 1 (
        echo.
        echo npm install failed. Scroll up to see the error.
        pause
        exit /b 1
    )
)

call npm run dev
