@echo off
echo Testing Deployment Service...
echo.

echo Testing Upload Service health...
curl -s http://localhost:5500/status?id=test >nul 2>&1
if %errorlevel% neq 0 (
    echo Upload Service is not running on port 5500
    exit /b 1
)

echo Testing Request Handler health...
curl -s http://localhost:3000/ >nul 2>&1
if %errorlevel% neq 0 (
    echo Request Handler is not running on port 3000
    exit /b 1
)

echo.
echo All services are running!
echo.
echo Example deployment command:
echo curl -X POST http://localhost:5500/send-url -H "Content-Type: application/json" -d "{\"repoUrl\": \"https://github.com/vercel/next.js/tree/canary/examples/hello-world\"}"
echo.
pause