@echo off
setlocal EnableDelayedExpansion
title CopilotLive

REM ── Move to the project root regardless of where the script was launched from
cd /d "%~dp0"

echo.
echo  ================================================
echo    CopilotLive  --  Interview Assistant
echo  ================================================
echo.

REM ── Check for server/.env ────────────────────────────────────────────────
if not exist "server\.env" (
    echo  [ERROR] server\.env not found.
    echo.
    echo  Create it by running:
    echo    copy .env.example server\.env
    echo  Then add your ANTHROPIC_API_KEY inside.
    echo.
    pause
    exit /b 1
)

REM ── Check the API key looks real (starts with sk-ant) ───────────────────
findstr /R "ANTHROPIC_API_KEY=sk-ant" "server\.env" >nul 2>&1
if errorlevel 1 (
    echo  [WARN] ANTHROPIC_API_KEY in server\.env does not look valid.
    echo  Continuing anyway -- the app will show an error when you ask a question.
    echo.
)

REM ── Check node_modules exist ─────────────────────────────────────────────
if not exist "node_modules\" (
    echo  [INFO] node_modules not found -- running npm install...
    echo.
    call npm install
    if errorlevel 1 (
        echo  [ERROR] npm install failed. Check the output above.
        pause
        exit /b 1
    )
    echo.
)

REM ── Kill anything already on ports 3001 / 5173 ───────────────────────────
echo  Checking for processes on ports 3001 and 5173...

for /f "tokens=5" %%P in (
    'netstat -ano 2^>nul ^| findstr ":3001 " ^| findstr "LISTENING"'
) do (
    echo  Stopping PID %%P on port 3001
    taskkill /PID %%P /F >nul 2>&1
)

for /f "tokens=5" %%P in (
    'netstat -ano 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"'
) do (
    echo  Stopping PID %%P on port 5173
    taskkill /PID %%P /F >nul 2>&1
)

REM ── Start the API server ──────────────────────────────────────────────────
echo.
echo  Starting API server on port 3001...
start "CopilotLive - Server" cmd /k ^
    "title CopilotLive - Server ^& cd /d "%~dp0server" ^& npm run dev"

REM ── Wait for the server to boot before starting the client ───────────────
echo  Waiting for server to boot...
timeout /t 4 /nobreak >nul

REM ── Start the Vite dev server ─────────────────────────────────────────────
echo  Starting client on port 5173...
start "CopilotLive - Client" cmd /k ^
    "title CopilotLive - Client ^& cd /d "%~dp0client" ^& npm run dev"

REM ── Wait for Vite to be ready then open the browser ──────────────────────
echo  Waiting for client to compile...
timeout /t 5 /nobreak >nul

echo  Opening browser...
start "" "http://localhost:5173"

echo.
echo  ================================================
echo    App running at  http://localhost:5173
echo    API running at  http://localhost:3001
echo.
echo    Two terminal windows have opened.
echo    Close them to stop the app.
echo  ================================================
echo.
echo  Press any key to close this window.
pause >nul
endlocal
