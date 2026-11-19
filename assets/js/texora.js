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
  // Fotos de las tarjetas: el navegador elige el tamaño según el ancho de la tarjeta y la
  // densidad de la pantalla, para que no se vean borrosas (home_default mide solo 280 px).
  var TAM_TARJETA = "(max-width: 860px) 50vw, (max-width: 1200px) 33vw, 420px";
  function fotoSet(p, id) {
    return foto(p, id, "medium_default") + " 370w, " + foto(p, id, "large_default") + " 700w";
  }
  // Color de las bolitas. Texora no entrega código de color para los bicolores ni para
  // algunos colores (usa una imagen de textura), así que se deduce del nombre:
  // "Naranjo/gris Oscuro" se pinta mitad naranjo y mitad gris oscuro.
  var PALETA = {
    "amarillo": "#fffa08", "naranjo": "#f39c11", "rojo": "#e12f31", "rojo minero": "#b30007",
    "burdeo": "#7e1733", "azul": "#032089", "azul marino": "#032089", "azul noche": "#001436",
    "azul piedra": "#002f5f", "azul stone": "#3b5a7a", "stone": "#3b5a7a", "azul royal": "#1f4fd1",
    "royal": "#1f4fd1", "azulino": "#0b38db", "azul indigo": "#2e3f7f", "azul claro": "#7fb3e6",
    "celeste": "#84ddff", "celeste claro": "#b2eaff", "celeste oscuro": "#84ddff",
    "negro": "#000000", "blanco": "#ffffff", "gris": "#b0afb5", "gris claro": "#d4d4d8",
    "gris oscuro": "#333333", "gris azulado": "#3f3f4a", "beige": "#ffefb8", "khaki": "#c5ac8d",
    "taupe": "#8b7d6b", "brown": "#8b4513", "marron": "#8b4513", "marron claro": "#aa8168",
    "verde": "#2e7d32", "verde musgo": "#313c27", "verde pino": "#2b5700", "army": "#4b5320", "moss": "#5b6236"
  };
  function tonoNombre(n) {
    n = String(n || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim()
      .replace(/\boscu?r?o?\b\.?/g, "oscuro").replace(/\bcl\b\.?/g, "claro");
    return PALETA[n] || PALETA[n.split(" ")[0]] || "";
  }
  function fondoColor(c) {
    var partes = String(c[0] || "").split("/").map(tonoNombre);
    if (partes.length > 1 && partes.every(Boolean)) {
      var paso = 100 / partes.length;
      return "linear-gradient(135deg," + partes.map(function (h, k) { return h + " " + Math.round(k * paso) + "% " + Math.round((k + 1) * paso) + "%"; }).join(",") + ")";
    }
    return c[1] || partes[0] || "#ccc";
  }
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
  // Colores sin foto propia en Texora (su foto es la de otro color): se muestra la foto
  // principal con el aviso "foto referencial" en vez de una foto de otro color.
  function referencial(p, i) { return !!(p.cref && p.cref.indexOf(i) > -1); }
  function fotosColor(p, i) {
    return !referencial(p, i) && p.cimg && p.cimg[i] && p.cimg[i].length ? p.cimg[i] : p.img;
  }
  function fotoColor(p, i) { return fotosColor(p, i)[0]; }
  // La tarjeta parte en el primer color que tiene foto propia.
  function colorInicial(p) {
    for (var i = 0; i < (p.colores || []).length; i++) if (!referencial(p, i)) return i;
    return 0;
  }
  function nombreColor(p, i) { return p.colores[i][0] + (referencial(p, i) ? " · foto referencial" : ""); }
  function detalle(p) {
    var d = [];
    if (p.spec && p.spec.Gramaje) d.push(p.spec.Gramaje.replace(/\s*gramos?/i, " g"));
    if (p.spec && p.spec["Composición"]) d.push(p.spec["Composición"].split(/[.;]/)[0].trim());
    return d.join(" · ");
  }
  function tarjeta(p) {
    var r = resumen(p), cols = p.colores || [], max = 7, c0 = colorInicial(p), f0 = fotosColor(p, c0);
    var puntos = cols.slice(0, max).map(function (c, i) {
      return '<button type="button" class="tx-punto" data-c="' + i + '" aria-pressed="' + (i === c0) + '" aria-label="Ver en ' + esc(c[0]) + '" title="' + esc(c[0]) + '">' +
        '<i style="background:' + esc(fondoColor(c)) + '"></i></button>';
    }).join("");
    var mas = cols.length > max ? '<span class="tx-mas-colores">+' + (cols.length - max) + "</span>" : "";
    return '<article class="tx-card" data-id="' + p.id + '" data-color="' + c0 + '">' +
      '<button type="button" class="tx-card-img tx-ver" aria-label="Ver ficha de ' + esc(p.nombre) + '">' +
        '<img class="tx-img1" loading="lazy" src="' + foto(p, f0[0], "large_default") + '" srcset="' + fotoSet(p, f0[0]) + '" sizes="' + TAM_TARJETA + '" alt="' + esc(p.nombre) + '">' +
        '<span class="tx-estado tx-' + r.clase + '">' + esc(r.texto) + "</span>" +
        (p.genero ? '<span class="tx-genero">' + esc(p.genero) + "</span>" : "") +
      "</button>" +
      '<div class="tx-card-txt">' +
        '<h3><button type="button" class="tx-ver">' + esc(p.nombre) + "</button></h3>" +
        '<p class="tx-cod">Cód. ' + esc(p.sku) + (detalle(p) ? " · " + esc(detalle(p)) : "") + "</p>" +
        (puntos ? '<div class="tx-puntos">' + puntos + mas + '<span class="tx-color-actual">' + esc(nombreColor(p, c0)) + "</span></div>" : "") +
        '<button type="button" class="tx-ver tx-ver-mas">Ver colores y tallas <span aria-hidden="true">→</span></button>' +
      "</div></article>";
  }
  // Cambia la foto de la tarjeta al color elegido.
  function colorTarjeta(card, p, i) {
    card.setAttribute("data-color", i);
    card.querySelectorAll(".tx-punto").forEach(function (b) { b.setAttribute("aria-pressed", +b.getAttribute("data-c") === i); });
    var id = fotoColor(p, i), im = card.querySelector(".tx-img1"), src = foto(p, id, "large_default"), set = fotoSet(p, id);
    if (im.getAttribute("src") !== src) {
      im.classList.add("tx-cambiando");
      var pre = new Image();
      pre.sizes = TAM_TARJETA;
      pre.onload = pre.onerror = function () { im.srcset = set; im.src = src; im.classList.remove("tx-cambiando"); };
      pre.srcset = set;
      pre.src = src;
    }
    var t = card.querySelector(".tx-color-actual");
    if (t) t.textContent = nombreColor(p, i);
  }

  // Tipos de producto de cada página, en el orden de texora.cl. Se arman con las subcategorías
  // que la sincronización lee de Texora (campo "sub"), así que se mantienen solos al actualizar el
  // catálogo. Un tipo sin modelos no aparece. "Ropa técnica" junta ignífuga, antiestática y antiácida.
  var TECNICA = ["Ignífuga", "Antiestática", "Antiácida"];
  var TIPOS = {
    pantalones: [["Cargo"], ["Jeans"], ["Ejecutivo"], ["Outwork"], ["Térmicos", "Térmico"], ["Softshell"], ["Alta visibilidad"], [TECNICA, "Ropa técnica"]],
    parkas: [["Térmicas"], ["3 en 1"], ["Impermeable", "Impermeables"], ["Alta visibilidad"], [TECNICA, "Ropa técnica"]],
    poleras: [["Poleras polo", "Polo"], ["Poleras", "Poleras"], ["Primeras capas"], ["Alta visibilidad"], [TECNICA, "Ropa técnica"]],
    camisas: [["Camisas"], ["Blusas"], [TECNICA, "Ropa técnica"]],
    softshell: [["Térmicas"], ["Impermeable"], ["Alta visibilidad"]],
    micropolar: [["Alta visibilidad"]],
    epp: [["Overoles"], ["Chalecos geólogo", "Chalecos geólogo"], ["Alta visibilidad"], [TECNICA, "Ropa técnica"]],
    jockeys: [["Jockeys"], ["Gorros"], ["Bandanas"]]
  };
  function tiposDe(id, lista) {
    return (TIPOS[id] || []).map(function (d) {
      var subs = [].concat(d[0]);
      return { nombre: d[1] || subs[0], es: function (p) { return (p.sub || []).some(function (s) { return subs.indexOf(s) > -1; }); } };
    }).filter(function (t) {
      // Solo sirve si separa algo: al menos un modelo, y no todos.
      var n = lista.filter(t.es).length;
      return n > 0 && n < lista.length;
    });
  }

  function pagina() {
    var id = document.body.getAttribute("data-categoria");
    var gal = document.getElementById("galeria");
    if (!DATA || !id || !gal) return;
    var lista = DATA.productos.filter(function (p) { return p.pagina === id; });
    if (!lista.length) return;
    var generos = [];
    lista.forEach(function (p) { if (p.genero && generos.indexOf(p.genero) < 0) generos.push(p.genero); });
    var tipos = tiposDe(id, lista);
    var nombre = (document.querySelector(".cabecera-cat h1") || {}).textContent || "Modelos";
    var cont = document.createElement("div");
    cont.className = "tx-seccion";
    cont.innerHTML =
      '<div class="tx-cabecera">' +
        '<h2 class="titular"><span class="t-azul">' + esc(nombre) + ' para tu equipo</span><span class="t-morado">Con tu logo bordado o estampado</span></h2>' +
        '<p class="tx-intro">Elige un modelo y un color para ver sus fotos, tallas y ficha técnica. <b>' + lista.length + " modelos</b> con stock actualizado el " + fecha(DATA.actualizado) + ".</p>" +
        (generos.length > 1 ? '<div class="tx-filtros" role="group" aria-label="Filtrar por género"><button type="button" aria-pressed="true" data-g="">Todos</button>' +
          generos.sort().map(function (g) { return '<button type="button" aria-pressed="false" data-g="' + esc(g) + '">' + esc(g) + "</button>"; }).join("") + "</div>" : "") +
        (tipos.length ? '<div class="tx-tipos" role="group" aria-label="Filtrar por tipo"><button type="button" aria-pressed="true" data-t="">Todos los tipos</button>' +
          tipos.map(function (t, i) { return '<button type="button" aria-pressed="false" data-t="' + (i + 1) + '">' + esc(t.nombre) + ' <span class="tx-tipo-n"></span></button>'; }).join("") + "</div>" : "") +
      "</div>" +
      '<p class="tx-vacio" hidden>No hay modelos de este tipo para la opción elegida. Prueba con «Todos».</p>' +
      '<div class="tx-grid">' + lista.map(tarjeta).join("") + "</div>";
    gal.parentNode.insertBefore(cont, gal);
    // Las fotos antiguas de config.js ("Más modelos") ya no se muestran
    // cuando la página tiene modelos de Texora.
    gal.hidden = true;
    var porId = {};
    lista.forEach(function (p) { porId[p.id] = p; });
    cont.addEventListener("click", function (e) {
      var card = e.target.closest(".tx-card"), p = card && porId[card.getAttribute("data-id")];
      var punto = e.target.closest(".tx-punto");
      if (punto && p) return colorTarjeta(card, p, +punto.getAttribute("data-c"));
      if (e.target.closest(".tx-ver") && p) return abrir(p, +(card.getAttribute("data-color") || 0));
      var f = e.target.closest("[data-g]");
      if (f) {
        filtro.g = f.getAttribute("data-g");
        cont.querySelectorAll("[data-g]").forEach(function (x) { x.setAttribute("aria-pressed", x === f); });
        filtrar();
      }
      var t = e.target.closest("[data-t]");
      if (t) {
        filtro.t = t.getAttribute("data-t");
        cont.querySelectorAll("[data-t]").forEach(function (x) { x.setAttribute("aria-pressed", x === t); });
        filtrar();
      }
    });
    // Filtros combinados: género (Todos/Hombre/Mujer) y tipo (Cargo, Jeans…, como en texora.cl).
    var filtro = { g: "", t: "" };
    function pasaGenero(q) { return !filtro.g || q.genero === filtro.g || q.genero === "Unisex"; }
    function filtrar() {
      var tipo = filtro.t ? tipos[filtro.t - 1] : null, visibles = 0;
      cont.querySelectorAll(".tx-card").forEach(function (c) {
        var q = porId[c.getAttribute("data-id")];
        c.hidden = !pasaGenero(q) || (tipo && !tipo.es(q));
        if (!c.hidden) visibles++;
      });
      // Cada tipo muestra cuántos modelos tiene con el género elegido; los que quedan en 0 se ocultan.
      cont.querySelectorAll("[data-t]").forEach(function (b) {
        var i = +b.getAttribute("data-t");
        if (!i) return;
        var n = lista.filter(function (q) { return pasaGenero(q) && tipos[i - 1].es(q); }).length;
        b.querySelector(".tx-tipo-n").textContent = n;
        b.hidden = !n && filtro.t !== String(i);
      });
      cont.querySelector(".tx-vacio").hidden = visibles > 0;
    }
    if (tipos.length) filtrar();
    // Con el mouse, pasar sobre un color también cambia la foto (como en texora.cl).
    cont.addEventListener("mouseover", function (e) {
      var punto = e.target.closest(".tx-punto"), card = punto && punto.closest(".tx-card");
      if (card) colorTarjeta(card, porId[card.getAttribute("data-id")], +punto.getAttribute("data-c"));
    });
    var m = location.hash.match(/^#p-(\d+)$/);
    if (m && porId[m[1]]) abrir(porId[m[1]]);
  }

  /* --- Versión hombre / mujer ------------------------------------------ */
  // Los modelos que Texora tiene en versión hombre y mujer (mismo nombre, salvo la
  // palabra "Hombre"/"Mujer") se enlazan para cambiar de versión dentro de la misma
  // ficha, como en laropa.cl. Se arma solo con los datos; no hay que editar nada.
  var parejas = null;
  function clavePareja(p) {
    return String(p.nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\b(hombre|mujer)\b/g, " ").replace(/[^a-z0-9%]+/g, " ").trim();
  }
  function pareja(p) {
    if (!parejas) {
      parejas = {};
      var grupos = {};
      ((DATA && DATA.productos) || []).forEach(function (q) {
        if (q.genero !== "Hombre" && q.genero !== "Mujer") return;
        var k = clavePareja(q);
        (grupos[k] = grupos[k] || []).push(q);
      });
      Object.keys(grupos).forEach(function (k) {
        var g = grupos[k];
        // Solo pares claros: exactamente un modelo de hombre y uno de mujer.
        if (g.length === 2 && g[0].genero !== g[1].genero) { parejas[g[0].id] = g[1]; parejas[g[1].id] = g[0]; }
      });
    }
    return parejas[p.id] || null;
  }
  // Al cambiar de versión se mantiene el color elegido si la otra versión lo tiene.
  function colorEquivalente(q, nombre) {
    var n = String(nombre || "").toLowerCase().trim();
    var cols = (q.colores || []).map(function (c) { return String(c[0]).toLowerCase().trim(); });
    var i = n ? cols.indexOf(n) : -1;
    return i > -1 ? i : null;
  }
  function selectorVersion(p) {
    var q = pareja(p);
    if (!q) return "";
    var h = p.genero === "Hombre" ? p : q, m = p.genero === "Hombre" ? q : p;
    return '<div class="tx-gswitch" role="group" aria-label="Versión">' + [h, m].map(function (x) {
      return '<button type="button" data-version="' + x.id + '" aria-pressed="' + (x === p) + '">' + esc(x.genero) + "</button>";
    }).join("") + "</div>";
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
      var v = t.closest("[data-version]");
      if (v) {
        var q = pareja(actual);
        if (q && String(q.id) === v.getAttribute("data-version")) abrir(q, colorEquivalente(q, colorSel), true);
        return;
      }
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
  function abrir(p, color, mismaVista) {
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
        selectorVersion(p) +
        (p.desc ? '<p class="tx-desc">' + esc(p.desc) + "</p>" : "") +
        ((p.colores || []).length ? '<h3>Color: <span class="tx-color-nombre"></span></h3><div class="tx-colores">' +
          p.colores.map(function (c, i) { return '<button type="button" data-color="' + i + '" title="' + esc(c[0]) + '" aria-label="' + esc(c[0]) + '"><i style="background:' + esc(fondoColor(c)) + '"></i></button>'; }).join("") + "</div>" +
          '<p class="tx-nota-foto" hidden>Foto referencial: este color todavía no tiene foto propia, te mostramos el modelo en otro color.</p>' : "") +
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
    elegirColor(color == null ? colorInicial(p) : color);
    caja.classList.add("abierto");
    document.documentElement.classList.add("tx-sin-scroll");
    var panel = caja.querySelector(".tx-panel");
    if (mismaVista) {
      // Cambio de versión: se queda en el mismo lugar y con el foco en el selector.
      var b = caja.querySelector('[data-version="' + p.id + '"]');
      if (b) b.focus();
    } else {
      panel.scrollTop = 0;
      panel.focus();
    }
    if (history.replaceState) history.replaceState(null, "", "#p-" + p.id);
  }
  function cerrar() {
    caja.classList.remove("abierto");
    document.documentElement.classList.remove("tx-sin-scroll");
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
  }
  function fotosDe(i) {
    return fotosColor(actual, i);
  }
  function elegirColor(i) {
    var p = actual, c = (p.colores || [])[i];
    colorSel = c ? c[0] : "";
    caja.querySelectorAll("[data-color]").forEach(function (b) { b.setAttribute("aria-pressed", +b.getAttribute("data-color") === i); });
    var nom = caja.querySelector(".tx-color-nombre");
    if (nom) nom.textContent = colorSel;
    var nota = caja.querySelector(".tx-nota-foto");
    if (nota) nota.hidden = !referencial(p, i);
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
