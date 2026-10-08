@echo off
title Starting EduCloud (Backend + Frontend)
echo ========================================================
echo               EduCloud Starter Script
echo ========================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%backend"
set "FRONTEND_DIR=%SCRIPT_DIR%frontend"

echo Starting EduCloud Backend (Spring Boot on port 8080)...
start "EduCloud Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && call run-demo.bat"

echo Starting EduCloud Frontend (Vite on port 5173)...
start "EduCloud Frontend" cmd /k "cd /d ""%FRONTEND_DIR%"" && npm run dev"

echo.
echo Waiting 5 seconds before opening browser...
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo EduCloud has been launched!
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:8080
echo ========================================================

