/* =========================================================================
   UNIFORMEWEB · Modo cotizador ("Mi cotización")
   - Cualquier visitante arma su lista con "+ Cotizar" en las tarjetas o
     "Agregar a mi cotización" en la ficha: solo se pregunta cuántas unidades
     quiere (sin color ni talla), se marca si lleva logo y se envía por el
     formulario o por WhatsApp.
   - Vendedores: abrir el sitio con ?vendedor=1 activa el modo vendedor en ese
     navegador (?vendedor=0 lo apaga). Suma "Abrir en el cotizador" (si
     UW.cotizadorUrl está configurado en config.js) y "Copiar resumen". Si el
     vendedor inició sesión en el cotizador, la ficha muestra las unidades exactas por
     talla y los precios por tramo (los entrega el cotizador privado, nunca el sitio público).
   La lista se guarda en el navegador, así que sigue igual al cambiar de página.
   Normalmente no necesita editar este archivo.
   ========================================================================= */
(function () {
  "use strict";
  var UW = window.UW || {};
  var CLAVE = "uw-cotizacion", CLAVE_V = "uw-vendedor";
  var IMG = "https://texora.cl/";
  var memoria = {};

  function leer(k) { try { return localStorage.getItem(k); } catch (e) { return memoria[k] == null ? null : memoria[k]; } }
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) { memoria[k] = v; } }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function entero(v) { return Math.max(0, parseInt(v, 10) || 0); }

  /* --- Modo vendedor ------------------------------------------------------ */
  (function () {
    var m = location.search.match(/[?&]vendedor=([01])/);
    if (m) guardar(CLAVE_V, m[1]);
  })();
  var vendedor = leer(CLAVE_V) === "1";
  if (vendedor) document.documentElement.classList.add("uwc-vendedor");

  /* --- Stock exacto (solo vendedores con sesión en el cotizador) ------------- */
  // null = sin consultar, false = sin sesión o sin datos, objeto = unidades por talla.
  var stock = null, stockFecha = "";
  function cargarStock() {
    if (!vendedor || !UW.cotizadorUrl || !window.fetch) { stock = false; return; }
    fetch(String(UW.cotizadorUrl).replace(/\/+$/, "") + "/api/stock", { credentials: "include", cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        stock = d && d.productos && Object.keys(d.productos).length ? d.productos : false;
        stockFecha = (d && d.actualizado) || "";
        stockFicha();
      })
      .catch(function () { stock = false; stockFicha(); });
  }
  function baseCot() { return String(UW.cotizadorUrl || "").replace(/\/+$/, ""); }
  function clp(n) { return "$" + String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  var MAX = 10; // máximo de productos distintos por solicitud (igual que La Ropa)

  /* --- Precios por tramo (solo vendedores con sesión en el cotizador) -------- */
  // El cotizador entrega { tramos:[7], logo:[7], p:{ SKU:[7 precios netos] } }.
  var precios = null;
  function cargarPrecios() {
    if (!vendedor || !UW.cotizadorUrl || !window.fetch) { precios = false; return; }
    fetch(baseCot() + "/api/precios-web", { credentials: "include", cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        precios = d && d.p && d.tramos && d.logo ? d : false;
        estadoFranja();
        pintar(); preciosTarjetas(); preciosFicha();
      })
      .catch(function () { precios = false; estadoFranja(); pintar(); preciosFicha(); });
  }
  function preciosDe(sku) { return precios && sku != null ? precios.p[String(sku).toUpperCase()] || null : null; }
  // Mismo cálculo que La Ropa: el tramo es el más alto cuyo mínimo alcanza el total
  // neto calculado con los precios de ese tramo (productos + logo bordado).
  function calc() {
    if (!precios) return null;
    var T = precios.tramos, L = precios.logo, n = T.length, tot = [], i, sinPrecio = 0, conLogo = 0;
    for (i = 0; i < n; i++) tot.push(0);
    lista.forEach(function (it) {
      var pr = preciosDe(it.sku), q = total(it);
      if (!q) return;
      if (!pr) { sinPrecio++; return; }
      if (it.logo) conLogo += q;
      for (i = 0; i < n; i++) tot[i] += q * (pr[i] + (it.logo ? L[i] : 0));
    });
    var k = 0;
    for (i = 0; i < n; i++) if (tot[i] > 0 && tot[i] >= T[i]) k = i;
    return { k: k, neto: tot[k], sig: k + 1 < n && tot[k + 1] > 0 ? T[k + 1] - tot[k + 1] : 0, sinPrecio: sinPrecio, conLogo: conLogo };
  }
  function nombreTramo(k) {
    var T = precios.tramos;
    return k === 0 ? "Menos de " + clp(T[1] || 0) : "Desde " + clp(T[k]);
  }
  function enlaceSesion(txt) {
    return '<a href="' + esc(baseCot()) + '/login" target="_blank" rel="noopener">Inicia sesión en el cotizador</a> ' + txt;
  }
  // Tarjetas: "$X + IVA · desde $Y por volumen".
  function preciosTarjetas(raiz) {
    if (!precios) return;
    (raiz || document).querySelectorAll(".tx-card[data-id]").forEach(function (c) {
      if (c.querySelector(".uwc-precio")) return;
      var p = producto(c.getAttribute("data-id")), pr = p && preciosDe(p.sku);
      if (!pr) return;
      var e = document.createElement("p");
      e.className = "uwc-precio";
      e.innerHTML = "<b>" + clp(pr[0]) + "</b> + IVA" + (pr[pr.length - 1] < pr[0] ? " <span>desde " + clp(pr[pr.length - 1]) + " por volumen</span>" : "");
      var cod = c.querySelector(".tx-cod");
      if (cod) cod.parentNode.insertBefore(e, cod.nextSibling); else c.appendChild(e);
    });
  }
  // Ficha: precio para la cotización actual y tabla de tramos con el logo.
  var fichaAbierta = null;
  function preciosFicha() {
    if (!fichaAbierta || !vendedor) return;
    var p = fichaAbierta.producto, caja = fichaAbierta.panel;
    if (!caja || !caja.isConnected) return;
    var viejo = caja.querySelector(".uwc-ptier");
    if (viejo) viejo.remove();
    var d = document.createElement("div");
    d.className = "uwc-ptier";
    var pr = preciosDe(p && p.sku);
    if (precios === null) return;
    if (!precios) {
      if (!UW.cotizadorUrl) return;
      d.innerHTML = "<small>" + enlaceSesion("para ver los precios por tramo.") + "</small>";
    } else if (!pr) {
      d.innerHTML = "<small>Este modelo no tiene precio en el cotizador.</small>";
    } else {
      var r = calc(), it = buscar(String(p.id)), k = r.k, L = precios.logo;
      var unit = pr[k] + (it && it.logo ? L[k] : 0);
      var cab = it && total(it) ?
        "<p class=\"uwc-ptier-u\"><b>" + clp(unit) + "</b> c/u + IVA <span>· " + clp(unit * 1.19) + " con IVA" + (it.logo ? " · incluye logo " + clp(L[k]) : "") + "</span></p>" +
        "<p>Este modelo: " + clp(unit * total(it)) + " neto (" + total(it) + " un.) · Tu cotización: " + clp(r.neto) + " neto</p>" +
        (r.sig > 0 ? "<p class=\"uwc-ptier-sig\">Agrega " + clp(r.sig) + " netos a tu cotización y baja a " + clp(pr[k + 1] + (it.logo ? L[k + 1] : 0)) + " por unidad.</p>" : "") :
        "<p class=\"uwc-ptier-u\"><b>" + clp(pr[k]) + "</b> c/u + IVA <span>· desde " + clp(pr[pr.length - 1]) + " por volumen</span></p>" +
        (lista.length ? "<p>Precio con el tramo actual de tu cotización (" + nombreTramo(k).toLowerCase() + ").</p>" : "");
      var filas = precios.tramos.map(function (t, i) {
        return "<tr" + (i === k ? ' class="actual"' : "") + "><td>" + nombreTramo(i) + "</td><td>" + clp(pr[i]) + "</td><td>" + clp(L[i]) + "</td></tr>";
      }).join("");
      d.innerHTML = cab +
        '<table><thead><tr><th>Compra total (neto)</th><th>Precio unitario</th><th>Bordado logo 8x3 cm</th></tr></thead><tbody>' + filas + "</tbody></table>" +
        '<small>El tramo se calcula con el total neto de toda la cotización. El bordado del logo cuesta ' + clp(L[0]) + " c/u y baja hasta " + clp(L[L.length - 1]) + " c/u en compras más grandes. Valores referenciales, sin IVA.</small>";
    }
    var antesDe = caja.querySelector(".tx-tallas");
    if (antesDe && antesDe.nextSibling) caja.insertBefore(d, antesDe.nextSibling); else caja.appendChild(d);
  }
  document.addEventListener("uw:ficha", function (e) {
    fichaAbierta = e.detail && e.detail.producto ? e.detail : null;
    preciosFicha();
    stockFicha();
  });

  function unidades(p, color, talla) {
    var s = stock && p && stock[p.id];
    var c = s && (s[color] || s[Object.keys(s)[0]]);
    return c && c[talla] != null ? c[talla] : null;
  }

  /* --- Datos ---------------------------------------------------------------- */
  var lista = [];
  try { lista = JSON.parse(leer(CLAVE) || "[]"); if (!Array.isArray(lista)) lista = []; } catch (e) { lista = []; }
  function persistir() { guardar(CLAVE, JSON.stringify(lista)); }
  // Listas guardadas con la versión anterior (cantidades por talla): se pasan a total.
  lista.forEach(function (it) {
    var t = it.tallas || {}, s = 0;
    Object.keys(t).forEach(function (k) { s += Math.max(0, parseInt(t[k], 10) || 0); });
    if (s) it.cantidad = s;
    it.tallas = {};
    delete it.soloTotal;
  });
  // Versión anterior: una línea por color. Ahora una sola línea por producto.
  (function () {
    var porId = {}, nueva = [];
    lista.forEach(function (it) {
      var k = String(it.id), u = porId[k];
      if (u) { u.cantidad = (parseInt(u.cantidad, 10) || 0) + (parseInt(it.cantidad, 10) || 0); u.logo = u.logo || it.logo; return; }
      it.clave = k; it.verColor = it.verColor || it.color || ""; delete it.color;
      porId[k] = it; nueva.push(it);
    });
    lista = nueva;
  })();
  // Después de enviar el formulario (página gracias.html) la lista se vacía.
  if (/gracias\.html$/.test(location.pathname)) {
    lista = []; persistir(); guardar(CLAVE + "-obs", "");
  }

  function productos() { return (window.TEXORA && window.TEXORA.productos) || []; }
  function producto(id) {
    var ps = productos();
    for (var i = 0; i < ps.length; i++) if (String(ps[i].id) === String(id)) return ps[i];
    return null;
  }
  var ESCALA = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL"];
  function tallasDe(p, color) {
    if (!p) return [];
    if (p.det) {
      var d = p.det[color] || p.det[Object.keys(p.det)[0]];
      if (d) return Object.keys(d);
    }
    var t = String(p.tallas || "");
    if (/^\d+$/.test(t)) {
      var out = [];
      for (var n = 38; n <= +t; n += 2) out.push(String(n));
      return out;
    }
    var fin = ESCALA.indexOf(t);
    return fin > 0 ? ESCALA.slice(1, fin + 1) : [];
  }
  function estadoTalla(p, color, talla) {
    if (!p || !p.det) return "";
    if (p.disp === "A") return "A";
    var d = p.det[color] || {};
    return String(d[talla] || "").charAt(0);
  }
  function fotoDe(p, color) {
    if (!p) return "";
    var i = (p.colores || []).map(function (c) { return c[0]; }).indexOf(color);
    var ids = i > -1 && p.cimg && p.cimg[i] && p.cimg[i].length ? p.cimg[i] : p.img;
    return ids && ids.length ? IMG + ids[0] + "-home_default/" + p.slug + ".jpg" : "";
  }
  function pagina(p) { return p && p.pagina ? p.pagina + ".html#p-" + p.id : ""; }

  function total(it) { return entero(it.cantidad); }
  var NOMBRE_ESTADO = { D: "Disponible", U: "Últimas unidades", A: "Agotado", P: "Próximamente" };

  /* --- API pública (la usa texora.js si existe) ---------------------------- */
  // Pregunta cuántas unidades y agrega el producto (sin color ni talla).
  function agregar(p, color, abrirPanel) {
    if (!p) return;
    color = color || ((p.colores || [])[0] || [""])[0];
    var clave = String(p.id), existente = buscar(clave);
    if (!existente && lista.length >= MAX) {
      return agregado(p, 0, "limite");
    }
    pedirCantidad(p, color, existente ? entero(existente.cantidad) : 0, function (n) {
      if (!existente) {
        existente = {
          clave: clave, id: p.id, sku: p.sku, nombre: p.nombre, verColor: color,
          foto: fotoDe(p, color), url: pagina(p), cantidad: 0, logo: true
        };
        lista.push(existente);
      }
      existente.cantidad = n;
      persistir();
      pintar();
      pulso();
      preciosFicha();
      if (abrirPanel === true) abrir(clave);
      else agregado(p, n, lista.length >= MAX ? "lleno" : "");
    });
  }

  /* --- Aviso "Agregado a tu cotización" (como en La Ropa) -------------------- */
  var agr, tAgr;
  function agregado(p, n, tipo) {
    if (!agr) {
      agr = document.createElement("div");
      agr.className = "uwc-agr";
      agr.setAttribute("role", "status");
      agr.setAttribute("aria-live", "polite");
      document.body.appendChild(agr);
      agr.addEventListener("click", function (e) {
        if (e.target.closest(".uwc-agr-ver")) { cerrarAgr(); abrir(); }
        else if (e.target.closest(".uwc-agr-seguir, .uwc-agr-x")) cerrarAgr();
      });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && agr.classList.contains("visible")) cerrarAgr(); });
    }
    var u = 0;
    lista.forEach(function (it) { u += total(it); });
    var r = calc(), foto = fotoDe(p, ((p.colores || [])[0] || [""])[0]);
    var tit, txt;
    if (tipo === "limite") {
      tit = "No agregamos “" + esc(p.nombre) + "”";
      txt = "Tu cotización ya tiene " + MAX + " productos distintos, el máximo por solicitud. Envíala y luego puedes armar otra.";
    } else {
      tit = "Agregado a tu cotización (" + n + " un.)";
      txt = tipo === "lleno" ?
        "Listo, quedó agregado. Tu cotización ya tiene " + MAX + " productos distintos, el máximo por solicitud. Envíala y luego puedes armar otra." :
        "Llevas " + u + (u === 1 ? " unidad" : " unidades") + " en total · " + lista.length + " de " + MAX + " productos.";
    }
    agr.className = "uwc-agr" + (tipo === "limite" ? " uwc-agr-limite" : "");
    agr.innerHTML = '<button type="button" class="uwc-agr-x" aria-label="Cerrar">×</button>' +
      (foto ? '<img src="' + esc(foto) + '" alt="">' : "") +
      "<div><b>" + tit + "</b>" + (tipo === "limite" ? "" : "<span>" + esc(p.nombre) + "</span>") + "<p>" + txt + "</p>" +
      (r && r.neto && tipo !== "limite" ? '<p class="uwc-agr-est">Total estimado ' + clp(r.neto) + " + IVA · " + nombreTramo(r.k).toLowerCase() + "</p>" : "") +
      '<div class="uwc-agr-btns"><button type="button" class="btn btn-acento uwc-agr-ver">' + (tipo ? "Enviar mi cotización" : "Ver mi cotización") + "</button>" +
      '<button type="button" class="btn btn-borde uwc-agr-seguir">Seguir cotizando</button></div></div>';
    void agr.offsetWidth;
    agr.classList.add("visible");
    clearTimeout(tAgr);
    tAgr = setTimeout(cerrarAgr, 12000);
    var v = agr.querySelector(".uwc-agr-ver");
    if (v && window.matchMedia("(pointer:fine)").matches) try { v.focus({ preventScroll: true }); } catch (e) {}
  }
  function cerrarAgr() { if (agr) agr.classList.remove("visible"); clearTimeout(tAgr); }

  /* --- Ventana "¿Cuántas unidades?" ------------------------------------------ */
  var dlg, dlgListo = null, dlgAntes = null;
  function pedirCantidad(p, color, actual, listo) {
    if (!dlg) {
      dlg = document.createElement("div");
      dlg.className = "uwc-cant-capa";
      dlg.innerHTML = '<form class="uwc-cant" role="dialog" aria-modal="true" aria-labelledby="uwc-cant-t">' +
        '<div class="uwc-cant-prod"><img alt=""><div><b class="uwc-cant-n"></b><small class="uwc-cant-c"></small></div></div>' +
        '<label id="uwc-cant-t" for="uwc-cant-in">¿Cuántas unidades quieres cotizar?</label>' +
        '<input id="uwc-cant-in" type="number" inputmode="numeric" min="1" step="1" required placeholder="Ej.: 50">' +
        '<div class="uwc-cant-btns"><button type="button" class="btn btn-borde uwc-cant-no">Cancelar</button>' +
        '<button type="submit" class="btn btn-acento">Agregar a mi cotización</button></div></form>';
      document.body.appendChild(dlg);
      var cerrarDlg = function () {
        dlg.classList.remove("abierto"); dlgListo = null;
        if (dlgAntes && dlgAntes.focus) try { dlgAntes.focus({ preventScroll: true }); } catch (e) {}
      };
      dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.closest(".uwc-cant-no")) cerrarDlg(); });
      dlg.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); cerrarDlg(); } });
      dlg.querySelector("form").addEventListener("submit", function (e) {
        e.preventDefault();
        var n = entero(dlg.querySelector("input").value);
        if (!n) { dlg.querySelector("input").focus(); return; }
        var f = dlgListo; cerrarDlg(); if (f) f(n);
      });
    }
    dlgAntes = document.activeElement;
    dlgListo = listo;
    var img = dlg.querySelector("img"), src = fotoDe(p, color);
    img.src = src || ""; img.hidden = !src;
    dlg.querySelector(".uwc-cant-n").textContent = p.nombre;
    dlg.querySelector(".uwc-cant-c").textContent = "Cód. " + (p.sku || "");
    var inp = dlg.querySelector("input");
    inp.value = actual || "";
    dlg.classList.add("abierto");
    setTimeout(function () { inp.focus(); inp.select(); }, 30);
  }
  window.UWCotizador = { agregar: agregar, abrir: function () { abrir(); }, lista: function () { return lista.slice(); } };

  /* --- Interfaz ------------------------------------------------------------- */
  var boton, panel, cuerpo, pieP, toast;
  // Franja fija arriba que avisa al ejecutivo que está en modo cotizador.
  var franja;
  function crearFranja() {
    if (!vendedor) return;
    franja = document.createElement("div");
    franja.className = "uwc-franja";
    franja.setAttribute("role", "status");
    document.body.insertBefore(franja, document.body.firstChild);
    franja.addEventListener("click", function (e) {
      if (e.target.closest(".uwc-franja-salir")) { guardar(CLAVE_V, "0"); location.href = location.pathname; }
    });
    estadoFranja();
  }
  function estadoFranja() {
    if (!franja) return;
    var est = precios ? "Sesión del cotizador activa: ves precios y stock" :
      precios === false && UW.cotizadorUrl ? enlaceSesion("para ver precios y stock") : "Conectando con el cotizador…";
    franja.innerHTML = "<b>MODO COTIZADOR</b><span>" + est + '</span><button type="button" class="uwc-franja-salir">Salir</button>';
  }
  function crear() {
    crearFranja();
    boton = document.createElement("button");
    boton.type = "button";
    boton.className = "uwc-boton";
    boton.setAttribute("aria-label", "Abrir mi cotización");
    boton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4h10l1 3h3v2h-1.2l-1.6 10.4A2 2 0 0 1 16.2 21H7.8a2 2 0 0 1-2-1.6L4.2 9H3V7h3l1-3Zm.6 3h8.8l-.4-1H8l-.4 1Zm-1.4 2 1.5 10h8.6l1.5-10H6.2ZM9 11h2v6H9v-6Zm4 0h2v6h-2v-6Z"/></svg>' +
      '<span class="uwc-boton-txt">Mi cotización</span><b class="uwc-n" hidden>0</b>';
    boton.addEventListener("click", function () { abrir(); });
    document.body.appendChild(boton);

    panel = document.createElement("div");
    panel.className = "uwc-capa";
    panel.innerHTML =
      '<aside class="uwc-panel" role="dialog" aria-modal="true" aria-labelledby="uwc-titulo" tabindex="-1">' +
        '<header class="uwc-cab">' +
          '<div><h2 id="uwc-titulo">Mi cotización</h2>' +
          (vendedor ? '<span class="uwc-modo">Modo vendedor <button type="button" class="uwc-salir">Salir</button></span>' : '<p>Cotiza sin crear cuenta: indica cuántas unidades y si lleva tu logo. Te respondemos en máximo 24 horas.</p>') +
          "</div>" +
          '<button type="button" class="uwc-x" aria-label="Cerrar">×</button>' +
        "</header>" +
        '<div class="uwc-cuerpo"></div>' +
        '<footer class="uwc-pie"></footer>' +
      "</aside>";
    cuerpo = panel.querySelector(".uwc-cuerpo");
    pieP = panel.querySelector(".uwc-pie");
    document.body.appendChild(panel);

    panel.addEventListener("click", function (e) {
      var t = e.target;
      if (t === panel || t.closest(".uwc-x")) return cerrar();
      if (t.closest(".uwc-salir")) { guardar(CLAVE_V, "0"); location.href = location.pathname; return; }
      var linea = t.closest("[data-clave]"), it = linea && buscar(linea.getAttribute("data-clave"));
      if (t.closest(".uwc-quitar") && it) { lista.splice(lista.indexOf(it), 1); persistir(); pintar(); return; }
      if (t.closest(".uwc-vaciar")) { if (window.confirm("¿Vaciar tu cotización?")) { lista = []; persistir(); pintar(); } return; }
      if (t.closest(".uwc-enviar")) return alFormulario();
      if (t.closest(".uwc-copiar")) return copiar(t.closest(".uwc-copiar"));
    });
    panel.addEventListener("input", function (e) {
      var t = e.target, linea = t.closest("[data-clave]"), it = linea && buscar(linea.getAttribute("data-clave"));
      if (t.classList.contains("uwc-obs")) { guardar(CLAVE + "-obs", t.value); actualizarEnlaces(); return; }
      if (!it) return;
      if (t.classList.contains("uwc-total-in")) it.cantidad = entero(t.value);
      else if (t.classList.contains("uwc-logo-in")) it.logo = t.checked;
      persistir();
      var s = linea.querySelector(".uwc-suma");
      if (s) s.textContent = total(it) + " un.";
      resumen();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("abierto")) cerrar();
    });

    toast = document.createElement("div");
    toast.className = "uwc-toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  function buscar(clave) {
    for (var i = 0; i < lista.length; i++) if (lista[i].clave === clave) return lista[i];
    return null;
  }

  // Solo modo vendedor: en la ficha, las tallas muestran las unidades exactas
  // (si hay sesión en el cotizador). En Mi cotización ya no se repite el stock.
  function stockFicha() {
    if (!vendedor || !fichaAbierta) return;
    var caja = fichaAbierta.panel, p = fichaAbierta.producto, t = caja && caja.querySelector(".tx-tallas");
    if (!t || !p) return;
    var nom = caja.querySelector(".tx-color-nombre"), color = nom ? nom.textContent.trim() : fichaAbierta.color;
    var con = false;
    t.querySelectorAll("li").forEach(function (li) {
      var b = li.querySelector("b"), sp = li.querySelector("span"), u = b && unidades(p, color, b.textContent.trim()), txt = null;
      if (u == null || !sp) return;
      if (typeof u === "number") txt = u + " un.";
      else if (/^\+/.test(u)) txt = "Más de " + u.slice(1);
      else if (/^P/.test(u)) txt = "Llega " + u.slice(2, 7);
      if (txt) { sp.textContent = txt; li.title = txt; con = true; }
    });
    var n = t.querySelector(".uwc-stock-nota");
    if (n) n.remove();
    n = document.createElement("small");
    n.className = "uwc-stock-nota";
    if (con) n.textContent = "Unidades exactas" + (stockFecha ? " al " + new Date(stockFecha).toLocaleDateString("es-CL") : "") + " (solo vendedores).";
    else if (stock === false && UW.cotizadorUrl) n.innerHTML = enlaceSesion("para ver las unidades exactas por talla.");
    else return;
    t.appendChild(n);
  }
  function lineaHTML(it) {
    var p = producto(it.id);
    var cant = '<label class="uwc-campo uwc-total">Cantidad total <input class="uwc-total-in" type="number" inputmode="numeric" min="0" step="1" value="' +
      (entero(it.cantidad) || "") + '" placeholder="0"></label>';
    return '<li class="uwc-linea" data-clave="' + esc(it.clave) + '">' +
      '<a class="uwc-foto" href="' + esc(it.url || "#") + '">' + (it.foto ? '<img src="' + esc(it.foto) + '" alt="" loading="lazy">' : "") + "</a>" +
      '<div class="uwc-datos">' +
        '<div class="uwc-nombre"><a href="' + esc(it.url || "#") + '">' + esc(it.nombre) + '</a><small>Cód. ' + esc(it.sku) + "</small></div>" +
        cant +
        '<div class="uwc-fila">' +
          '<label class="uwc-check"><input type="checkbox" class="uwc-logo-in"' + (it.logo ? " checked" : "") + "> Con logo</label>" +
          '<span class="uwc-suma">' + total(it) + " un.</span>" +
          '<button type="button" class="uwc-quitar" aria-label="Quitar ' + esc(it.nombre) + '">Quitar</button>' +
        "</div>" +
        (precios ? '<div class="uwc-lp"></div>' : "") +
      "</div></li>";
  }

  function pintar(foco) {
    if (!panel) return;
    var n = lista.length;
    var badge = boton.querySelector(".uwc-n");
    badge.textContent = n;
    badge.hidden = !n;
    boton.classList.toggle("con-items", n > 0);
    if (!n) {
      cuerpo.innerHTML = '<div class="uwc-vacio"><p><b>Tu cotización está vacía.</b></p>' +
        "<p>Toca <em>+ Cotizar</em> en cualquier modelo, o abre su ficha y presiona <em>Agregar a mi cotización</em>.</p></div>";
      pieP.innerHTML = "";
      return;
    }
    var obs = leer(CLAVE + "-obs") || "";
    cuerpo.innerHTML = '<ul class="uwc-lista">' + lista.map(lineaHTML).join("") + "</ul>" +
      '<label class="uwc-campo uwc-obs-c">Comentarios (opcional)<textarea class="uwc-obs" rows="2" placeholder="Ej.: logo en el pecho izquierdo, entrega antes del 15">' + esc(obs) + "</textarea></label>" +
      (vendedor ? '<div class="uwc-est"></div>' : "");
    pieP.innerHTML =
      '<div class="uwc-resumen"></div>' +
      '<div class="uwc-acciones">' +
        '<button type="button" class="btn btn-acento uwc-enviar">Enviar solicitud de cotización</button>' +
        '<a class="btn btn-wa uwc-wa" target="_blank" rel="noopener">' + (UW.iconWA || "") + " Enviar por WhatsApp</a>" +
        (vendedor ?
          (UW.cotizadorUrl ? '<a class="btn btn-borde uwc-cotizador" target="_blank" rel="noopener">Abrir en el cotizador</a>' : "") +
          '<button type="button" class="btn btn-borde uwc-copiar">Copiar resumen</button>' : "") +
        '<button type="button" class="uwc-link uwc-vaciar">Vaciar cotización</button>' +
      "</div>";
    resumen();
    if (foco) {
      var li = cuerpo.querySelector('[data-clave="' + foco.replace(/"/g, '\\"') + '"]');
      if (li) {
        li.classList.add("uwc-nueva");
        li.scrollIntoView({ block: "nearest" });
        var inp = li.querySelector("input[type=number]");
        if (inp && window.matchMedia("(pointer:fine)").matches) inp.focus({ preventScroll: true });
      }
    }
  }
  function resumen() {
    var r = pieP && pieP.querySelector(".uwc-resumen");
    if (!r) return;
    var u = 0, sinCant = 0;
    lista.forEach(function (it) { var t = total(it); u += t; if (!t) sinCant++; });
 var r0 = calc();
    r.innerHTML = "<span>" + lista.length + " de " + MAX + " productos</span><b>" + u + " unidades</b>" +
      (sinCant ? '<small>Falta la cantidad en ' + sinCant + (sinCant === 1 ? " modelo" : " modelos") + "</small>" : "") +
      (r0 && r0.neto ? '<small class="uwc-res-est">Total estimado ' + clp(r0.neto * 1.19) + " con IVA (" + clp(r0.neto) + " neto)</small>" : "") +
      (lista.length >= MAX ? "<small>Llegaste al máximo de " + MAX + " productos distintos por solicitud.</small>" : "");
    estimado();
    actualizarEnlaces();
  }
  // Solo vendedores con precios: precio por línea y total estimado con IVA.
  function estimado() {
    var e = cuerpo && cuerpo.querySelector(".uwc-est");
    if (!e) return;
    if (!precios) {
      e.innerHTML = vendedor && precios === false && UW.cotizadorUrl ? "<small>" + enlaceSesion("para ver precios y el total estimado.") + "</small>" : "";
      return;
    }
    var r = calc(), L = precios.logo, k = r.k;
    cuerpo.querySelectorAll(".uwc-linea[data-clave]").forEach(function (li) {
      var it = buscar(li.getAttribute("data-clave")), lp = li.querySelector(".uwc-lp"), pr = it && preciosDe(it.sku);
      if (!lp) return;
      if (!pr) { lp.textContent = "Sin precio en el cotizador"; return; }
      var unit = pr[k] + (it.logo ? L[k] : 0);
      lp.innerHTML = "<b>" + clp(unit) + "</b> c/u" + (it.logo ? " (incluye logo " + clp(L[k]) + ")" : "") + " · " + clp(unit * total(it)) + " neto";
    });
    if (!r.neto) { e.innerHTML = "<small>Indica las cantidades para ver el total estimado.</small>"; return; }
    e.innerHTML = "<dl>" +
      "<dt>Tramo</dt><dd>" + nombreTramo(k) + "</dd>" +
      (r.conLogo ? "<dt>Logo bordado 8x3 cm</dt><dd>" + clp(L[k]) + " c/u</dd>" : "") +
      "<dt>Total neto</dt><dd>" + clp(r.neto) + "</dd>" +
      "<dt>IVA 19%</dt><dd>" + clp(r.neto * 0.19) + "</dd>" +
      '<dt class="uwc-est-t">Total estimado</dt><dd class="uwc-est-t">' + clp(r.neto * 1.19) + "</dd></dl>" +
      (r.sig > 0 ? '<p class="uwc-est-sig">Te faltan ' + clp(r.sig) + " netos para el siguiente tramo (" + nombreTramo(k + 1).toLowerCase() + ").</p>" : "") +
      (r.sinPrecio ? "<small>" + r.sinPrecio + (r.sinPrecio === 1 ? " modelo no tiene" : " modelos no tienen") + " precio en el cotizador y no se suma.</small>" : "") +
      "<small>Valores referenciales sin despacho. El precio final lo confirma el cotizador.</small>";
  }

  /* --- Textos de salida ------------------------------------------------------ */
  function texto() {
    var obs = (leer(CLAVE + "-obs") || "").trim(), r = calc();
    return lista.map(function (it) {
      var pr = r && preciosDe(it.sku), unit = pr ? pr[r.k] + (it.logo ? precios.logo[r.k] : 0) : 0;
      return "- " + it.nombre + " (cód. " + it.sku + ")" +
        ": " + (total(it) ? total(it) + " un." : "cantidad por definir") +
        (it.logo ? ", con logo" : ", sin logo") +
        (unit && total(it) ? " · " + clp(unit) + " c/u neto" : "");
    }).join("\n") + (obs ? "\nComentarios: " + obs : "") +
      (r && r.neto ? "\nTotal estimado: " + clp(r.neto) + " neto + IVA = " + clp(r.neto * 1.19) + " (" + nombreTramo(r.k).toLowerCase() + ")" : "");
  }
  function urlCotizador() {
    var base = String(UW.cotizadorUrl || "").replace(/\/+$/, "");
    if (!base) return "";
    return base + "/cotizaciones?" + lista.map(function (it) {
      var det = it.logo ? "Con logo" : "";
      return "p=" + encodeURIComponent(it.sku + "|" + total(it) + "|" + det);
    }).join("&");
  }
  function actualizarEnlaces() {
    var wa = pieP && pieP.querySelector(".uwc-wa");
    if (wa) wa.href = "https://wa.me/" + UW.whatsapp + "?text=" + encodeURIComponent("Hola Uniformeweb, quiero cotizar:\n" + texto());
    var c = pieP && pieP.querySelector(".uwc-cotizador");
    if (c) c.href = urlCotizador();
  }
  function alFormulario() {
    var f = document.getElementById("f-productos");
    if (!f) { location.href = "index.html#cotizar"; return; }
    f.value = texto();
    var logo = document.getElementById("f-logo");
    if (logo && !logo.value) {
      var con = lista.filter(function (it) { return it.logo; }).length;
      logo.value = con === lista.length ? "Sí, todos los productos" : con ? "Sí, en " + con + " de " + lista.length + " productos" : "No";
    }
    cerrar();
    var sec = document.getElementById("cotizar");
    if (sec) sec.scrollIntoView();
    var n = document.getElementById("f-nombre");
    if (n) n.focus({ preventScroll: true });
    aviso("Revisa tus datos y presiona Enviar");
  }
  function copiar(b) {
    var t = texto() + (UW.cotizadorUrl ? "\n" + urlCotizador() : "");
    var listo = function () { b.textContent = "Copiado ✓"; setTimeout(function () { b.textContent = "Copiar resumen"; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(listo, function () { window.prompt("Copia el resumen:", t); });
    else window.prompt("Copia el resumen:", t);
  }

  /* --- Abrir / cerrar -------------------------------------------------------- */
  var antes = null;
  function abrir(foco) {
    // Si la ficha de Texora está abierta, se cierra para no tener dos ventanas encima.
    var ficha = document.querySelector(".tx-ficha.abierto .tx-cerrar");
    if (ficha) ficha.click();
    antes = document.activeElement;
    pintar(foco);
    panel.classList.add("abierto");
    document.documentElement.classList.add("uwc-sin-scroll");
    if (!foco) panel.querySelector(".uwc-panel").focus();
  }
  function cerrar() {
    panel.classList.remove("abierto");
    document.documentElement.classList.remove("uwc-sin-scroll");
    if (antes && antes.focus) try { antes.focus({ preventScroll: true }); } catch (e) {}
  }
  var tAviso;
  function aviso(msg) {
    toast.textContent = msg;
    toast.classList.add("visible");
    clearTimeout(tAviso);
    tAviso = setTimeout(function () { toast.classList.remove("visible"); }, 2400);
  }
  function pulso() {
    boton.classList.remove("pulso");
    void boton.offsetWidth;
    boton.classList.add("pulso");
  }

  /* --- Enganches con las tarjetas y la ficha de Texora ---------------------- */
  function chips(raiz) {
    (raiz || document).querySelectorAll(".tx-card[data-id]").forEach(function (c) {
      if (c.querySelector(".uwc-chip")) return;
      var s = document.createElement("span");
      s.className = "uwc-chip";
      s.setAttribute("role", "button");
      s.setAttribute("tabindex", "0");
      s.setAttribute("aria-label", "Agregar a mi cotización sin abrir la ficha");
      s.textContent = "+ Cotizar";
      // Si la tarjeta entera es un botón, el chip va sobre la foto; si la foto es
      // su propio botón (diseño nuevo), el chip va como hijo directo de la tarjeta.
      var fotoBtn = c.querySelector(".tx-card-img");
      if (c.tagName === "BUTTON" && fotoBtn) fotoBtn.appendChild(s);
      else { s.classList.add("uwc-chip-art"); c.appendChild(s); }
    });
  }
  function chipAccion(e) {
    var s = e.target.closest && e.target.closest(".uwc-chip");
    if (!s) return;
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.stopPropagation();
    var c = s.closest("[data-id]"), p = producto(c && c.getAttribute("data-id"));
    var ic = c && c.getAttribute("data-color"), col = p && ic != null && p.colores && p.colores[+ic];
    agregar(p, col ? col[0] : null, false);
  }
  // Botón "Agregar a mi cotización" de la ficha: si texora.js no llama a
  // UWCotizador.agregar, se intercepta aquí con el producto y color abiertos.
  function botonFicha(e) {
    var b = e.target.closest && e.target.closest(".tx-al-form");
    if (!b || b.hasAttribute("data-uwc-directo")) return;
    var m = location.hash.match(/^#p-(\d+)$/), p = m && producto(m[1]);
    if (!p) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var nom = document.querySelector(".tx-ficha .tx-color-nombre");
    agregar(p, nom ? nom.textContent.trim() : null, true);
  }
  document.addEventListener("uw:agregar", function (e) {
    var d = e.detail || {};
    agregar(d.producto, d.color, d.abrir !== false);
  });

  document.addEventListener("DOMContentLoaded", function () {
    crear();
    pintar();
    cargarStock();
    cargarPrecios();
    document.addEventListener("click", chipAccion, true);
    document.addEventListener("keydown", chipAccion, true);
    document.addEventListener("click", botonFicha, true);
    chips();
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) if (ms[i].addedNodes.length) { chips(); preciosTarjetas(); break; }
    }).observe(document.body, { childList: true, subtree: true });
    if (/[?&]cotizacion=1/.test(location.search) || location.hash === "#mi-cotizacion") abrir();
  });
})();
