# Worker de Cloudflare para leer Texora

Texora (texora.cl) rechaza las conexiones que vienen de los servidores de GitHub (responde HTTP 403),
por eso la actualización diaria no puede leer Texora directamente. Este Worker hace de intermediario:
GitHub le pide las páginas y el Worker las trae desde Cloudflare, que Texora sí acepta
(comprobado el 14-11-2026). El plan gratuito de Cloudflare alcanza de sobra (unas 800 peticiones al día).

## Publicarlo (una sola vez, unos 5 minutos)
1. En dash.cloudflare.com: **Workers & Pages → Create → Create Worker**. Nómbrelo `uniformeweb-texora` y presione **Deploy**.
2. **Edit code**: borre todo, pegue el contenido de `cloudflare/texora-proxy.js` y presione **Deploy**.
3. En el Worker: **Settings → Variables and Secrets → Add**: tipo *Secret*, nombre `CLAVE`, valor: una clave larga inventada (por ejemplo 30 letras y números al azar). Guarde.
4. Copie la dirección del Worker (algo como `https://uniformeweb-texora.SU-CUENTA.workers.dev`).

## Conectarlo con GitHub
En github.com/representacionesjrp-rgb/uniformeweb → **Settings → Secrets and variables → Actions → New repository secret**:

| Nombre | Valor |
|---|---|
| `TEXORA_PROXY` | la dirección del Worker del paso 4 |
| `TEXORA_PROXY_KEY` | la misma clave del paso 3 |
| `TEXORA_EMAIL` | el correo de la cuenta de distribuidor en Texora (opcional: agrega la disponibilidad por talla) |
| `TEXORA_PASSWORD` | la contraseña de esa cuenta (opcional) |

Después, en la pestaña **Actions → Sincronizar productos Texora → Run workflow** se puede probar al tiro.
Si algo falla, la ejecución queda en rojo y GitHub le avisa por correo.
