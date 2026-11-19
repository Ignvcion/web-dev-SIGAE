# ver-sigae.ps1: muestra la dirección pública de SIGAE y si está funcionando.
$raiz = $PSScriptRoot
$archivoUrl = Join-Path $raiz 'logs\direccion.txt'
$registro = Join-Path $raiz 'logs\vigilante.log'

Write-Host 'SIGAE: estado' -ForegroundColor White
$tarea = Get-ScheduledTask -TaskName 'SIGAE' -ErrorAction SilentlyContinue
if (-not $tarea) {
  Write-Host '  Inicio automático: NO instalado (usa instalar-sigae-siempre.bat)' -ForegroundColor Yellow
} else {
  $estado = if ($tarea.State -eq 'Running') { 'funcionando' } else { "detenido ($($tarea.State))" }
  Write-Host "  Inicio automático: instalado, $estado" -ForegroundColor Green
}

if (Test-Path $archivoUrl) {
  $url = (Get-Content $archivoUrl -Raw).Trim()
  try { Set-Clipboard -Value $url } catch { }
  Write-Host "  Dirección: $url  (copiada al portapapeles)" -ForegroundColor Green
} else {
  Write-Host '  Dirección: todavía no hay' -ForegroundColor Yellow
}

if (Test-Path $registro) {
  Write-Host "`nÚltimos eventos:" -ForegroundColor Cyan
  Get-Content $registro -Tail 12 | ForEach-Object { Write-Host "  $_" }
}
Read-Host "`nPresiona Enter para cerrar"
