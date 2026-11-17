/* =========================================================================
   UNIFORMEWEB · Modo cotizador ("Mi cotización")
   - Cualquier visitante arma su lista con "+ Cotizar" en las tarjetas o
     "Agregar a mi cotización" en la ficha, elige color, cantidad total y logo,
     y la envía por el formulario o por WhatsApp. Las tallas no se piden.
   - Vendedores: abrir el sitio con ?vendedor=1 activa el modo vendedor en ese
     navegador (?vendedor=0 lo apaga). Suma "Abrir en el cotizador" (si
     UW.cotizadorUrl está configurado en config.js), "Copiar resumen" y la
     disponibilidad por talla (stock) de cada modelo, solo como referencia. Si el
     vendedor inició sesión en el cotizador, se ven las unidades exactas (las entrega
     el cotizador privado, nunca el sitio público).
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
        pintar();
      })
      .catch(function () { stock = false; pintar(); });
  }
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
  function agregar(p, color, abrirPanel) {
    if (!p) return;
    color = color || ((p.colores || [])[0] || [""])[0];
    var clave = p.id + "|" + color, existente = null;
    lista.forEach(function (it) { if (it.clave === clave) existente = it; });
    if (!existente) {
      existente = {
        clave: clave, id: p.id, sku: p.sku, nombre: p.nombre, color: color,
        foto: fotoDe(p, color), url: pagina(p), cantidad: 0, logo: true
      };
      lista.push(existente);
    }
    persistir();
    pintar();
    pulso();
    if (abrirPanel !== false) abrir(clave);
    else aviso(p.nombre + (color ? " (" + color.toLowerCase() + ")" : "") + " agregado a tu cotización");
  }
  window.UWCotizador = { agregar: agregar, abrir: function () { abrir(); }, lista: function () { return lista.slice(); } };

  /* --- Interfaz ------------------------------------------------------------- */
  var boton, panel, cuerpo, pieP, toast;
  function crear() {
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
          (vendedor ? '<span class="uwc-modo">Modo vendedor <button type="button" class="uwc-salir">Salir</button></span>' : '<p>Elige color, cantidad y si lleva tu logo. Te respondemos en máximo 24 horas.</p>') +
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
    panel.addEventListener("change", function (e) {
      var t = e.target;
      if (!t.classList.contains("uwc-color")) return;
      var linea = t.closest("[data-clave]"), it = linea && buscar(linea.getAttribute("data-clave"));
      var p = it && producto(it.id);
      if (!p) return;
      var nueva = p.id + "|" + t.value;
      if (buscar(nueva)) { aviso("Ese color ya está en tu cotización"); t.value = it.color; return; }
      it.color = t.value; it.clave = nueva; it.foto = fotoDe(p, t.value);
      persistir(); pintar(nueva);
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

  // Solo modo vendedor: disponibilidad por talla del color elegido (referencia).
  function stockHTML(p, color) {
    var tallas = tallasDe(p, color);
    if (!p || !tallas.length) return "";
    var sinDetalle = !p.det, conUnidades = false;
    var items = tallas.map(function (t) {
      var e = sinDetalle ? (p.disp === "A" ? "A" : "") : estadoTalla(p, color, t);
      var u = unidades(p, color, t), txt = NOMBRE_ESTADO[e] || "Consultar";
      if (u != null) {
        conUnidades = true;
        if (typeof u === "number") { txt = u + " un."; e = u <= 0 ? "A" : u < 20 ? "U" : "D"; }
        else if (/^\+/.test(u)) { txt = "Más de " + u.slice(1); e = "D"; }
        else if (/^P/.test(u)) { txt = "Llega " + u.slice(2, 7); e = "P"; }
      }
      var clase = { D: "disp", U: "ultimas", A: "agotada", P: "proximo" }[e] || "sin";
      return '<li class="uwc-st-' + clase + '" title="' + esc(txt) + '"><b>' + esc(t) + "</b><span>" + esc(txt) + "</span></li>";
    }).join("");
    var nota = conUnidades ? (stockFecha ? '<small class="uwc-stock-nota">Unidades al ' + esc(new Date(stockFecha).toLocaleDateString("es-CL")) + "</small>" : "") :
      stock === false && UW.cotizadorUrl ? '<small class="uwc-stock-nota"><a href="' + esc(String(UW.cotizadorUrl).replace(/\/+$/, "")) + '/login" target="_blank" rel="noopener">Inicia sesión en el cotizador</a> para ver las unidades exactas.</small>' : "";
    return '<div class="uwc-stock"><span class="uwc-stock-tit">Stock' + (color ? " en " + esc(color.toLowerCase()) : "") + "</span><ul>" +
      items + "</ul>" + nota + "</div>";
  }
  function lineaHTML(it) {
    var p = producto(it.id);
    var colores = p && p.colores && p.colores.length > 1 ?
      '<label class="uwc-campo">Color <select class="uwc-color">' + p.colores.map(function (c) {
        return '<option' + (c[0] === it.color ? " selected" : "") + ">" + esc(c[0]) + "</option>";
      }).join("") + "</select></label>" :
      (it.color ? '<span class="uwc-campo">Color <b>' + esc(it.color) + "</b></span>" : "");
    var cant = '<label class="uwc-campo uwc-total">Cantidad total <input class="uwc-total-in" type="number" inputmode="numeric" min="0" step="1" value="' +
      (entero(it.cantidad) || "") + '" placeholder="0"></label>';
    return '<li class="uwc-linea" data-clave="' + esc(it.clave) + '">' +
      '<a class="uwc-foto" href="' + esc(it.url || "#") + '">' + (it.foto ? '<img src="' + esc(it.foto) + '" alt="" loading="lazy">' : "") + "</a>" +
      '<div class="uwc-datos">' +
        '<div class="uwc-nombre"><a href="' + esc(it.url || "#") + '">' + esc(it.nombre) + '</a><small>Cód. ' + esc(it.sku) + "</small></div>" +
        colores + cant + (vendedor ? stockHTML(p, it.color) : "") +
        '<div class="uwc-fila">' +
          '<label class="uwc-check"><input type="checkbox" class="uwc-logo-in"' + (it.logo ? " checked" : "") + "> Con logo</label>" +
          '<span class="uwc-suma">' + total(it) + " un.</span>" +
          '<button type="button" class="uwc-quitar" aria-label="Quitar ' + esc(it.nombre) + '">Quitar</button>' +
        "</div>" +
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
      '<label class="uwc-campo uwc-obs-c">Comentarios (opcional)<textarea class="uwc-obs" rows="2" placeholder="Ej.: logo en el pecho izquierdo, entrega antes del 15">' + esc(obs) + "</textarea></label>";
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
    r.innerHTML = "<span>" + lista.length + (lista.length === 1 ? " modelo" : " modelos") + "</span><b>" + u + " unidades</b>" +
      (sinCant ? '<small>Falta la cantidad en ' + sinCant + (sinCant === 1 ? " modelo" : " modelos") + "</small>" : "");
    actualizarEnlaces();
  }

  /* --- Textos de salida ------------------------------------------------------ */
  function texto() {
    var obs = (leer(CLAVE + "-obs") || "").trim();
    return lista.map(function (it) {
      return "- " + it.nombre + " (cód. " + it.sku + ")" + (it.color ? ", color " + it.color.toLowerCase() : "") +
        ": " + (total(it) ? total(it) + " un." : "cantidad por definir") +
        (it.logo ? ", con logo" : ", sin logo");
    }).join("\n") + (obs ? "\nComentarios: " + obs : "");
  }
  function urlCotizador() {
    var base = String(UW.cotizadorUrl || "").replace(/\/+$/, "");
    if (!base) return "";
    return base + "/cotizaciones?" + lista.map(function (it) {
      var det = [it.color ? "Color " + it.color : "", it.logo ? "Con logo" : ""].filter(Boolean).join("; ");
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
    s.textContent = "✓ Agregado";
    s.classList.add("ok");
    setTimeout(function () { s.textContent = "+ Cotizar"; s.classList.remove("ok"); }, 1600);
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
    document.addEventListener("click", chipAccion, true);
    document.addEventListener("keydown", chipAccion, true);
    document.addEventListener("click", botonFicha, true);
    chips();
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) if (ms[i].addedNodes.length) { chips(); break; }
    }).observe(document.body, { childList: true, subtree: true });
    if (/[?&]cotizacion=1/.test(location.search) || location.hash === "#mi-cotizacion") abrir();
  });
})();
