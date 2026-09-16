@echo off
cd /d "%~dp0"
echo ================================
echo    SIES - One Click Git Push
echo ================================
echo.

git add .

set /p msg="Commit message likhun (khali rakhle 'Update' hobe): "
if "%msg%"=="" set msg=Update

git commit -m "%msg%"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ================================
echo    Shesh! Upore result dekhun.
echo ================================
pause
