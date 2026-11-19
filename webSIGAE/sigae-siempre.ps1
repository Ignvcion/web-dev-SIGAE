# sigae-siempre.ps1
# Vigilante de SIGAE: mantiene el backend y el túnel funcionando. Si alguno se
# cae o deja de responder, lo vuelve a levantar. No tiene ventana: lo inicia la
# tarea programada "SIGAE" al entrar a Windows (ver instalar-sigae-siempre.bat).
#
# Registro: webSIGAE\logs\vigilante.log
# Dirección pública actual: webSIGAE\logs\direccion.txt

$ErrorActionPreference = 'Continue'
$raiz   = $PSScriptRoot
$back   = Join-Path $raiz 'BackEnd'
$front  = Join-Path $raiz 'FrontEnd'
$puerto = 3000
$logs   = Join-Path $raiz 'logs'
New-Item -ItemType Directory -Force -Path $logs | Out-Null
$registro  = Join-Path $logs 'vigilante.log'
$archivoUrl = Join-Path $logs 'direccion.txt'

function Anotar($texto) {
  $linea = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $texto"
  Add-Content -Path $registro -Value $linea -Encoding UTF8
}

# Un solo vigilante a la vez
$creado = $false
$mutex = New-Object System.Threading.Mutex($true, 'Local\SIGAE-vigilante', [ref]$creado)
if (-not $creado) { exit 0 }

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

function PuertoAbierto($numero) {
  $cliente = New-Object System.Net.Sockets.TcpClient
  try {
    $intento = $cliente.BeginConnect('127.0.0.1', $numero, $null, $null)
    return ($intento.AsyncWaitHandle.WaitOne(800) -and $cliente.Connected)
  } catch {
    return $false
  } finally {
    $cliente.Close()
  }
}

function Responde($url) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10 -Headers @{ 'ngrok-skip-browser-warning' = '1' }
    return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400)
  } catch {
    return $false
  }
}

function Detener($proceso) {
  if ($proceso -and -not $proceso.HasExited) {
    try { Stop-Process -Id $proceso.Id -Force -ErrorAction SilentlyContinue } catch { }
  }
}

# La rotación es simple: cada archivo de registro se reinicia al pasar 5 MB
function Recortar($archivo) {
  if ((Test-Path $archivo) -and (Get-Item $archivo).Length -gt 5MB) {
    Move-Item $archivo "$archivo.anterior" -Force
  }
}

$envBack  = LeerEnv (Join-Path $back '.env')
$puertoDb = if ($envBack['DB_PORT']) { [int]$envBack['DB_PORT'] } else { 3306 }
$dominio  = (LeerEnv (Join-Path $raiz 'tunel.config'))['NGROK_DOMINIO']
if ($dominio) { $dominio = $dominio -replace '^https?://', '' -replace '/+$', '' }

$backend = $null
$tunel = $null
$urlPublica = $null
$fallasBackend = 0
$fallasTunel = 0
$ultimaRevisionPublica = [DateTime]::MinValue
$avisoPuertoOcupado = $false
$avisoMysql = $false

function IniciarBackend {
  Recortar (Join-Path $logs 'backend.log')
  $env:SERVIR_FRONTEND = '1'
  $env:PORT = "$puerto"
  $script:backend = Start-Process node -ArgumentList 'server.js' -WorkingDirectory $back -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput (Join-Path $logs 'backend.log') -RedirectStandardError (Join-Path $logs 'backend-errores.log')
  $script:fallasBackend = 0
  Anotar "Backend iniciado (proceso $($script:backend.Id))"
}

function IniciarTunel {
  $logTunel = Join-Path $logs 'tunel.log'
  Recortar $logTunel
  if ($dominio) {
    $script:tunel = Start-Process ngrok -ArgumentList 'http', "$puerto", "--url=https://$dominio", '--log=stdout' `
      -WindowStyle Hidden -PassThru -RedirectStandardOutput $logTunel -RedirectStandardError (Join-Path $logs 'tunel-errores.log')
    $script:urlPublica = "https://$dominio"
  } else {
    Remove-Item $logTunel -ErrorAction SilentlyContinue
    $script:tunel = Start-Process cloudflared -ArgumentList 'tunnel', '--no-autoupdate', '--url', "http://localhost:$puerto" `
      -WindowStyle Hidden -PassThru -RedirectStandardError $logTunel -RedirectStandardOutput (Join-Path $logs 'tunel-salida.log')
    $script:urlPublica = $null
    for ($i = 0; $i -lt 60 -and -not $script:urlPublica; $i++) {
      Start-Sleep -Milliseconds 500
      if ($script:tunel.HasExited) { break }
      $hallazgo = Select-String -Path $logTunel -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($hallazgo) { $script:urlPublica = $hallazgo.Matches[0].Value }
    }
  }
  $script:fallasTunel = 0
  $script:ultimaRevisionPublica = Get-Date
  if ($script:urlPublica) {
    Set-Content -Path $archivoUrl -Value $script:urlPublica -Encoding UTF8
    Anotar "Túnel iniciado: $($script:urlPublica)"
  } else {
    Anotar 'El túnel no entregó una dirección; se reintentará'
  }
}

Anotar '──────── Vigilante iniciado ────────'
if (-not (Test-Path (Join-Path $front 'dist\index.html'))) {
  Anotar 'Falta la app compilada: ejecutando npm run build'
  Push-Location $front
  Remove-Item Env:VITE_API_URL -ErrorAction SilentlyContinue
  $env:VITE_BASE = '/'
  npm run build *> (Join-Path $logs 'compilacion.log')
  Pop-Location
}

while ($true) {
  # 1. Base de datos: Windows la inicia sola (servicio automático); aquí solo se espera
  if (-not (PuertoAbierto $puertoDb)) {
    if (-not $avisoMysql) { Anotar "MySQL no responde en el puerto $puertoDb; esperando..." ; $avisoMysql = $true }
    Start-Sleep -Seconds 15
    continue
  }
  if ($avisoMysql) { Anotar 'MySQL responde de nuevo'; $avisoMysql = $false }

  # 2. Backend (app + API)
  $backendVivo = $backend -and -not $backend.HasExited
  if (-not $backendVivo) {
    if (PuertoAbierto $puerto) {
      if (-not $avisoPuertoOcupado) { Anotar "El puerto $puerto lo usa otro programa (¿SIGAE abierto con F5?); esperando a que se libere"; $avisoPuertoOcupado = $true }
      Start-Sleep -Seconds 15
      continue
    }
    $avisoPuertoOcupado = $false
    if ($backend) { Anotar 'El backend se detuvo; reiniciándolo' }
    IniciarBackend
    Start-Sleep -Seconds 20
  } elseif (-not (Responde "http://127.0.0.1:$puerto/")) {
    $fallasBackend++
    if ($fallasBackend -ge 3) {
      Anotar 'El backend no responde hace 45 s; reiniciándolo'
      Detener $backend
      Start-Sleep -Seconds 2
      IniciarBackend
      Start-Sleep -Seconds 20
    }
  } else {
    $fallasBackend = 0
  }

  # 3. Túnel
  if (-not $tunel -or $tunel.HasExited) {
    if ($tunel) { Anotar 'El túnel se cerró; reabriéndolo' }
    IniciarTunel
  } elseif (((Get-Date) - $ultimaRevisionPublica).TotalMinutes -ge 2) {
    # Cada 2 minutos se prueba la dirección pública desde internet
    $ultimaRevisionPublica = Get-Date
    if ($urlPublica -and (Responde $urlPublica)) {
      $fallasTunel = 0
    } else {
      $fallasTunel++
      Anotar "La dirección pública no responde (intento $fallasTunel de 3)"
      if ($fallasTunel -ge 3) {
        Anotar 'Reabriendo el túnel'
        Detener $tunel
        Start-Sleep -Seconds 2
        IniciarTunel
      }
    }
  }

  Recortar $registro
  Start-Sleep -Seconds 15
}
