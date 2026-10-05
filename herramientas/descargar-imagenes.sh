#!/usr/bin/env bash
# Descarga todas las fotos del sitio desde Wix a la carpeta img/
# Uso (Mac/Linux): desde la carpeta "sitio" ejecute:  bash herramientas/descargar-imagenes.sh
# Luego abra assets/js/config.js y cambie  imagenesLocales: false  por  imagenesLocales: true
set -u
cd "$(dirname "$0")/.."
mkdir -p img
ids=$(cat index.html assets/js/config.js assets/js/sitio.js | grep -oE '[0-9a-f_]*[0-9a-f]{32}(~mv2)?\.(jpg|jpeg|png)' | sort -u)
ok=0; fallo=0
for id in $ids; do
  destino="img/${id/\~/-}"
  [ -s "$destino" ] && { ok=$((ok+1)); continue; }
  if curl -fsSL "https://static.wixstatic.com/media/$id" -o "$destino"; then ok=$((ok+1)); else fallo=$((fallo+1)); rm -f "$destino"; echo "No se pudo descargar: $id"; fi
done
echo "Listo: $ok imágenes descargadas, $fallo con error."
