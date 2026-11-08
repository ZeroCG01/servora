@echo off
title SERVORA - Sistem POS & KDS Restoran
color 0E

echo =========================================================================
echo   SERVORA - RESTAURANT ORDER, CASHIER, KITCHEN & INVENTORY SYSTEM
echo   Opsi 1: Local On-Premise / Wi-Fi Lokal (Rp 0 Biaya Hosting)
echo =========================================================================
echo.

rem Dapatkan IP lokal Wi-Fi
set LOCAL_IP=127.0.0.1
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"Alamat IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

echo [INFO] IP Komputer Utama Server Restoran : %LOCAL_IP%
echo.
echo =========================================================================
echo   AKSES APLIKASI DI PERANGKAT LAIN (TABLET / HP KASIR & DAPUR):
echo   Buka browser (Chrome / Safari) lalu ketik:
echo   --^> http://%LOCAL_IP%:5173
echo.
echo   AKSES DI KOMPUTER UTAMA (PC SERVER INI):
echo   --^> http://localhost:5173
echo =========================================================================
echo.
echo Menjalankan modul-modul Servora:
echo 1. Backend Laravel API (Port 8000)
echo 2. Laravel Reverb Realtime WebSocket (Port 8080)
echo 3. Background Queue Worker
echo 4. Pre-Order H-10 Dispatch Scheduler
echo 5. Frontend React Vite (Port 5173)
echo.

rem Jalankan Backend Laravel API (0.0.0.0:8000)
start "Servora - Backend API (Port 8000)" cmd /k "cd /d "%~dp0backend" && php artisan serve --host=0.0.0.0 --port=8000"

rem Jalankan Laravel Reverb WebSocket (0.0.0.0:8080)
start "Servora - Reverb WebSocket (Port 8080)" cmd /k "cd /d "%~dp0backend" && php artisan reverb:start --host=0.0.0.0 --port=8080"

rem Jalankan Background Queue Worker
start "Servora - Queue Worker" cmd /k "cd /d "%~dp0backend" && php artisan queue:work --tries=3"

rem Jalankan Pre-Order Scheduler (Loop setiap 30 detik mengecek reminder H-10)
start "Servora - Pre-Order Scheduler" cmd /k "cd /d "%~dp0backend" && powershell -Command "while($true){ php artisan servora:dispatch-preorders; Start-Sleep -Seconds 30 }""

rem Jalankan Frontend React Vite (0.0.0.0:5173)
start "Servora - Frontend POS & KDS" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 0.0.0.0 --port 5173"

rem Tunggu 3 detik dan buka browser otomatis ke Servora
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo [SUKSES] Semua layanan Servora sedang berjalan!
echo Silakan gunakan aplikasi di browser.
pause

