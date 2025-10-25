@echo off
echo Starting Development Environment...
echo.

echo Checking if Redis is running...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo Redis is not running. Please start Redis first:
    echo   - Install Redis: https://redis.io/download
    echo   - Or use Docker: docker run -d -p 6379:6379 redis:alpine
    echo.
    pause
    exit /b 1
)

echo Redis is running!
echo.

echo Starting services in separate windows...
start "Upload Service" cmd /k "cd upload-service && npm start"
timeout /t 2 /nobreak >nul
start "Deploy Service" cmd /k "cd deploy-service && npm start"  
timeout /t 2 /nobreak >nul
start "Request Handler" cmd /k "cd request-handler && npm start"

echo.
echo All services started!
echo.
echo Services running on:
echo - Upload Service: http://localhost:5500
echo - Request Handler: http://localhost:3000
echo.
echo To deploy a repo, use:
echo curl -X POST http://localhost:5500/send-url -H "Content-Type: application/json" -d "{\"repoUrl\": \"https://github.com/username/repo.git\"}"
echo.
pause