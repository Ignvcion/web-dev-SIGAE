# instalar-sigae-siempre.ps1
# Deja SIGAE y el túnel funcionando siempre en este computador:
#  - Crea la tarea programada "SIGAE", que inicia el vigilante (sigae-siempre.ps1)
#    al entrar a Windows y lo reinicia si se detiene.
#  - Deja MySQL con inicio automático.
#  - Configura Windows para no suspenderse ni hibernar mientras esté enchufado.
#  - Compila la app e inicia todo de inmediato.
# Se ejecuta con instalar-sigae-siempre.bat (pide permisos de administrador).
# Para quitarlo: quitar-sigae-siempre.bat

param([switch]$Quitar)

$ErrorActionPreference = 'Stop'

# Se necesitan permisos de administrador (servicio de MySQL, energía y tarea programada)
$esAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $esAdmin) {
  $argumentos = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
  if ($Quitar) { $argumentos += ' -Quitar' }
  Start-Process powershell -Verb RunAs -ArgumentList $argumentos
  exit 0
}
$raiz = $PSScriptRoot
$vigilante = Join-Path $raiz 'sigae-siempre.ps1'
$nombreTarea = 'SIGAE'

function Paso($texto)  { Write-Host "`n==> $texto" -ForegroundColor Cyan }
function Ok($texto)    { Write-Host "    $texto" -ForegroundColor Green }
function Aviso($texto) { Write-Host "    $texto" -ForegroundColor Yellow }
function Falla($texto) {
  Write-Host "`nERROR: $texto" -ForegroundColor Red
  Read-Host "`nPresiona Enter para cerrar"
  exit 1
}

function DetenerSigae {
  # El vigilante (se lanza como ...\sigae-siempre.ps1; el instalador se llama distinto)
  Get-CimInstance Win32_Process | Where-Object {
    $_.ProcessId -ne $PID -and (
      $_.CommandLine -like '*\sigae-siempre.ps1*' -or
      (($_.Name -in @('ngrok.exe', 'cloudflared.exe')) -and $_.CommandLine -like '*3000*')
    )
  } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  # El backend: el programa node que escucha en el puerto 3000
  Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    $p = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($p -and $p.ProcessName -eq 'node') { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
  }
}

if ($Quitar) {
  Paso 'Quitando el inicio automático de SIGAE'
  if (Get-ScheduledTask -TaskName $nombreTarea -ErrorAction SilentlyContinue) {
    Stop-ScheduledTask -TaskName $nombreTarea -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $nombreTarea -Confirm:$false
    Ok 'Tarea programada eliminada'
  } else {
    Ok 'No había tarea programada'
  }
  DetenerSigae
  Ok 'SIGAE y el túnel detenidos'
  Aviso 'La configuración de energía no se cambió. Para volver a la de antes: Configuración > Sistema > Inicio/apagado y suspensión.'
  Read-Host "`nListo. Presiona Enter para cerrar"
  exit 0
}

Write-Host 'SIGAE siempre encendido: instalación' -ForegroundColor White

# ── Revisiones ─────────────────────────────────────────────────
Paso 'Revisando requisitos'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Falla 'No se encontró Node.js. Instálalo desde https://nodejs.org (LTS).' }
if (-not (Test-Path (Join-Path $raiz 'BackEnd\.env'))) { Falla 'Falta BackEnd\.env. Ejecuta primero "bash win_setup.sh" desde Git Bash.' }
if (-not (Test-Path $vigilante)) { Falla "No se encontró $vigilante." }
Ok "Node.js $(node -v)"

$config = Join-Path $raiz 'tunel.config'
$usaNgrok = (Test-Path $config) -and ((Get-Content $config) -match '^\s*NGROK_DOMINIO\s*=\s*\S+') -and -not ((Get-Content $config) -match 'tu-dominio\.ngrok-free\.app')
if ($usaNgrok) {
  Ok 'Túnel: ngrok con dirección fija (tunel.config)'
  if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host '    Instalando ngrok...'
    winget install --id Ngrok.Ngrok -e --accept-source-agreements --accept-package-agreements | Out-Host
  }
} else {
  Aviso 'Túnel: Cloudflare. La dirección cambia cada vez que el túnel se reinicia.'
  Aviso 'Para una dirección fija, configura ngrok (ver tunel.config.example) y vuelve a ejecutar este instalador.'
  if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Write-Host '    Instalando cloudflared...'
    winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements | Out-Host
  }
}

# ── MySQL con inicio automático ────────────────────────────────
Paso 'MySQL con inicio automático'
$servicios = Get-Service | Where-Object { $_.Name -like 'MySQL*' -or $_.Name -like 'MariaDB*' }
if ($servicios) {
  foreach ($s in $servicios) {
    Set-Service -Name $s.Name -StartupType Automatic
    if ($s.Status -ne 'Running') { Start-Service -Name $s.Name }
    Ok "$($s.Name): automático y encendido"
  }
} else {
  Aviso 'No se encontró el servicio de MySQL. Asegúrate de que MySQL se inicie con Windows.'
}

# ── Energía ────────────────────────────────────────────────────
Paso 'Evitando que el computador se suspenda enchufado'
powercfg /change standby-timeout-ac 0 | Out-Null
powercfg /change hibernate-timeout-ac 0 | Out-Null
Ok 'Sin suspensión ni hibernación mientras esté enchufado (la pantalla sí se puede apagar)'
Aviso 'En un notebook, revisa también qué pasa al cerrar la tapa: Panel de control > Opciones de energía > "Elegir el comportamiento al cerrar la tapa" > "No hacer nada" (enchufado).'

# ── Compilar la app ────────────────────────────────────────────
Paso 'Compilando la app (npm run build)'
$front = Join-Path $raiz 'FrontEnd'
foreach ($carpeta in @((Join-Path $raiz 'BackEnd'), $front)) {
  if (-not (Test-Path (Join-Path $carpeta 'node_modules'))) {
    Push-Location $carpeta; npm install; $codigo = $LASTEXITCODE; Pop-Location
    if ($codigo -ne 0) { Falla "npm install falló en $(Split-Path $carpeta -Leaf)." }
  }
}
Push-Location $front
Remove-Item Env:VITE_API_URL -ErrorAction SilentlyContinue
$env:VITE_BASE = '/'
npm run build
$codigo = $LASTEXITCODE
Pop-Location
if ($codigo -ne 0) { Falla 'La compilación falló. Revisa el error de arriba.' }
Ok 'App compilada'

# ── Tarea programada ───────────────────────────────────────────
Paso 'Creando la tarea programada "SIGAE"'
DetenerSigae
$usuario = "$env:USERDOMAIN\$env:USERNAME"
$accion = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$vigilante`"" -WorkingDirectory $raiz
$disparador = New-ScheduledTaskTrigger -AtLogOn -User $usuario
$ajustes = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
  -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId $usuario -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $nombreTarea -Action $accion -Trigger $disparador -Settings $ajustes -Principal $principal `
  -Description 'Mantiene SIGAE y su túnel HTTPS funcionando (webSIGAE\sigae-siempre.ps1).' -Force | Out-Null
Ok 'Se iniciará sola cada vez que entres a Windows'

Paso 'Iniciando SIGAE ahora'
Start-ScheduledTask -TaskName $nombreTarea
$archivoUrl = Join-Path $raiz 'logs\direccion.txt'
Remove-Item $archivoUrl -ErrorAction SilentlyContinue
$url = $null
for ($i = 0; $i -lt 90 -and -not $url; $i++) {
  Start-Sleep -Seconds 1
  if (Test-Path $archivoUrl) { $url = (Get-Content $archivoUrl -Raw).Trim() }
}

if ($url) {
  try { Set-Clipboard -Value $url } catch { }
  Write-Host ''
  Write-Host '  ================================================================' -ForegroundColor Green
  Write-Host "   SIGAE está en internet:  $url" -ForegroundColor Green
  Write-Host '   Queda funcionando en segundo plano; puedes cerrar esta ventana.' -ForegroundColor Green
  Write-Host '   Para ver la dirección más tarde: ver-sigae.bat' -ForegroundColor Green
  Write-Host '  ================================================================' -ForegroundColor Green
} else {
  Aviso 'Todavía no hay dirección. Espera un minuto y abre ver-sigae.bat, o revisa logs\vigilante.log.'
}
Read-Host "`nPresiona Enter para cerrar"
