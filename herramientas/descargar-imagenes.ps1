# Descarga todas las fotos del sitio desde Wix a la carpeta img\
# Uso (Windows): clic derecho sobre este archivo > "Ejecutar con PowerShell"
# Luego abra assets\js\config.js y cambie  imagenesLocales: false  por  imagenesLocales: true
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz
New-Item -ItemType Directory -Force -Path img | Out-Null
$texto = (Get-Content index.html, assets\js\config.js, assets\js\sitio.js -Raw) -join "`n"
$ids = [regex]::Matches($texto, '[0-9a-f_]*[0-9a-f]{32}(~mv2)?\.(jpg|jpeg|png)') | ForEach-Object { $_.Value } | Sort-Object -Unique
$ok = 0; $fallo = 0
foreach ($id in $ids) {
  $destino = Join-Path img ($id -replace '~', '-')
  if (Test-Path $destino) { $ok++; continue }
  try { Invoke-WebRequest -Uri "https://static.wixstatic.com/media/$id" -OutFile $destino -UseBasicParsing; $ok++ }
  catch { $fallo++; Write-Host "No se pudo descargar: $id" }
}
Write-Host "Listo: $ok imagenes descargadas, $fallo con error."
Read-Host "Presione Enter para cerrar"
