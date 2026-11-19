@echo off
REM Deja SIGAE y el tunel funcionando siempre (pide permisos de administrador)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar-sigae-siempre.ps1"
