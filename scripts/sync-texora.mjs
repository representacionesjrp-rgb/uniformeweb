#!/usr/bin/env node
// Sincroniza los productos de Texora (texora.cl) y su disponibilidad, y escribe data/texora.js
// Copia propia de Uniformeweb, basada en la de romans.cl (no comparte nada con romans ni laropa).
// Uso: node scripts/sync-texora.mjs        (Node 18 o superior, sin dependencias)
// Lo ejecuta GitHub Actions cada día (ver .github/workflows/sync-texora.yml).
//
// Variables de entorno (secretos de GitHub, todas opcionales):
//   TEXORA_EMAIL, TEXORA_PASSWORD  sesión de distribuidor: agrega la disponibilidad por color y talla.
//   TEXORA_PROXY, TEXORA_PROXY_KEY dirección y clave del Worker de Cloudflare (cloudflare/texora-proxy.js).
//                                  Texora bloquea las conexiones desde GitHub (HTTP 403); a través del
//                                  Worker las peticiones salen desde Cloudflare, que sí es aceptado.

const BASE = 'https://texora.cl';
const PROXY = (process.env.TEXORA_PROXY || '').replace(/\/+$/, '');
const PROXY_KEY = process.env.TEXORA_PROXY_KEY || '';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept-Language': 'es-CL,es;q=0.9',
};

const SUBCATS = [15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,43,44,45,46,47,48,49,50,51];
const EXCLUDE_SUBCATS = new Set([45]); // rodilleras
const EXCLUDE_IDS = new Set([]);       // id de Texora de productos que Uniformeweb no quiere mostrar
const EXCLUDE_NAME = /rodill|zapat|bot[ií]n|botas?\b|calzado|guante|casco|lente|protector/i;
const SUB_LABEL = { 'Termica': 'Térmicas', 'Termico': 'Térmicos', 'Hi-Vis': 'Alta visibilidad', 'Polar y Micropolar': 'Polar y micropolar', 'Ignifuga': 'Ignífuga', 'Antiestatico': 'Antiestática', 'Antiacido': 'Antiácida', 'Geologos': 'Chalecos geólogo', 'Primeras Capas': 'Primeras capas', 'Poleras Polo': 'Poleras polo', 'Jockey': 'Jockeys' };

// Página de Uniformeweb donde aparece cada producto (la primera regla que calce).
function pagina(p) {
  const n = p.nombre.toLowerCase(), s = new Set(p.sub), c = new Set(p.cat);
  if (/pantal|jeans|jardinera/.test(n)) return 'pantalones';
  if (s.has('Polerones') || /poler[oó]n/.test(n)) return 'polerones';
  if (s.has('Polar y micropolar') || /micropolar|polar/.test(n)) return 'micropolar';
  if (s.has('Jockeys') || s.has('Gorros') || s.has('Bandanas') || /jockey|gorro|bandana/.test(n)) return 'jockeys';
  if (s.has('Camisas') || s.has('Blusas') || /camisa|blusa/.test(n)) return 'camisas';
  if (s.has('Poleras') || s.has('Poleras polo') || s.has('Primeras capas') || /polera|primera capa/.test(n)) return 'poleras';
  if (s.has('Softshell') || /softshell/.test(n)) return 'softshell';
  if (s.has('Cortavientos') || /cortavient/.test(n)) return 'cortavientos';
  if (c.has('Chaquetas') || /chaqueta|parka|casaca/.test(n)) return 'parkas';
  if (s.has('Overoles') || s.has('Chalecos geólogo') || /overol|chaleco/.test(n)) return 'epp';
  return '';
}

// Disponibilidad: el sitio es público, así que no se publican cantidades exactas de Texora.
//   D = disponible, U = últimas unidades, A = agotado, "P dd-mm-aaaa" = llega en esa fecha.
const UMBRAL_TALLA = 20, UMBRAL_TOTAL = 50;
function nivel(v, umbral) {
  if (typeof v === 'string' && v[0] === 'P') return 'P ' + v.slice(1);
  if (typeof v === 'string' && v[0] === '+') return 'D';
  const n = +v || 0;
  return n <= 0 ? 'A' : n < umbral ? 'U' : 'D';
}

let LOGGED = false;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const strip = (h) => decode(String(h || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// Con TEXORA_PROXY, cada petición pasa por el Worker de Cloudflare.
function via(url) { return PROXY ? PROXY + '/?u=' + encodeURIComponent(url) : url; }
function viaHeaders(h) { return PROXY ? { ...h, 'X-Clave': PROXY_KEY } : h; }

let COOKIE = '';
function keepCookies(r) {
  const set = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  for (const c of set) {
    const kv = c.split(';')[0], name = kv.split('=')[0];
    COOKIE = COOKIE.split('; ').filter((x) => x && x.split('=')[0] !== name).concat(kv).join('; ');
  }
}
async function login() {
  const email = process.env.TEXORA_EMAIL, pass = process.env.TEXORA_PASSWORD;
  if (!email || !pass) { console.log('Sin sesión de distribuidor: solo disponibilidad total por producto.'); return false; }
  const url = BASE + '/iniciar-sesion?back=my-account';
  const page = await fetch(via(url), { headers: viaHeaders(HEADERS) }); keepCookies(page);
  const body = new URLSearchParams({ back: 'my-account', email, password: pass, submitLogin: '1' });
  const r = await fetch(via(url), { method: 'POST', body, redirect: 'manual', headers: viaHeaders({ ...HEADERS, Cookie: COOKIE, 'Content-Type': 'application/x-www-form-urlencoded' }) });
  keepCookies(r);
  const check = await get(BASE + '/mi-cuenta');
  const ok = /cerrar sesi[oó]n|mylogout|logout/i.test(check);
  console.log(ok ? 'Sesión de distribuidor iniciada.' : 'No se pudo iniciar sesión; se usa solo la disponibilidad total.');
  return ok;
}
function sizeTable(html) {
  const t = (html.match(/<table[\s\S]*?<\/table>/) || [])[0];
  const out = {};
  if (!t) return out;
  for (const row of t.split(/<tr[\s>]/).slice(2)) {
    const cells = row.split(/<td[^>]*>/).slice(1).map((c) => strip(c));
    if (cells.length < 4) continue;
    const v = cells[cells.length - 1];
    const soon = v.match(/pr[oó]ximamente\s*(\d\d-\d\d-\d{4})/i);
    out[cells[0]] = nivel(soon ? 'P' + soon[1] : v.startsWith('+') ? '+' : +(v.replace(/\D/g, '') || 0), UMBRAL_TALLA);
  }
  return out;
}

async function get(url, json, tries = 4, opts = {}) {
  for (let i = 0; i < tries; i++) {
    try {
      const h = json ? { ...HEADERS, Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } : { ...HEADERS };
      if (COOKIE) h.Cookie = COOKIE;
      const r = await fetch(via(url), { ...opts, headers: viaHeaders({ ...h, ...(opts.headers || {}) }) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return json ? await r.json() : await r.text();
    } catch (e) {
      if (i === tries - 1) throw new Error(url + ' -> ' + e.message);
      await sleep(1500 * (i + 1));
    }
  }
}

function listing(html) {
  const out = new Map();
  for (const chunk of html.split('<article').slice(1)) {
    const id = (chunk.match(/data-id-product="(\d+)"/) || [])[1];
    if (!id || out.has(id)) continue;
    const link = (chunk.match(/href="(https:\/\/texora\.cl\/[^"#]+\.html)/) || [])[1];
    const talla = (strip(chunk).match(/Talla:\s*hasta\s+(\S+)/) || [])[1] || '';
    out.set(id, { id, link, talla });
  }
  return out;
}

function titleCase(s) {
  s = s.replace(/\s+/g, ' ').replace(/HI -VIS/g, 'HI-VIS').trim();
  const up = (s.match(/[A-ZÁÉÍÓÚÑ]/g) || []).length, low = (s.match(/[a-záéíóúñ]/g) || []).length;
  if (up < low) return s;
  const small = new Set(['de', 'con', 'y', 'para', 'sin', 'a', 'el', 'la', 'en']);
  const keep = new Set(['HI-VIS', 'M/L', 'PU', 'UV']);
  return s.split(' ').map((w, i) => {
    if (keep.has(w) || /^\d/.test(w)) return w;
    const lw = w.toLowerCase();
    if (i > 0 && small.has(lw)) return lw;
    return lw.charAt(0).toUpperCase() + lw.slice(1);
  }).join(' ').replace(/Hi-vis/g, 'Hi-Vis').replace(/Polyester/g, 'Poliéster');
}
const colorName = (n) => titleCase(n.trim());
function firstSentence(s) {
  const m = s.match(/^.{20,170}?[.!](\s|$)/);
  return (m ? m[0] : s.slice(0, 160)).trim();
}
// Párrafos de la descripción larga (máximo 5, sin repetir la frase corta).
function paragraphs(html) {
  return String(html || '').split(/<\/p>|<br\s*\/?>|<\/li>/i).map(strip).filter((x) => x.length > 15).slice(0, 5);
}
const absUrl = (u) => (u ? new URL(u.replace(/ /g, '%20'), BASE).href : '');

async function product(item) {
  const html = await get(item.link);
  const m = html.match(/id="product-details"[^>]*data-product="([^"]*)"/) || html.match(/data-product="([^"]*)"[^>]*id="product-details"/);
  if (!m) throw new Error('Sin datos de producto: ' + item.link);
  const p = JSON.parse(decode(m[1]));
  const colors = [];
  const g2 = html.match(/<ul id="group_2"[\s\S]*?<\/ul>/);
  if (g2) {
    for (const li of g2[0].split('<li').slice(1)) {
      const name = (li.match(/title="([^"]+)"/) || [])[1];
      const bg = (li.match(/background-color:\s*(#[0-9a-fA-F]{3,6})/) || [])[1] || '';
      if (name) colors.push([colorName(decode(name)), bg.toLowerCase()]);
    }
  }
  const feats = {};
  for (const f of p.features || []) (feats[f.name] ||= []).push(String(f.value).trim());
  const spec = {};
  if (feats['Composición']) spec['Composición'] = feats['Composición'].join(', ');
  if (feats['Gramaje']) spec['Gramaje'] = feats['Gramaje'].join(', ');
  if (feats['Tela']) spec['Tela'] = feats['Tela'].join(', ');
  if (feats['Tipo de manga']) spec['Manga'] = feats['Tipo de manga'].join(', ');
  const genero = (feats['Género'] || [])[0] || (/mujer/i.test(p.name) ? 'Mujer' : /hombre/i.test(p.name) ? 'Hombre' : /unisex/i.test(p.name) ? 'Unisex' : '');
  const imgs = (p.images || []).slice(0, 6).map((im) => +(String((im.bySize && im.bySize.large_default && im.bySize.large_default.url) || im.large?.url || '').match(/texora\.cl\/(\d+)-/) || [])[1]).filter(Boolean);
  // Guía de tallas (imagen del modal "TABLA DE TALLAS") y ficha técnica en PDF.
  const guia = absUrl((html.match(/<img[^>]+src="([^"]*\/img\/custom\/[^"]*)"[^>]*alt="Gu[ií]a de tallas"/i) || html.match(/<img[^>]+src="([^"]*Tabla[^"]*medidas[^"]*)"/i) || [])[1]);
  const ficha = absUrl((html.match(/href="([^"]*\/img\/custom\/fichas\/[^"]+\.pdf)"/i) || [])[1]);
  // Por cada color: sus fotos (cimg) y, con sesión de distribuidor, la disponibilidad por talla (det).
  let det, cimg;
  const vals = g2 ? [...g2[0].matchAll(/<input[^>]*value="(\d+)"[^>]*title="([^"]+)"|<input[^>]*title="([^"]+)"[^>]*value="(\d+)"/g)].map((x) => [x[1] || x[4], decode(x[2] || x[3])]) : [];
  if (vals.length > 1 || (LOGGED && vals.length)) {
    if (LOGGED) det = {};
    cimg = [];
    for (const [v, t] of vals) {
      const body = new URLSearchParams({ ajax: '1', action: 'refresh', quantity_wanted: '1', 'group[2]': v });
      const j = await get(`${BASE}/index.php?controller=product&id_product=${item.id}`, true, 3, { method: 'POST', body });
      if (det) det[colorName(t)] = sizeTable(j.product_variants || '');
      cimg.push([...new Set([...(j.product_cover_thumbnails || '').matchAll(/(\d+)-large_default/g)].map((x) => +x[1]))].slice(0, 6));
      await sleep(150);
    }
    if (vals.length < 2 || cimg.every((x) => x.join() === cimg[0].join())) cimg = undefined;
  }
  const desc = firstSentence(strip(p.description_short));
  return {
    id: +item.id,
    nombre: titleCase(p.name),
    sku: p.reference,
    tallas: item.talla,
    disp: nivel(+p.quantity_all_versions || 0, UMBRAL_TOTAL),
    desc,
    texto: paragraphs(p.description).filter((x) => x !== desc),
    spec, genero,
    atributos: [...(feats['Atributos'] || []), ...(feats['Tecnologías'] || [])].slice(0, 8),
    img: imgs,
    slug: item.link.split('/').pop().replace(/^\d+-\d+-/, '').replace('.html', ''),
    colores: colors,
    cimg,
    det,
    guia,
    ficha,
  };
}

async function main() {
  console.log(PROXY ? 'Conectando a Texora a través del Worker de Cloudflare.' : 'Conectando directo a Texora.');
  LOGGED = await login();
  console.log('Leyendo listado completo…');
  const all = await get(BASE + '/9-lineas?resultsPerPage=999', true);
  const items = listing(all.rendered_products);
  console.log(items.size + ' productos');

  console.log('Leyendo subcategorías…');
  const subOf = new Map();
  for (const c of SUBCATS) {
    const j = await get(`${BASE}/${c}-x?resultsPerPage=999`, true);
    const label = String(j.label || '').replace(/^Categoría:\s*/, '');
    for (const id of listing(j.rendered_products || '').keys()) {
      if (!subOf.has(id)) subOf.set(id, []);
      subOf.get(id).push([c, label]);
    }
    await sleep(300);
  }

  console.log('Leyendo fichas y disponibilidad…');
  const list = [...items.values()], prods = [];
  let i = 0;
  async function worker() {
    while (i < list.length) {
      const it = list[i++];
      try { prods.push(await product(it)); } catch (e) { console.warn('  ! ' + e.message); }
      await sleep(250);
    }
  }
  await Promise.all([1, 2, 3, 4].map(worker));

  const GROUPS = [[15, 21, 'Chaquetas'], [22, 29, 'Pantalones'], [30, 36, 'Poleras y Camisas'], [37, 39, 'Ropa de Trabajo'], [40, 46, 'Accesorios'], [47, 51, 'Ropa Técnica']];
  for (const p of prods) {
    const subs = subOf.get(String(p.id)) || [];
    p.cat = [...new Set(subs.map(([c]) => (GROUPS.find((g) => c >= g[0] && c <= g[1]) || [])[2]).filter(Boolean))];
    p.sub = [...new Set(subs.map(([, l]) => SUB_LABEL[l] || l))];
    p.pagina = pagina(p);
    p._excluir = subs.some(([c]) => EXCLUDE_SUBCATS.has(c));
  }
  const ok = prods.filter((p) => !p._excluir && p.pagina && !EXCLUDE_NAME.test(p.nombre) && !EXCLUDE_IDS.has(p.id));
  for (const p of ok) delete p._excluir;
  ok.sort((a, b) => a.id - b.id);

  if (prods.length < items.size * 0.85) throw new Error(`Solo se leyeron ${prods.length} de ${items.size} productos; no se actualiza el catálogo.`);

  const fs = await import('node:fs');
  const path = new URL('../data/texora.js', import.meta.url);
  // Sin sesión de distribuidor se conserva la última disponibilidad por talla conocida.
  if (!LOGGED && fs.existsSync(path)) {
    try {
      const prev = JSON.parse(fs.readFileSync(path, 'utf8').replace(/^window\.TEXORA=/, '').replace(/;\s*$/, ''));
      const old = new Map(prev.productos.map((p) => [p.id, p.det]));
      for (const p of ok) if (!p.det && old.get(p.id)) p.det = old.get(p.id);
    } catch (e) { console.log('No se pudo leer el catálogo anterior:', e.message); }
  }
  const out = { actualizado: new Date().toISOString(), fuente: 'texora.cl', total: ok.length, productos: ok };
  fs.writeFileSync(path, 'window.TEXORA=' + JSON.stringify(out) + ';\n');
  const porPagina = {};
  for (const p of ok) porPagina[p.pagina] = (porPagina[p.pagina] || 0) + 1;
  console.log(`Listo: ${ok.length} productos.`, porPagina);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
