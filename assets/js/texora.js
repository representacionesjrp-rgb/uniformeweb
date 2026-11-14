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
  function tarjeta(p) {
    var r = resumen(p);
    var puntos = (p.colores || []).slice(0, 8).map(function (c) {
      return '<i style="background:' + esc(c[1] || "#ccc") + '" title="' + esc(c[0]) + '"></i>';
    }).join("");
    var mas = (p.colores || []).length > 8 ? '<small>+' + (p.colores.length - 8) + "</small>" : "";
    return '<button type="button" class="tx-card" data-id="' + p.id + '">' +
      '<span class="tx-card-img"><img loading="lazy" src="' + foto(p, p.img[0]) + '" alt="' + esc(p.nombre) + '"></span>' +
      '<span class="tx-card-txt">' +
        '<strong>' + esc(p.nombre) + "</strong>" +
        '<small class="tx-cod">Cód. ' + esc(p.sku) + "</small>" +
        (puntos ? '<span class="tx-puntos">' + puntos + mas + "</span>" : "") +
        '<span class="tx-estado tx-' + r.clase + '">' + esc(r.texto) + "</span>" +
      "</span></button>";
  }

  function pagina() {
    var id = document.body.getAttribute("data-categoria");
    var gal = document.getElementById("galeria");
    if (!DATA || !id || !gal) return;
    var lista = DATA.productos.filter(function (p) { return p.pagina === id; });
    if (!lista.length) return;
    var generos = [];
    lista.forEach(function (p) { if (p.genero && generos.indexOf(p.genero) < 0) generos.push(p.genero); });
    var cont = document.createElement("div");
    cont.className = "tx-seccion";
    cont.innerHTML =
      '<h2 class="galeria-titulo">Modelos disponibles</h2>' +
      '<p class="tx-intro">Toca un modelo para ver su ficha técnica, colores, tallas y disponibilidad. Todos se pueden bordar o estampar con tu logo. ' +
        '<span class="tx-fecha">Disponibilidad actualizada el ' + fecha(DATA.actualizado) + ".</span></p>" +
      (generos.length > 1 ? '<div class="tx-filtros" role="group" aria-label="Filtrar por género"><button type="button" aria-pressed="true" data-g="">Todos</button>' +
        generos.sort().map(function (g) { return '<button type="button" aria-pressed="false" data-g="' + esc(g) + '">' + esc(g) + "</button>"; }).join("") + "</div>" : "") +
      '<div class="tx-grid">' + lista.map(tarjeta).join("") + "</div>" +
      (gal.querySelector(".galeria-titulo") || !gal.children.length ? "" : '<h2 class="galeria-titulo tx-otros">Más modelos</h2>');
    gal.parentNode.insertBefore(cont, gal);
    var porId = {};
    lista.forEach(function (p) { porId[p.id] = p; });
    cont.addEventListener("click", function (e) {
      var b = e.target.closest(".tx-card");
      if (b) return abrir(porId[b.getAttribute("data-id")]);
      var f = e.target.closest("[data-g]");
      if (f) {
        var g = f.getAttribute("data-g");
        cont.querySelectorAll("[data-g]").forEach(function (x) { x.setAttribute("aria-pressed", x === f); });
        cont.querySelectorAll(".tx-card").forEach(function (c) {
          var p = porId[c.getAttribute("data-id")];
          c.hidden = !!g && p.genero !== g && p.genero !== "Unisex";
        });
      }
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
  function abrir(p) {
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
    elegirColor(0);
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
  }
  function verFoto(k) {
    var p = actual, lista = fotosDe(Math.max(0, (p.colores || []).map(function (c) { return c[0]; }).indexOf(colorSel)));
    var im = caja.querySelector(".tx-foto img");
    if (!lista.length) { im.removeAttribute("src"); return; }
    im.src = foto(p, lista[k] || lista[0], "large_default");
    im.alt = p.nombre + (colorSel ? " color " + colorSel : "");
    caja.querySelectorAll("[data-foto]").forEach(function (b) { b.setAttribute("aria-current", +b.getAttribute("data-foto") === k); });
  }
  // Agrega el producto al campo "Productos" del formulario del pie y lleva al formulario.
  function alFormulario() {
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
