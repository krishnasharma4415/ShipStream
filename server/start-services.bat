@echo off
echo Starting Vercel-like Deployment Services...

echo.
echo Installing dependencies for all services...
cd upload-service && npm install && cd ..
cd deploy-service && npm install && cd ..
cd request-handler && npm install && cd ..

echo.
echo Building TypeScript for all services...
cd upload-service && npm run build && cd ..
cd deploy-service && npm run build && cd ..
cd request-handler && npm run build && cd ..

echo.
echo Services built successfully!
echo.
echo To start the services, run these commands in separate terminals:
echo 1. Upload Service: cd upload-service && npm start
echo 2. Deploy Service: cd deploy-service && npm start  
echo 3. Request Handler: cd request-handler && npm start
echo.
echo Make sure Redis is running and environment variables are set!
pause