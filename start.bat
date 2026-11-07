@echo off
cd /d "%~dp0"

if not exist "server\node_modules" (
  echo Installing server packages...
  call npm install --prefix server
)
if not exist "client\node_modules" (
  echo Installing client packages...
  call npm install --prefix client
)

echo Starting server on http://localhost:3000 ...
start "Server" cmd /k "cd /d %~dp0server && npm run dev"

echo Starting client on http://localhost:5173 ...
start "Client" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 3 >nul
start http://localhost:5173
