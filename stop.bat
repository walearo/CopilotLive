@echo off
title CopilotLive - Stopping

echo.
echo  Stopping CopilotLive...

REM Kill processes on port 3001 (API server)
for /f "tokens=5" %%P in (
    'netstat -ano 2^>nul ^| findstr ":3001 " ^| findstr "LISTENING"'
) do (
    echo  Stopped API server   (PID %%P)
    taskkill /PID %%P /F >nul 2>&1
)

REM Kill processes on port 5173 (Vite client)
for /f "tokens=5" %%P in (
    'netstat -ano 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"'
) do (
    echo  Stopped client       (PID %%P)
    taskkill /PID %%P /F >nul 2>&1
)

echo  Done.
echo.
timeout /t 2 /nobreak >nul
