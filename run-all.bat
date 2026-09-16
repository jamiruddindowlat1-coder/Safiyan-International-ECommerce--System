@echo off
setlocal

set "ROOT=%~dp0"
set "API_URL=http://localhost:5050"
set "FRONTEND_URL=http://localhost:5173"
set "SWAGGER_URL=%API_URL%/swagger"

echo Starting Safiyan backend API...
start "Safiyan API" cmd /k "cd /d "%ROOT%Safiyan.Api" && dotnet run --launch-profile http"

echo Starting Safiyan frontend...
start "Safiyan Frontend" cmd /k "cd /d "%ROOT%safiyan-frontend" && npm run dev"

echo Waiting for the local servers...
timeout /t 5 /nobreak >nul

echo Opening frontend and Swagger UI...
start "" "%FRONTEND_URL%"
start "" "%SWAGGER_URL%"

echo.
echo Safiyan frontend: %FRONTEND_URL%
echo Safiyan Swagger:  %SWAGGER_URL%
echo.
endlocal
