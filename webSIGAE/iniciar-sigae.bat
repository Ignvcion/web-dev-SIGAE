@echo off
REM Doble clic: levanta SIGAE y lo publica con un tunel HTTPS (ver iniciar-sigae.ps1)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0iniciar-sigae.ps1" %*
if errorlevel 1 pause
