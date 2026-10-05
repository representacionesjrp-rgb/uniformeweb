/* =========================================================================
   UNIFORMEWEB · Lógica común del sitio (menú, pie, galerías, formulario).
   Normalmente no necesita editar este archivo: los datos están en config.js
   ========================================================================= */
(function () {
  "use strict";
  var UW = window.UW;
  var WIX = "https://static.wixstatic.com/media/";

  /* --- Rutas de imágenes ------------------------------------------------ */
  // ancho: tamaño máximo deseado (solo aplica a imágenes servidas por Wix).
  function img(id, ancho) {
    if (UW.imagenesLocales) return "img/" + id.replace("~", "-");
    if (!ancho) return WIX + id;
    return WIX + id + "/v1/fit/w_" + ancho + ",h_" + ancho + ",q_85/" + id.replace("~", "-");
  }
  UW.img = img;

  function waLink(texto) {
    return "https://wa.me/" + UW.whatsapp + "?text=" + encodeURIComponent(texto || UW.mensajeWhatsapp);
  }
  function cat(id) {
    for (var i = 0; i < UW.categorias.length; i++) if (UW.categorias[i].id === id) return UW.categorias[i];
    return null;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var ICON_WA = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3C8.8 3 3 8.7 3 15.8c0 2.3.6 4.5 1.8 6.5L3 29l6.9-1.8c1.9 1 4 1.6 6.1 1.6 7.2 0 13-5.7 13-12.8S23.2 3 16 3zm0 23.4c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.1 1.1 1.1-4-.3-.4c-1.1-1.7-1.6-3.6-1.6-5.6C5.3 10 10.1 5.3 16 5.3S26.7 10 26.7 15.8 21.9 26.4 16 26.4zm5.9-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1c-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2s0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.1 1.1-1.1 2.7 1.2 3.1 1.3 3.3c.2.2 2.3 3.5 5.5 4.9 2.7 1.1 3.3.9 3.9.8.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.7-.5z"/></svg>';
  UW.iconWA = ICON_WA;

  /* --- Cabecera y menú -------------------------------------------------- */
  function cabecera() {
    var el = document.getElementById("cabecera");
    if (!el) return;
    var actual = document.body.getAttribute("data-categoria") || "";
    var links = (UW.menu || []).map(function (id) {
      if (id === "contacto") return '<a href="index.html#cotizar">Contacto</a>';
      var c = cat(id);
      if (!c) return "";
      var activo = c.id === actual || (c.subcategorias && c.subcategorias.indexOf(actual) > -1);
      return '<a href="' + c.id + '.html"' + (activo ? ' aria-current="page"' : "") + ">" + esc(c.nombre.split(" y ")[0]) + "</a>";
    }).join("");
    el.innerHTML =
      '<div class="franja">' +
        '<a class="logo" href="index.html"><img src="' + img("c6eba2_40226b866b1f4b6da7b66499fafab838~mv2.png", 700) + '" alt="Uniformeweb.cl" width="350" height="79"></a>' +
        '<button class="menu-btn" aria-expanded="false" aria-controls="menu" aria-label="Abrir menú"><span></span><span></span><span></span></button>' +
        '<nav id="menu" class="menu">' + links + "</nav>" +
      "</div>" +
      (actual ? "" : '<div class="franja franja-correo"><a href="mailto:' + UW.correo + '">' + UW.correo + "</a></div>");
    var btn = el.querySelector(".menu-btn");
    btn.addEventListener("click", function () {
      var abierto = el.classList.toggle("abierto");
      btn.setAttribute("aria-expanded", abierto);
    });
  }

  /* --- Pie de página y botón flotante ----------------------------------- */
  function pie() {
    var el = document.getElementById("pie");
    if (!el) return;
    var links = UW.categorias.filter(function (c) { return !c.subcategorias; }).map(function (c) {
      return '<li><a href="' + c.id + '.html">' + esc(c.nombre) + "</a></li>";
    }).join("");
    el.innerHTML =
      '<section id="cotizar" class="franja pie-cotizar">' +
        '<div class="pie-info">' +
          "<h2>Quiero Mi Cotización</h2>" +
          '<a class="pie-correo" href="mailto:' + UW.correo + '">' + UW.correo + "</a>" +
          '<a class="pie-wa" href="' + waLink() + '" target="_blank" rel="noopener">WhatsApp<br>' + UW.whatsappTexto + "</a>" +
        "</div>" +
        '<form id="form-cotizacion" class="pie-form" method="POST">' +
          '<input type="hidden" name="_subject" value="Nueva solicitud de cotización - uniformeweb.cl">' +
          '<input type="hidden" name="_template" value="table">' +
          '<input type="hidden" name="_captcha" value="false">' +
          '<input type="hidden" name="_next" value="">' +
          '<input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">' +
          '<input id="f-nombre" name="Nombre" required placeholder="Escriba su nombre" aria-label="Nombre" autocomplete="name" class="w80">' +
          '<input id="f-correo" type="email" name="Correo" required placeholder="Escriba su E-Mail" aria-label="E-Mail" autocomplete="email" class="w90">' +
          '<input id="f-celular" type="tel" name="Celular" placeholder="Escriba su número de Celular" aria-label="Celular" autocomplete="tel" class="w60">' +
          '<input id="f-logo" name="¿Necesita logotipo?" placeholder="¿Necesita los productos con logotipo?" aria-label="¿Necesita los productos con logotipo?" class="w70">' +
          '<input id="f-personas" name="Cantidad de personas" placeholder="¿Para cuántas personas requiere los uniformes?" aria-label="¿Para cuántas personas requiere los uniformes?" class="w70">' +
          '<textarea id="f-productos" name="Productos" placeholder="Díganos los productos que le gustaría cotizar" aria-label="Productos"></textarea>' +
          '<button type="submit">Enviar</button>' +
          '<p id="aviso-previa" class="pie-aviso" hidden>Solicitud recibida, le enviaremos su cotización en un máximo de 24 hrs.</p>' +
        "</form>" +
      "</section>";

    var flot = document.createElement("a");
    flot.className = "wa-flotante";
    flot.href = waLink();
    flot.target = "_blank";
    flot.rel = "noopener";
    flot.setAttribute("aria-label", "Hablemos por WhatsApp");
    flot.innerHTML = '<img src="' + img("c6eba2_64cab35510c8455f92f1328decaabf7d~mv2.png", 700) + '" alt="Hablemos por: WhatsApp" width="370" height="95">';
    document.body.appendChild(flot);
  }

  /* --- Imágenes declaradas en el HTML con data-img="id" ------------------ */
  function imagenesHTML() {
    var imgs = document.querySelectorAll("img[data-img]");
    for (var i = 0; i < imgs.length; i++) {
      var im = imgs[i];
      im.addEventListener("error", function () { (this.closest("figure") || this).style.display = "none"; });
      im.src = img(im.getAttribute("data-img"), +im.getAttribute("data-ancho") || 900);
      if (im.hasAttribute("data-zoom")) activarZoom(im, im.getAttribute("data-img"));
    }
  }

  /* --- Tarjetas de categorías (inicio y página Chaquetas) --------------- */
  function tarjetas() {
    var cont = document.querySelectorAll("[data-tarjetas]");
    for (var i = 0; i < cont.length; i++) {
      var ids = cont[i].getAttribute("data-tarjetas");
      var lista = ids === "todas"
        ? UW.categorias.filter(function (c) { return !c.subcategorias && c.id !== "epp"; })
        : ids.split(",").map(cat).filter(Boolean);
      cont[i].innerHTML = lista.map(function (c) {
        return '<a class="tarjeta" href="' + c.id + '.html">' +
          '<span class="tarjeta-img"><img loading="lazy" src="' + img(c.portada, 600) + '" alt="' + esc(c.nombre) + '"></span>' +
          '<span class="tarjeta-txt"><strong>' + esc(c.nombre) + "</strong><small>" + esc(c.descripcion) + "</small></span></a>";
      }).join("");
    }
  }

  /* --- Página de categoría ---------------------------------------------- */
  function paginaCategoria() {
    var id = document.body.getAttribute("data-categoria");
    var c = id && cat(id);
    var el = document.getElementById("galeria");
    if (!c || !el) return;
    var h = "";
    if (c.subcategorias) {
      h = '<div class="grid-tarjetas" data-tarjetas="' + c.subcategorias.join(",") + '"></div>';
      el.innerHTML = h;
      tarjetas();
      return;
    }
    c.secciones.forEach(function (s) {
      if (s.titulo) h += "<h2 class=\"galeria-titulo\">" + esc(s.titulo) + "</h2>";
      h += '<div class="galeria">' + s.fotos.map(function (f) {
        return '<figure class="foto"><img loading="lazy" data-zoom-id="' + f + '" src="' + img(f, 600) + '" alt="' + esc(c.nombre) + ' Uniformeweb"></figure>';
      }).join("") + "</div>";
    });
    el.innerHTML = h;
    var fotos = el.querySelectorAll("img[data-zoom-id]");
    for (var i = 0; i < fotos.length; i++) activarZoom(fotos[i], fotos[i].getAttribute("data-zoom-id"));
  }

  /* --- Visor de fotos (lightbox) ---------------------------------------- */
  var visor;
  function activarZoom(im, id) {
    im.style.cursor = "zoom-in";
    // Si una foto no existe, se oculta en vez de mostrar un ícono roto.
    im.addEventListener("error", function () {
      var fig = im.closest("figure") || im;
      fig.style.display = "none";
    });
    im.addEventListener("click", function () { abrirVisor(id, im.alt); });
  }
  function abrirVisor(id, alt) {
    if (!visor) {
      visor = document.createElement("div");
      visor.className = "visor";
      visor.setAttribute("role", "dialog");
      visor.innerHTML = '<button class="visor-cerrar" aria-label="Cerrar">×</button><img alt="">' +
        '<a class="btn btn-acento visor-cta" target="_blank" rel="noopener">' + ICON_WA + " Cotizar este producto</a>";
      visor.addEventListener("click", function (e) {
        if (e.target === visor || e.target.classList.contains("visor-cerrar")) visor.classList.remove("abierto");
      });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") visor.classList.remove("abierto"); });
      document.body.appendChild(visor);
    }
    visor.querySelector("img").src = img(id, 1400);
    visor.querySelector("img").alt = alt || "";
    var url = new URL(img(id), location.href).href;
    visor.querySelector(".visor-cta").href = waLink(UW.mensajeWhatsapp + " Me interesa este producto: " + url);
    visor.classList.add("abierto");
  }

  /* --- Enlaces de WhatsApp en el HTML (class="js-wa") -------------------- */
  function enlacesWA() {
    var a = document.querySelectorAll(".js-wa");
    for (var i = 0; i < a.length; i++) {
      a[i].href = waLink(a[i].getAttribute("data-mensaje"));
      a[i].target = "_blank";
      a[i].rel = "noopener";
    }
    var t = document.querySelectorAll(".js-correo");
    for (var j = 0; j < t.length; j++) { t[j].href = "mailto:" + UW.correo; t[j].textContent = UW.correo; }
    var w = document.querySelectorAll(".js-wa-texto");
    for (var k = 0; k < w.length; k++) w[k].textContent = UW.whatsappTexto;
  }

  /* --- Formulario de cotización ----------------------------------------- */
  function formulario() {
    var f = document.getElementById("form-cotizacion");
    if (!f) return;
    f.action = "https://formsubmit.co/" + (UW.correoFormularios || UW.correo);
    var siguiente = f.querySelector('input[name="_next"]');
    if (siguiente) siguiente.value = location.href.split("#")[0].replace(/[^/]*$/, "") + "gracias.html";

  }

  document.addEventListener("DOMContentLoaded", function () {
    cabecera();
    pie();
    imagenesHTML();
    tarjetas();
    paginaCategoria();
    enlacesWA();
    formulario();
  });
})();
