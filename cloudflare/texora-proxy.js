// Worker de Cloudflare para Uniformeweb: reenvía a texora.cl las peticiones del sincronizador.
// Texora bloquea las conexiones que vienen de GitHub (HTTP 403), pero acepta las de Cloudflare.
// Solo atiende peticiones con la clave correcta (variable secreta CLAVE) y solo hacia texora.cl.
// Cómo publicarlo: ver cloudflare/LEEME.md
const PERMITIDOS = ['user-agent', 'accept', 'accept-language', 'content-type', 'cookie', 'x-requested-with'];

export default {
  async fetch(req, env) {
    if (!env.CLAVE || req.headers.get('x-clave') !== env.CLAVE) return new Response('No autorizado', { status: 401 });
    let destino;
    try { destino = new URL(new URL(req.url).searchParams.get('u') || ''); } catch { return new Response('Falta u', { status: 400 }); }
    if (destino.protocol !== 'https:' || destino.hostname !== 'texora.cl') return new Response('Solo texora.cl', { status: 400 });
    const h = new Headers();
    for (const k of PERMITIDOS) { const v = req.headers.get(k); if (v) h.set(k, v); }
    const r = await fetch(destino.href, {
      method: req.method === 'POST' ? 'POST' : 'GET',
      headers: h,
      body: req.method === 'POST' ? await req.arrayBuffer() : undefined,
      redirect: 'manual',
    });
    const out = new Headers(r.headers);
    out.delete('content-encoding');
    out.delete('content-length');
    return new Response(r.body, { status: r.status, headers: out });
  },
};
