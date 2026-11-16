# Sitio web Uniformeweb (sin Wix)

Sitio estático: solo archivos HTML, CSS y JavaScript. No necesita servidor, base de datos ni plan pagado. Se puede abrir con doble clic en `index.html` para verlo en su computador.

## Qué archivo editar

| Quiero cambiar…                                  | Archivo                                   |
|--------------------------------------------------|-------------------------------------------|
| Correo, número de WhatsApp                        | `assets/js/config.js` (arriba)            |
| Fotos de una categoría, agregar/quitar categorías | `assets/js/config.js` (lista `categorias`)|
| Textos de la página de inicio, preguntas frecuentes, comunas | `index.html`                    |
| Colores y tipografía                              | `assets/css/estilos.css` (bloque `:root`) |

Para agregar una foto nueva: guárdela en la carpeta `img/` (por ejemplo `img/polera-azul.jpg`), active `imagenesLocales: true` en `config.js` y agregue `"polera-azul.jpg"` a la lista `fotos` de la categoría.

## Fotos: dejar de depender de Wix

Hoy las fotos se cargan desde el servidor de imágenes de Wix (siguen funcionando aunque cancele el plan pagado, mientras la cuenta gratuita exista). Para tenerlas en su propio sitio:

1. Ejecute `herramientas/descargar-imagenes.ps1` (Windows: clic derecho › Ejecutar con PowerShell) o `bash herramientas/descargar-imagenes.sh` (Mac/Linux).
2. En `assets/js/config.js` cambie `imagenesLocales: false` por `imagenesLocales: true`.
3. Vuelva a publicar.

## Formulario de cotización

Usa FormSubmit (gratis, sin cuenta): las solicitudes llegan a `ventas@uniformeweb.cl` (se cambia en `correoFormularios` de `config.js`). **La primera vez** que alguien envíe el formulario, FormSubmit mandará un correo de activación a esa casilla: hay que hacer clic en "Activate". También hay un botón para enviar la misma solicitud por WhatsApp.

## Publicar gratis

Opción recomendada: **GitHub Pages** (gratis, y permite que Claude haga cambios futuros directamente).

1. Cree una cuenta en github.com y un repositorio (por ejemplo `uniformeweb`).
2. Suba el contenido de esta carpeta `sitio/` (Add file › Upload files).
3. En el repositorio: Settings › Pages › Source: "Deploy from a branch", rama `main`, carpeta `/ (root)`.
4. En "Custom domain" escriba `www.uniformeweb.cl` y active "Enforce HTTPS" cuando aparezca disponible (el archivo `CNAME` ya está incluido).

Alternativas igual de gratuitas: Cloudflare Pages (Workers & Pages › Create › Pages › Upload assets, arrastrar la carpeta) o Netlify (app.netlify.com/drop, arrastrar la carpeta).

## Apuntar el dominio www.uniformeweb.cl

El dominio `.cl` se administra en NIC Chile (nic.cl). Antes de cambiar nada:

- **Correo (Google Workspace / Gmail):** el correo `cotizaciones@uniformeweb.cl` funciona con Google Workspace. Antes de mover el DNS, copie **todos** los registros que hoy apuntan a Google y vuelva a crearlos tal cual en el nuevo DNS:
  - **MX**: `smtp.google.com` (prioridad 1) o, en cuentas antiguas, los 5 de `ASPMX.L.GOOGLE.COM`, `ALT1…`, `ALT2…`, `ALT3…` y `ALT4.ASPMX.L.GOOGLE.COM`.
  - **TXT** en `@`: `v=spf1 include:_spf.google.com ~all` y el de verificación `google-site-verification=…`.
  - **TXT** en `google._domainkey` (firma DKIM) y en `_dmarc`, si existen.
  Estos registros solo afectan al correo; los del sitio (A y CNAME `www`) son independientes. Cloudflare los copia automáticamente al agregar el dominio, pero conviene compararlos con la lista anterior.
- **No cancele Wix** hasta que el nuevo sitio esté funcionando en el dominio.

Registros DNS para GitHub Pages (reemplace `USUARIO` por su usuario de GitHub):

| Tipo  | Nombre | Valor                 |
|-------|--------|-----------------------|
| CNAME | www    | USUARIO.github.io     |
| A     | @      | 185.199.108.153       |
| A     | @      | 185.199.109.153       |
| A     | @      | 185.199.110.153       |
| A     | @      | 185.199.111.153       |

Si en NIC Chile los "servidores de nombre" apuntan a Wix (`ns*.wixdns.net`), los registros se administran en Wix. Lo más simple es crear una cuenta gratis en Cloudflare, agregar el dominio (Cloudflare copia los registros existentes, incluido el correo), agregar los registros de arriba y luego cambiar en NIC Chile los servidores de nombre por los que entregue Cloudflare.

## Costo

- Hosting: $0 (GitHub Pages / Cloudflare Pages / Netlify).
- Formulario: $0 (FormSubmit).
- Solo se mantiene el pago anual del dominio en NIC Chile.

## Productos de Texora (se actualizan solos)

Las páginas de categoría muestran, antes de las fotos, los **modelos de Texora** con su ficha técnica, fotos por color,
colores, tallas, guía de tallas, ficha en PDF y disponibilidad. Al tocar un modelo se abre su ficha con los botones
"Cotizar por WhatsApp" y "Agregar a mi cotización" (lo suma al formulario del pie). Cada ficha tiene su propio enlace
(por ejemplo `poleras.html#p-736`) para compartirla.

| Archivo | Qué hace |
|---|---|
| `data/texora.js` | Productos y disponibilidad. **Se genera solo**, no lo edite a mano. |
| `scripts/sync-texora.mjs` | Lee texora.cl y regenera `data/texora.js`. Al inicio están las reglas que deciden en qué página va cada producto (`pagina`) y cuáles se ocultan (`EXCLUDE_IDS`). |
| `assets/js/texora.js` | Muestra los modelos y la ficha en el sitio. |
| `.github/workflows/sync-texora.yml` | Ejecuta la sincronización todos los días a las 07:15. |
| `cloudflare/` | Intermediario para que GitHub pueda leer Texora (ver `cloudflare/LEEME.md`). |

- La disponibilidad se muestra como **Disponible**, **Últimas unidades** (menos de 20 por talla), **Agotado** o **Llega el …**.
  Las cantidades exactas de Texora no se publican, porque este repositorio es público.
- Sin la cuenta de distribuidor de Texora configurada, la actualización diaria solo renueva la disponibilidad total de cada
  producto y conserva la última disponibilidad por talla conocida.
- Las fotos, guías de tallas y fichas PDF se cargan directamente desde texora.cl.
- Para actualizar a mano (Node 18 o superior): `node scripts/sync-texora.mjs`
