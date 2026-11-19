# iniciar-sigae.ps1
# Levanta SIGAE en este computador y lo publica en internet con un túnel HTTPS.
# Se ejecuta con doble clic en iniciar-sigae.bat (misma carpeta).
#
#  1. Revisa Node.js, el .env del backend y que MySQL esté encendido.
#  2. Instala dependencias si faltan y compila el FrontEnd (npm run build).
#  3. Inicia el backend en otra ventana, sirviendo la app y la API en el puerto 3000.
#  4. Abre el túnel:
#       - ngrok con dirección fija, si configuraste tunel.config (recomendado), o
#       - Cloudflare con una dirección nueva cada vez, si no.
#
# Para detener SIGAE: cierra esta ventana y la ventana del backend.

param(
  [switch]$SinCompilar   # salta "npm run build" si no cambiaste el FrontEnd
)

$ErrorActionPreference = 'Stop'
$raiz  = $PSScriptRoot
$back  = Join-Path $raiz 'BackEnd'
$front = Join-Path $raiz 'FrontEnd'
$puerto = 3000

function Paso($texto)  { Write-Host "`n==> $texto" -ForegroundColor Cyan }
function Ok($texto)    { Write-Host "    $texto" -ForegroundColor Green }
function Falla($texto) {
  Write-Host "`nERROR: $texto" -ForegroundColor Red
  Read-Host "`nPresiona Enter para cerrar"
  exit 1
}

function LeerEnv($archivo) {
  $valores = @{}
  if (Test-Path $archivo) {
    foreach ($linea in Get-Content $archivo) {
      if ($linea -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') {
        $valores[$Matches[1]] = $Matches[2].Trim('"').Trim("'")
      }
    }
  }
  return $valores
}

function PuertoAbierto($puertoBuscado) {
  $cliente = New-Object System.Net.Sockets.TcpClient
  try {
    $intento = $cliente.BeginConnect('127.0.0.1', $puertoBuscado, $null, $null)
    $conecto = $intento.AsyncWaitHandle.WaitOne(800) -and $cliente.Connected
    return $conecto
  } catch {
    return $false
  } finally {
    $cliente.Close()
  }
}

function Instalar($nombre, $idWinget) {
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Falla "Falta $nombre y no se encontró winget para instalarlo. Instálalo a mano y vuelve a intentar."
  }
  Write-Host "    Instalando $nombre (puede pedir permiso de Windows)..."
  winget install --id $idWinget -e --accept-source-agreements --accept-package-agreements | Out-Host
  # winget agrega el programa al PATH de nuevas ventanas: se recarga aquí
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}

Write-Host "SIGAE: inicio con túnel" -ForegroundColor White

# ── 1. Revisiones ──────────────────────────────────────────────
Paso 'Revisando Node.js y la configuración'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Falla 'No se encontró Node.js. Instálalo desde https://nodejs.org (versión LTS) y vuelve a intentar.'
}
if (-not (Test-Path (Join-Path $back '.env'))) {
  Falla 'Falta BackEnd\.env. Ejecuta primero "bash win_setup.sh" desde Git Bash en la carpeta del repositorio.'
}
Ok "Node.js $(node -v)"

$envBack = LeerEnv (Join-Path $back '.env')
$puertoDb = if ($envBack['DB_PORT']) { [int]$envBack['DB_PORT'] } else { 3306 }
Paso "Revisando la base de datos (MySQL, puerto $puertoDb)"
if (-not (PuertoAbierto $puertoDb)) {
  Falla 'MySQL no está encendido. Abre "Servicios" de Windows, busca MySQL80 y presiona Iniciar. Luego vuelve a intentar.'
}
Ok 'MySQL responde'

if (PuertoAbierto $puerto) {
  Falla "El puerto $puerto ya está en uso. Si tienes SIGAE abierto con F5 en VS Code, deténlo (Shift+F5) y vuelve a intentar."
}

# ── 2. Dependencias y compilación ──────────────────────────────
foreach ($carpeta in @($back, $front)) {
  if (-not (Test-Path (Join-Path $carpeta 'node_modules'))) {
    Paso "Instalando dependencias en $(Split-Path $carpeta -Leaf)"
    Push-Location $carpeta
    npm install
    $codigo = $LASTEXITCODE
    Pop-Location
    if ($codigo -ne 0) { Falla "npm install falló en $(Split-Path $carpeta -Leaf)." }
  }
}

$indice = Join-Path $front 'dist\index.html'
if ($SinCompilar -and (Test-Path $indice)) {
  Paso 'Usando la compilación anterior del FrontEnd (-SinCompilar)'
} else {
  Paso 'Compilando el FrontEnd (npm run build)'
  Push-Location $front
  # La app y la API quedan en la misma dirección: /api relativo, base /
  Remove-Item Env:VITE_API_URL -ErrorAction SilentlyContinue
  $env:VITE_BASE = '/'
  npm run build
  $codigo = $LASTEXITCODE
  Pop-Location
  if ($codigo -ne 0) { Falla 'La compilación del FrontEnd falló. Revisa el error de arriba.' }
}
if (-not (Test-Path $indice)) { Falla 'No se generó FrontEnd\dist\index.html.' }
Ok 'FrontEnd listo'

# ── 3. Backend ─────────────────────────────────────────────────
Paso "Iniciando el backend en el puerto $puerto (se abre otra ventana)"
$comandoBackend = "`$Host.UI.RawUI.WindowTitle = 'SIGAE - backend'; `$env:SERVIR_FRONTEND = '1'; `$env:PORT = '$puerto'; node server.js"
Start-Process powershell -WorkingDirectory $back -ArgumentList '-NoExit', '-Command', $comandoBackend | Out-Null

$listo = $false
for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Milliseconds 500
  if (PuertoAbierto $puerto) { $listo = $true; break }
}
if (-not $listo) { Falla 'El backend no arrancó. Revisa el mensaje en la ventana "SIGAE - backend".' }
Ok "SIGAE funciona en este computador: http://localhost:$puerto"

# ── 4. Túnel ───────────────────────────────────────────────────
$envTunel = LeerEnv (Join-Path $raiz 'tunel.config')
$dominio = $envTunel['NGROK_DOMINIO']

if ($dominio) {
  $dominio = $dominio -replace '^https?://', '' -replace '/+$', ''
  Paso "Abriendo el túnel de ngrok (dirección fija)"
  if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) { Instalar 'ngrok' 'Ngrok.Ngrok' }
  if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Falla 'ngrok se instaló, pero esta ventana no lo encuentra. Cierra esta ventana y vuelve a abrir iniciar-sigae.bat.'
  }
  $url = "https://$dominio"
  try { Set-Clipboard -Value $url } catch { }
  Write-Host ''
  Write-Host '  ================================================================' -ForegroundColor Green
  Write-Host "   SIGAE está en internet:  $url" -ForegroundColor Green
  Write-Host '   (dirección copiada al portapapeles; siempre es la misma)' -ForegroundColor Green
  Write-Host '  ================================================================' -ForegroundColor Green
  Write-Host '   No cierres esta ventana: al cerrarla se corta el túnel.'
  Write-Host ''
  ngrok http $puerto --url=$url
  if ($LASTEXITCODE -ne 0) {
    Falla 'ngrok no pudo abrir el túnel. Si es la primera vez, ejecuta "ngrok config add-authtoken TU_TOKEN" (el token está en dashboard.ngrok.com) y revisa que NGROK_DOMINIO en tunel.config sea tu dominio de ngrok.'
  }
} else {
  Paso 'Abriendo el túnel de Cloudflare (dirección nueva cada vez)'
  Write-Host '    Para tener siempre la misma dirección, configura ngrok (ver tunel.config.example).'
  if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) { Instalar 'cloudflared' 'Cloudflare.cloudflared' }
  if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Falla 'cloudflared se instaló, pero esta ventana no lo encuentra. Cierra esta ventana y vuelve a abrir iniciar-sigae.bat.'
  }
  $registro = Join-Path $env:TEMP 'sigae-cloudflared.log'
  Remove-Item $registro -ErrorAction SilentlyContinue
  $proceso = Start-Process cloudflared -ArgumentList 'tunnel', '--no-autoupdate', '--url', "http://localhost:$puerto" `
    -NoNewWindow -PassThru -RedirectStandardError $registro

  $url = $null
  for ($i = 0; $i -lt 60 -and -not $url; $i++) {
    Start-Sleep -Milliseconds 500
    if ($proceso.HasExited) { break }
    if (Test-Path $registro) {
      $coincidencia = Select-String -Path $registro -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' | Select-Object -First 1
      if ($coincidencia) { $url = $coincidencia.Matches[0].Value }
    }
  }
  if (-not $url) { Falla "Cloudflare no entregó una dirección. Detalle en $registro" }

  try { Set-Clipboard -Value $url } catch { }
  Write-Host ''
  Write-Host '  ================================================================' -ForegroundColor Green
  Write-Host "   SIGAE está en internet:  $url" -ForegroundColor Green
  Write-Host '   (dirección copiada al portapapeles; cambia cada vez que inicias)' -ForegroundColor Green
  Write-Host '  ================================================================' -ForegroundColor Green
  Write-Host '   No cierres esta ventana: al cerrarla se corta el túnel.'
  Write-Host ''
  Wait-Process -Id $proceso.Id
}
