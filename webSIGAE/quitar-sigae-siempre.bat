@echo off
REM Quita el inicio automatico de SIGAE y detiene el tunel
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar-sigae-siempre.ps1" -Quitar
