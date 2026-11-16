/* =========================================================================
   UNIFORMEWEB · Modelos de Texora en las páginas de categoría
   Los datos vienen de data/texora.js, que se actualiza solo cada día
   (scripts/sync-texora.mjs). Normalmente no necesita editar este archivo.
   ========================================================================= */
(function () {
  "use strict";
  var UW = window.UW, DATA = window.TEXORA;
  var IMG = "https://texora.cl/";
  var ESTADOS = {
    D: ["disp", "Disponible"],
    U: ["ultimas", "Últimas unidades"],
    A: ["agotado", "Agotado"],
    P: ["proximo", "Próximamente"]
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function foto(p, id, tam) { return IMG + id + "-" + (tam || "home_default") + "/" + p.slug + ".jpg"; }
  function waLink(texto) { return "https://wa.me/" + UW.whatsapp + "?text=" + encodeURIComponent(texto); }
  function fecha(iso) {
    var d = new Date(iso);
    return isNaN(d) ? "" : ("0" + d.getDate()).slice(-2) + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + d.getFullYear();
  }
  // Estado de una talla: "D", "U", "A" o "P dd-mm-aaaa".
  function estado(v) {
    var k = String(v || "A").charAt(0);
    var e = ESTADOS[k] || ESTADOS.A, texto = e[1];
    if (k === "P") {
      // "P dd-mm-aaaa": si la fecha ya pasó, se muestra solo "Próximamente".
      var f = String(v).slice(2).split("-");
      if (f.length === 3 && new Date(+f[2], +f[1] - 1, +f[0], 23, 59) >= new Date()) texto = "Llega el " + f[0] + "-" + f[1];
    }
    return { clase: e[0], texto: texto, k: k };
  }
  // Disponibilidad general del producto (o de un color).
  function resumen(p, color) {
    if (p.disp === "A") return estado("A");
    var tallas = [];
    if (p.det) Object.keys(p.det).forEach(function (c) {
      if (!color || c === color) Object.keys(p.det[c]).forEach(function (t) { tallas.push(String(p.det[c][t]).charAt(0)); });
    });
    if (!tallas.length) return estado(p.disp);
    var orden = ["D", "U", "P", "A"];
    for (var i = 0; i < orden.length; i++) if (tallas.indexOf(orden[i]) > -1) return estado(orden[i]);
    return estado("A");
  }

  /* --- Tarjetas de la página ------------------------------------------- */
  // Primera foto de un color (o la foto principal si el color no tiene fotos propias).
  function fotoColor(p, i) {
    var l = p.cimg && p.cimg[i] && p.cimg[i].length ? p.cimg[i] : p.img;
    return l[0];
  }
  function detalle(p) {
    var d = [];
    if (p.spec && p.spec.Gramaje) d.push(p.spec.Gramaje.replace(/\s*gramos?/i, " g"));
    if (p.spec && p.spec["Composición"]) d.push(p.spec["Composición"].split(/[.;]/)[0].trim());
    return d.join(" · ");
  }
  function tarjeta(p) {
    var r = resumen(p), cols = p.colores || [], max = 7;
    var puntos = cols.slice(0, max).map(function (c, i) {
      return '<button type="button" class="tx-punto" data-c="' + i + '" aria-pressed="' + (i === 0) + '" aria-label="Ver en ' + esc(c[0]) + '" title="' + esc(c[0]) + '">' +
        '<i style="background:' + esc(c[1] || "#ccc") + '"></i></button>';
    }).join("");
    var mas = cols.length > max ? '<span class="tx-mas-colores">+' + (cols.length - max) + "</span>" : "";
    var seg = p.img[1] && !(p.cimg && p.cimg[0] && p.cimg[0].length < 2) ? (p.cimg && p.cimg[0] ? p.cimg[0][1] : p.img[1]) : 0;
    return '<article class="tx-card" data-id="' + p.id + '">' +
      '<button type="button" class="tx-card-img tx-ver" aria-label="Ver ficha de ' + esc(p.nombre) + '">' +
        '<img class="tx-img1" loading="lazy" src="' + foto(p, fotoColor(p, 0)) + '" alt="' + esc(p.nombre) + '">' +
        (seg ? '<img class="tx-img2" loading="lazy" src="' + foto(p, seg) + '" alt="" aria-hidden="true">' : "") +
        '<span class="tx-estado tx-' + r.clase + '">' + esc(r.texto) + "</span>" +
        (p.genero ? '<span class="tx-genero">' + esc(p.genero) + "</span>" : "") +
      "</button>" +
      '<div class="tx-card-txt">' +
        '<h3><button type="button" class="tx-ver">' + esc(p.nombre) + "</button></h3>" +
        '<p class="tx-cod">Cód. ' + esc(p.sku) + (detalle(p) ? " · " + esc(detalle(p)) : "") + "</p>" +
        (puntos ? '<div class="tx-puntos">' + puntos + mas + '<span class="tx-color-actual">' + esc(cols[0][0]) + "</span></div>" : "") +
        '<button type="button" class="tx-ver tx-ver-mas">Ver colores y tallas <span aria-hidden="true">→</span></button>' +
      "</div></article>";
  }
  // Cambia la foto de la tarjeta al color elegido.
  function colorTarjeta(card, p, i) {
    card.setAttribute("data-color", i);
    card.querySelectorAll(".tx-punto").forEach(function (b) { b.setAttribute("aria-pressed", +b.getAttribute("data-c") === i); });
    var im = card.querySelector(".tx-img1"), src = foto(p, fotoColor(p, i));
    if (im.getAttribute("src") !== src) {
      im.classList.add("tx-cambiando");
      var pre = new Image();
      pre.onload = pre.onerror = function () { im.src = src; im.classList.remove("tx-cambiando"); };
      pre.src = src;
    }
    var l = p.cimg && p.cimg[i] && p.cimg[i].length ? p.cimg[i] : p.img, im2 = card.querySelector(".tx-img2");
    if (im2) { if (l[1]) { im2.src = foto(p, l[1]); im2.hidden = false; } else im2.hidden = true; }
    var t = card.querySelector(".tx-color-actual");
    if (t) t.textContent = p.colores[i][0];
  }

  function pagina() {
    var id = document.body.getAttribute("data-categoria");
    var gal = document.getElementById("galeria");
    if (!DATA || !id || !gal) return;
    var lista = DATA.productos.filter(function (p) { return p.pagina === id; });
    if (!lista.length) return;
    var generos = [];
    lista.forEach(function (p) { if (p.genero && generos.indexOf(p.genero) < 0) generos.push(p.genero); });
    var nombre = (document.querySelector(".cabecera-cat h1") || {}).textContent || "Modelos";
    var cont = document.createElement("div");
    cont.className = "tx-seccion";
    cont.innerHTML =
      '<div class="tx-cabecera">' +
        '<h2 class="titular"><span class="t-azul">' + esc(nombre) + ' para tu equipo</span><span class="t-morado">Con tu logo bordado o estampado</span></h2>' +
        '<p class="tx-intro">Elige un modelo y un color para ver sus fotos, tallas y ficha técnica. <b>' + lista.length + " modelos</b> con stock actualizado el " + fecha(DATA.actualizado) + ".</p>" +
        (generos.length > 1 ? '<div class="tx-filtros" role="group" aria-label="Filtrar por género"><button type="button" aria-pressed="true" data-g="">Todos</button>' +
          generos.sort().map(function (g) { return '<button type="button" aria-pressed="false" data-g="' + esc(g) + '">' + esc(g) + "</button>"; }).join("") + "</div>" : "") +
      "</div>" +
      '<div class="tx-grid">' + lista.map(tarjeta).join("") + "</div>" +
      (gal.querySelector(".galeria-titulo") || !gal.children.length ? "" : '<h2 class="galeria-titulo tx-otros">Más modelos</h2>');
    gal.parentNode.insertBefore(cont, gal);
    var porId = {};
    lista.forEach(function (p) { porId[p.id] = p; });
    cont.addEventListener("click", function (e) {
      var card = e.target.closest(".tx-card"), p = card && porId[card.getAttribute("data-id")];
      var punto = e.target.closest(".tx-punto");
      if (punto && p) return colorTarjeta(card, p, +punto.getAttribute("data-c"));
      if (e.target.closest(".tx-ver") && p) return abrir(p, +(card.getAttribute("data-color") || 0));
      var f = e.target.closest("[data-g]");
      if (f) {
        var g = f.getAttribute("data-g");
        cont.querySelectorAll("[data-g]").forEach(function (x) { x.setAttribute("aria-pressed", x === f); });
        cont.querySelectorAll(".tx-card").forEach(function (c) {
          var q = porId[c.getAttribute("data-id")];
          c.hidden = !!g && q.genero !== g && q.genero !== "Unisex";
        });
      }
    });
    // Con el mouse, pasar sobre un color también cambia la foto (como en texora.cl).
    cont.addEventListener("mouseover", function (e) {
      var punto = e.target.closest(".tx-punto"), card = punto && punto.closest(".tx-card");
      if (card) colorTarjeta(card, porId[card.getAttribute("data-id")], +punto.getAttribute("data-c"));
    });
    var m = location.hash.match(/^#p-(\d+)$/);
    if (m && porId[m[1]]) abrir(porId[m[1]]);
  }

  /* --- Ficha del producto ---------------------------------------------- */
  var caja, actual, colorSel;
  function crearCaja() {
    caja = document.createElement("div");
    caja.className = "tx-ficha";
    caja.setAttribute("role", "dialog");
    caja.setAttribute("aria-modal", "true");
    caja.innerHTML = '<div class="tx-panel" tabindex="-1"><button type="button" class="tx-cerrar" aria-label="Cerrar">×</button><div class="tx-cuerpo"></div></div>' +
      '<div class="tx-guia" hidden><button type="button" class="tx-cerrar" aria-label="Cerrar guía de tallas">×</button><img alt="Guía de tallas"></div>';
    caja.addEventListener("click", function (e) {
      var t = e.target;
      if (t.closest(".tx-guia")) { caja.querySelector(".tx-guia").hidden = true; return; }
      if (t === caja || t.classList.contains("tx-cerrar")) return cerrar();
      var c = t.closest("[data-color]");
      if (c) return elegirColor(+c.getAttribute("data-color"));
      var th = t.closest("[data-foto]");
      if (th) return verFoto(+th.getAttribute("data-foto"));
      if (t.closest(".tx-ver-guia")) {
        var g = caja.querySelector(".tx-guia");
        g.querySelector("img").src = actual.guia;
        g.hidden = false;
        return;
      }
      if (t.closest(".tx-al-form")) return alFormulario();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !caja.classList.contains("abierto")) return;
      var g = caja.querySelector(".tx-guia");
      if (!g.hidden) g.hidden = true; else cerrar();
    });
    document.body.appendChild(caja);
  }
  function abrir(p, color) {
    if (!p) return;
    if (!caja) crearCaja();
    actual = p;
    var specs = [["Código", p.sku], ["Género", p.genero]];
    Object.keys(p.spec || {}).forEach(function (k) { specs.push([k, p.spec[k]]); });
    if (!p.det && p.tallas) specs.push(["Tallas", /^\d+$/.test(p.tallas) ? "Numeración hasta " + p.tallas : "Desde S hasta " + p.tallas]);
    caja.querySelector(".tx-cuerpo").innerHTML =
      '<div class="tx-fotos"><div class="tx-foto"><img alt=""></div><div class="tx-miniaturas"></div></div>' +
      '<div class="tx-info">' +
        "<h2>" + esc(p.nombre) + "</h2>" +
        (p.desc ? '<p class="tx-desc">' + esc(p.desc) + "</p>" : "") +
        ((p.colores || []).length ? '<h3>Color: <span class="tx-color-nombre"></span></h3><div class="tx-colores">' +
          p.colores.map(function (c, i) { return '<button type="button" data-color="' + i + '" title="' + esc(c[0]) + '" aria-label="' + esc(c[0]) + '"><i style="background:' + esc(c[1] || "#ccc") + '"></i></button>'; }).join("") + "</div>" : "") +
        '<div class="tx-tallas"></div>' +
        '<div class="tx-enlaces">' +
          (p.guia ? '<button type="button" class="tx-link tx-ver-guia">Ver guía de tallas</button>' : "") +
          (p.ficha ? '<a class="tx-link" href="' + esc(p.ficha) + '" target="_blank" rel="noopener">Ficha técnica (PDF)</a>' : "") +
        "</div>" +
        '<div class="tx-cta"><a class="btn btn-wa tx-wa" target="_blank" rel="noopener">' + (UW.iconWA || "") + " Cotizar por WhatsApp</a>" +
          '<button type="button" class="btn btn-acento tx-al-form">Agregar a mi cotización</button></div>' +
        '<table class="tx-specs">' + specs.filter(function (s) { return s[1]; }).map(function (s) { return "<tr><th>" + esc(s[0]) + "</th><td>" + esc(s[1]) + "</td></tr>"; }).join("") + "</table>" +
        ((p.atributos || []).length ? '<ul class="tx-atributos">' + p.atributos.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>" : "") +
        ((p.texto || []).length ? '<details class="tx-mas"><summary>Descripción completa</summary>' + p.texto.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") + "</details>" : "") +
      "</div>";
    caja.querySelector(".tx-guia").hidden = true;
    elegirColor(color || 0);
    caja.classList.add("abierto");
    document.documentElement.classList.add("tx-sin-scroll");
    caja.querySelector(".tx-panel").scrollTop = 0;
    caja.querySelector(".tx-panel").focus();
    if (history.replaceState) history.replaceState(null, "", "#p-" + p.id);
  }
  function cerrar() {
    caja.classList.remove("abierto");
    document.documentElement.classList.remove("tx-sin-scroll");
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
  }
  function fotosDe(i) {
    var p = actual;
    return p.cimg && p.cimg[i] && p.cimg[i].length ? p.cimg[i] : p.img;
  }
  function elegirColor(i) {
    var p = actual, c = (p.colores || [])[i];
    colorSel = c ? c[0] : "";
    caja.querySelectorAll("[data-color]").forEach(function (b) { b.setAttribute("aria-pressed", +b.getAttribute("data-color") === i); });
    var nom = caja.querySelector(".tx-color-nombre");
    if (nom) nom.textContent = colorSel;
    var lista = fotosDe(i);
    caja.querySelector(".tx-miniaturas").innerHTML = lista.length > 1 ? lista.map(function (id, k) {
      return '<button type="button" data-foto="' + k + '" aria-label="Foto ' + (k + 1) + '"><img src="' + foto(p, id, "small_default") + '" alt=""></button>';
    }).join("") : "";
    verFoto(0);
    // Tallas y disponibilidad del color elegido.
    var t = caja.querySelector(".tx-tallas"), det = p.det && (p.det[colorSel] || p.det[Object.keys(p.det)[0]]);
    if (det && Object.keys(det).length) {
      t.innerHTML = "<h3>Tallas" + (colorSel ? " en " + esc(colorSel.toLowerCase()) : "") + "</h3><ul>" + Object.keys(det).map(function (talla) {
        var e = estado(p.disp === "A" ? "A" : det[talla]);
        return '<li class="tx-' + e.clase + '" title="' + esc(e.texto) + '"><b>' + esc(talla) + "</b><span>" + esc(e.texto) + "</span></li>";
      }).join("") + "</ul>" +
        (p.detFecha && p.detFecha < String(DATA.actualizado).slice(0, 10) ? '<p class="tx-nota-tallas">Disponibilidad por talla al ' + fecha(p.detFecha + "T12:00:00") + '. Te confirmamos el stock al cotizar.</p>' : "");
    } else {
      var r = resumen(p);
      t.innerHTML = '<span class="tx-estado tx-' + r.clase + '">' + esc(r.texto) + "</span>";
    }
    var msg = "Hola Uniformeweb, quiero cotizar " + p.nombre + " (cód. " + p.sku + ")" + (colorSel ? ", color " + colorSel.toLowerCase() : "") + ", con mi logo. " +
      location.href.split("#")[0] + "#p-" + p.id;
    caja.querySelector(".tx-wa").href = waLink(msg);
    // Aviso para otros módulos (por ejemplo el modo cotizador).
    try {
      document.dispatchEvent(new CustomEvent("uw:ficha", { detail: { producto: p, color: colorSel, panel: caja.querySelector(".tx-info") } }));
    } catch (e) { /* navegadores muy antiguos */ }
  }
  function verFoto(k) {
    var p = actual, lista = fotosDe(Math.max(0, (p.colores || []).map(function (c) { return c[0]; }).indexOf(colorSel)));
    var im = caja.querySelector(".tx-foto img");
    if (!lista.length) { im.removeAttribute("src"); return; }
    var src = foto(p, lista[k] || lista[0], "large_default");
    if (im.getAttribute("src") !== src) {
      im.classList.add("tx-cambiando");
      var pre = new Image();
      pre.onload = pre.onerror = function () { im.src = src; im.classList.remove("tx-cambiando"); };
      pre.src = src;
    }
    im.alt = p.nombre + (colorSel ? " color " + colorSel : "");
    caja.querySelectorAll("[data-foto]").forEach(function (b) { b.setAttribute("aria-current", +b.getAttribute("data-foto") === k); });
  }
  // Agrega el producto al campo "Productos" del formulario del pie y lleva al formulario.
  function alFormulario() {
    if (window.UWCotizador && typeof window.UWCotizador.agregar === "function") {
      window.UWCotizador.agregar(actual, colorSel);
      cerrar();
      return;
    }
    var f = document.getElementById("f-productos");
    if (!f) { location.href = "index.html#cotizar"; return; }
    var linea = "- " + actual.nombre + " (cód. " + actual.sku + ")" + (colorSel ? ", color " + colorSel.toLowerCase() : "") + ": cantidad y tallas: ";
    f.value = (f.value ? f.value.replace(/\s*$/, "") + "\n" : "") + linea;
    cerrar();
    document.getElementById("cotizar").scrollIntoView();
    f.focus();
    f.setSelectionRange(f.value.length, f.value.length);
  }

  document.addEventListener("DOMContentLoaded", pagina);
})();
