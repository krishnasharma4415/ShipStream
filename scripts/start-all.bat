@echo off
REM ShipStream - Start All Services (Windows)
REM This script starts all microservices for local development

echo Starting ShipStream Services...
echo ==================================

REM Check if .env exists
if not exist "server\.env" (
    echo Error: server\.env file not found
    echo Copy server\.env.example to server\.env and configure it
    exit /b 1
)

REM Validate environment
echo.
echo Validating environment...
node scripts\validate-env.js
if errorlevel 1 (
    echo Environment validation failed
    exit /b 1
)

REM Start auth-service
echo.
echo Starting auth-service on port 5501...
cd server\auth-service
if not exist "node_modules" (
    echo Installing dependencies for auth-service...
    call npm install
)
echo Building auth-service...
call npm run build
start "auth-service" cmd /k npm start
cd ..\..
timeout /t 3 /nobreak > nul

REM Start upload-service
echo.
echo Starting upload-service on port 5500...
cd server\upload-service
if not exist "node_modules" (
    echo Installing dependencies for upload-service...
    call npm install
)
echo Building upload-service...
call npm run build
start "upload-service" cmd /k npm start
cd ..\..
timeout /t 3 /nobreak > nul

REM Start deploy-service
echo.
echo Starting deploy-service on port 5502...
cd server\deploy-service
if not exist "node_modules" (
    echo Installing dependencies for deploy-service...
    call npm install
)
echo Building deploy-service...
call npm run build
start "deploy-service" cmd /k npm start
cd ..\..
timeout /t 3 /nobreak > nul

REM Start request-handler
echo.
echo Starting request-handler on port 3000...
cd server\request-handler
if not exist "node_modules" (
    echo Installing dependencies for request-handler...
    call npm install
)
echo Building request-handler...
call npm run build
start "request-handler" cmd /k npm start
cd ..\..

echo.
echo ==================================
echo All services started!
echo.
echo Service URLs:
echo   Auth Service:    http://localhost:5501
echo   Upload Service:  http://localhost:5500
echo   Deploy Service:  http://localhost:5502
echo   Request Handler: http://localhost:3000
echo.
echo Health Checks:
echo   curl http://localhost:5501/health
echo   curl http://localhost:5500/health
echo   curl http://localhost:5502/health
echo   curl http://localhost:3000/health
echo.
echo To stop all services, close the terminal windows
echo.
