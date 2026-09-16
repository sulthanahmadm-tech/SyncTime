@echo off
echo ===================================
echo   SyncTime - Dashboard Starter
echo ===================================
echo.
echo 1. Development Mode (Hot Reload)
echo 2. Production Mode (Optimized)
echo 3. Build & Run Production
echo.
set /p choice="Pilih mode (1/2/3): "

if "%choice%"=="1" (
  echo Starting Development Mode...
  npm run dev
) else if "%choice%"=="2" (
  echo Starting Production Mode...
  npm start
) else if "%choice%"=="3" (
  echo Building Application...
  npm run build
  echo Starting Production Mode...
  npm start
) else (
  echo Pilihan tidak valid.
)
pause
