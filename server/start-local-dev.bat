@echo off
echo Starting Vercel-like Deployment Service in Development Mode...
echo.

echo Verifying setup first...
node verify-setup.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Setup verification failed. Please fix the issues above.
    pause
    exit /b 1
)

echo.
echo ✅ Setup verified! Starting services...
echo.
echo Open these URLs in separate terminals to start each service:
echo.
echo 1. Upload Service (Port 5500):
echo    cd upload-service ^&^& npm run dev
echo.
echo 2. Deploy Service (Background Worker):
echo    cd deploy-service ^&^& npm run dev  
echo.
echo 3. Request Handler (Port 3000):
echo    cd request-handler ^&^& npm run dev
echo.
echo After starting all services, test with:
echo curl -X POST http://localhost:5500/send-url -H "Content-Type: application/json" -d "{\"repoUrl\": \"https://github.com/username/repo.git\"}"
echo.
pause