/* =========================================================================
   UNIFORMEWEB · Buscador de productos
   Mismas reglas de búsqueda que el buscador de laropa.cl:
   - Sin mayúsculas ni tildes ("Polerón" = "poleron").
   - Se ignoran palabras de una letra y palabras vacías (de, la, el, y, para, con…).
   - Plurales al singular ("pantalones" = "pantalón", "poleras" = "polera").
   - Todas las palabras deben calzar (Y); cada palabra calza con el inicio de una
     palabra del nombre, de la categoría o del código ("pant carg" encuentra
     "Pantalón Cargo").
   - Sinónimos: piqué / pike / camisero = cuello camisero (en Texora: "Polera Polo");
     camiseta / remera = polera; "cuello redondo" o "t-shirt" = polera sin cuello.
   - Código de producto (por ejemplo 01014): con Enter va directo a la ficha.
     El código exacto aparece primero.
   - Orden de las sugerencias mientras se escribe: código exacto, disponibles antes que
     agotados, hombre/unisex primero (mujer primero si se escribe mujer, dama, femenino…),
     y después los que calzan en el nombre.
   - Página de resultados (buscar.html): igual que el resto del sitio, del producto más
     económico al más costoso (el orden de data/texora.js); el código exacto va primero.
   - Sugerencias mientras se escribe (desde 2 letras, máximo 7) y "Ver todos los
     resultados". En la página de resultados, si hay varias palabras, se ofrece
     "Ver productos con cualquiera de las palabras".
   No muestra precios. Los productos salen de data/texora.js (catálogo de la web).
   ========================================================================= */
(function () {
  "use strict";
  var UW = window.UW || {};
  var yo = document.currentScript && document.currentScript.src;
  var BASE = yo ? yo.replace(/assets\/js\/buscador\.js.*$/, "") : "";
  var IMG = "https://texora.cl/";
  var MAX_SUGERENCIAS = 7;

  /* --- Reglas de búsqueda (iguales a laropa.cl) -------------------------- */
  var STOP = {};
  "de la el y para con en los las del a al por un una".split(" ").forEach(function (w) { STOP[w] = 1; });
  function fold(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function stem(w) {
    return w.length > 4 && /[nrldz]es$/.test(w) ? w.slice(0, -2) : w.length > 3 && /[^s]s$/.test(w) ? w.slice(0, -1) : w;
  }
  function palabras(raw) {
    return fold(raw).replace(/[^a-z0-9\- ]/g, " ").split(/\s+/).filter(function (w) {
      return w.length > 1 && !STOP[w];
    }).map(stem);
  }
  function compacto(s) { return fold(s).replace(/[^a-z0-9]/g, ""); }
  // Sinónimos: la palabra escrita también calza con estas.
  var SIN = {
    camiseta: ["polera"], remera: ["polera"],
    pique: ["pique", "polo"], pike: ["pique", "polo"], camisero: ["polo", "pique"], camisera: ["polo", "pique"]
  };
  // Cuello: como laropa.cl, "piqué/camisero" y "cuello redondo/t-shirt" separan las poleras.
  var PALABRAS_CUELLO = {};
  "polo pique pike camisero camisera redondo redonda cuello tipo polera t-shirt tshirt".split(" ").forEach(function (w) { PALABRAS_CUELLO[w] = 1; });
  function cuello(raw) {
    var s = " " + fold(raw).replace(/[^a-z0-9\-]+/g, " ") + " ";
    if (/ (piques?|pikes?|camiser[oa]s?|polos?) /.test(s)) return "camisero";
    if (/ (redond[oa]s?|t-?shirts?) /.test(s)) return "redondo";
    return "";
  }
  function esCamisero(p) { return /\b(polo|pique)\b/.test(p._t.join(" ")); }
  // Género: se usa como filtro (los productos unisex sirven para ambos).
  var MUJER = /^(mujer|mujere|femenin[oa]?|dama|senora|nina)$/, HOMBRE = /^(hombre|varon|varone|masculin[oa]?|caballero|nino)$/;
  // Código: solo números (4 a 8 dígitos) o letras y números, como en laropa.cl.
  function claveCodigo(raw) {
    var s = compacto(raw);
    return /^\d{4,8}$/.test(s) || (/^[a-z]{1,4}\d+[a-z0-9]*$/.test(s) && /\d/.test(s)) ? s : "";
  }

  /* --- Catálogo ---------------------------------------------------------- */
  var catalogo = null, cargando = null;
  function nombreCategoria(id) {
    var c = (UW.categorias || []).filter(function (x) { return x.id === id; })[0];
    return c ? c.nombre : id;
  }
  function categoriaPadre(id) {
    var c = (UW.categorias || []).filter(function (x) { return x.subcategorias && x.subcategorias.indexOf(id) > -1; })[0];
    return c ? c.nombre : "";
  }
  function preparar(lista) {
    return lista.filter(function (p) { return p.pagina; }).map(function (p, i) {
      var cat = nombreCategoria(p.pagina);
      var t = palabras(p.nombre);
      // "Hi-Vis" también calza con "hi vis", "hivis" y "vis".
      fold(p.nombre).replace(/[^a-z0-9\- ]/g, " ").split(/\s+/).forEach(function (w) {
        if (w.indexOf("-") < 0) return;
        t.push(stem(w.replace(/-/g, "")));
        w.split("-").forEach(function (x) { if (x.length > 1) t.push(stem(x)); });
      });
      p._t = t;
      p._c = palabras(cat + " " + categoriaPadre(p.pagina));
      p._sku = compacto(p.sku);
      p._cat = cat;
      p._i = i;
      return p;
    });
  }
  function cargar() {
    if (catalogo) return Promise.resolve(catalogo);
    if (window.TEXORA && window.TEXORA.productos) return Promise.resolve(catalogo = preparar(window.TEXORA.productos));
    if (cargando) return cargando;
    cargando = new Promise(function (ok, mal) {
      var s = document.createElement("script");
      s.src = BASE + "data/texora.js";
      s.onload = function () { window.TEXORA ? ok(catalogo = preparar(window.TEXORA.productos)) : mal(); };
      s.onerror = function () { cargando = null; mal(); };
      document.head.appendChild(s);
    });
    return cargando;
  }

  /* --- Buscar ------------------------------------------------------------ */
  function empieza(lista, w) {
    for (var i = 0; i < lista.length; i++) if (lista[i].indexOf(w) === 0) return true;
    return false;
  }
  // Devuelve 2 si la palabra calza en el nombre, 1 si solo en la categoría o el código, 0 si no calza.
  function calza(p, w) {
    var alt = [w].concat(SIN[w] || []), i;
    for (i = 0; i < alt.length; i++) if (empieza(p._t, alt[i])) return 2;
    for (i = 0; i < alt.length; i++) if (empieza(p._c, alt[i])) return 1;
    var c = compacto(w);
    if (/\d/.test(c) && c.length > 2 && p._sku.indexOf(c) === 0) return 1;
    return 0;
  }
  function buscar(raw, cualquiera, porPrecio) {
    var todos = catalogo || [];
    var tag = cuello(raw), genero = "", ws = [];
    // "hi-vis" se busca como "hi vis" (t-shirt queda entero para la regla del cuello).
    palabras(raw).forEach(function (w) {
      if (w.indexOf("-") > -1 && !/^t-?shirt/.test(w)) fold(w).split("-").forEach(function (x) { if (x.length > 1) ws.push(stem(x)); });
      else ws.push(w);
    });
    ws = ws.filter(function (w) {
      if (MUJER.test(w)) { genero = "Mujer"; return false; }
      if (HOMBRE.test(w)) { genero = genero || "Hombre"; return false; }
      return true;
    });
    if (tag) ws = ws.filter(function (w) { return !PALABRAS_CUELLO[w]; });
    var clave = claveCodigo(raw), exacto = clave ? todos.filter(function (p) { return p._sku === clave; })[0] : null;
    var res = todos.filter(function (p) {
      p._n = p._p = 0;
      if (p === exacto) return true;
      if (genero && p.genero && p.genero !== genero && p.genero !== "Unisex") return false;
      if (tag && (p.pagina !== "poleras" || esCamisero(p) !== (tag === "camisero"))) return false;
      if (!ws.length) return !!(tag || genero);
      var n = 0, puntos = 0, nombre = 0;
      ws.forEach(function (w) { var c = calza(p, w); if (c) { n++; puntos += c; } if (c === 2) nombre++; });
      p._n = nombre === ws.length ? 1 : 0; // todas las palabras están en el nombre
      p._p = puntos + (ws[0] && p._t[0] && p._t[0].indexOf(ws[0]) === 0 ? 1 : 0);
      return cualquiera ? n > 0 : n === ws.length;
    });
    var quiereMujer = genero === "Mujer";
    function rangoGenero(p) { return p.genero === "Unisex" || !p.genero ? 1 : (p.genero === "Mujer") === quiereMujer ? 0 : 2; }
    res.sort(function (a, b) {
      // Resultados completos: de menor a mayor precio (data/texora.js ya viene en ese orden).
      if (porPrecio) return (b === exacto) - (a === exacto) || a._i - b._i;
      return (b === exacto) - (a === exacto) ||
        (a.disp === "A") - (b.disp === "A") ||
        (b._n || 0) - (a._n || 0) ||
        rangoGenero(a) - rangoGenero(b) ||
        (b._p || 0) - (a._p || 0) ||
        a._i - b._i;
    });
    return { productos: res, exacto: exacto, palabras: ws.length + (tag ? 1 : 0) + (genero ? 1 : 0) };
  }
  // Categorías cuyo nombre calza (sirve para Zapatos, Sweaters, etc., que solo tienen fotos).
  function categorias(raw) {
    var ws = palabras(raw);
    if (!ws.length) return [];
    return (UW.categorias || []).filter(function (c) {
      var t = palabras(c.nombre + " " + c.id);
      return ws.every(function (w) { return empieza(t, w) || (SIN[w] || []).some(function (a) { return empieza(t, a); }); });
    });
  }

  /* --- Presentación ------------------------------------------------------ */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function foto(p, tam) {
    var id = (p.img || [])[0];
    return id ? IMG + id + "-" + (tam || "home_default") + "/" + p.slug + ".jpg" : "";
  }
  function urlProducto(p) { return BASE + p.pagina + ".html#p-" + p.id; }
  function urlResultados(raw, cualquiera) {
    return BASE + "buscar.html?q=" + encodeURIComponent(raw.trim()) + (cualquiera ? "&o=1" : "");
  }
  var ESTADO = { D: ["disp", "Disponible"], U: ["ultimas", "Últimas unidades"], A: ["agotado", "Agotado"] };
  function estado(p) {
    var d = String(p.disp || "D");
    if (d.charAt(0) === "P") return ["proximo", "Llega pronto"];
    return ESTADO[d] || ESTADO.D;
  }
  var ICONO = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

  function sugerencias(raw) {
    var r = buscar(raw), cats = categorias(raw).slice(0, 3), ps = r.productos.slice(0, MAX_SUGERENCIAS);
    var html = "";
    if (cats.length) {
      html += '<div class="bq-cats">' + cats.map(function (c) {
        return '<a class="bq-op bq-cat" href="' + BASE + c.id + '.html">Ver categoría <b>' + esc(c.nombre) + "</b></a>";
      }).join("") + "</div>";
    }
    html += ps.map(function (p) {
      return '<a class="bq-op bq-it" href="' + urlProducto(p) + '">' +
        '<img src="' + foto(p) + '" alt="" loading="lazy">' +
        '<span><b>' + esc(p.nombre) + "</b><small>Cód. " + esc(p.sku) + " · " + esc(p._cat) + (p.genero ? " · " + esc(p.genero) : "") + "</small></span>" +
        (p.disp === "A" ? '<span class="bq-chip">Agotado</span>' : "") +
        "</a>";
    }).join("");
    if (ps.length) {
      html += '<a class="bq-op bq-todos" href="' + urlResultados(raw) + '">Ver todos los resultados de “' + esc(raw.trim()) + "”" +
        (r.productos.length > ps.length ? " (" + r.productos.length + ")" : "") + " →</a>";
    } else if (!cats.length) {
      html += '<div class="bq-nada">Sin resultados para “' + esc(raw.trim()) + "”." +
        (palabras(raw).length > 1 ? ' <a class="bq-op" href="' + urlResultados(raw, true) + '">Buscar con cualquiera de las palabras →</a>' : "") +
        "</div>";
    }
    return html;
  }

  /* --- Caja de búsqueda en la cabecera ----------------------------------- */
  function caja() {
    var cab = document.querySelector("#cabecera > .franja");
    if (!cab || cab.querySelector(".bq-form")) return;
    var f = document.createElement("form");
    f.className = "bq-form";
    f.setAttribute("role", "search");
    f.action = BASE + "buscar.html";
    f.method = "get";
    f.innerHTML = '<label class="bq-caja">' + ICONO +
      '<input type="search" name="q" placeholder="' + (window.innerWidth < 560 ? "Buscar productos o código…" : "Buscar productos: polera piqué, pantalón cargo, código…") + '" autocomplete="off" aria-label="Buscar productos" aria-autocomplete="list" aria-expanded="false">' +
      "</label>" +
      '<button type="submit" class="bq-btn">Buscar</button>' +
      '<div class="bq-drop" role="listbox" hidden></div>';
    var nav = cab.querySelector(".menu");
    cab.insertBefore(f, nav ? nav.nextSibling : null);
    var input = f.querySelector("input"), drop = f.querySelector(".bq-drop"), timer, activo = -1;
    var q0 = new URLSearchParams(location.search).get("q");
    if (q0 && document.body.getAttribute("data-categoria") === "buscar") input.value = q0;

    function cerrar() { drop.hidden = true; drop.innerHTML = ""; activo = -1; input.setAttribute("aria-expanded", "false"); }
    function mostrar() {
      var q = input.value.trim();
      if (q.length < 2) return cerrar();
      cargar().then(function () {
        if (input.value.trim() !== q) return;
        drop.innerHTML = sugerencias(q);
        drop.hidden = false;
        activo = -1;
        input.setAttribute("aria-expanded", "true");
      }, cerrar);
    }
    input.addEventListener("focus", function () { cargar().catch(function () {}); if (input.value.trim().length > 1) mostrar(); });
    input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(mostrar, 180); });
    input.addEventListener("keydown", function (e) {
      var ops = drop.hidden ? [] : drop.querySelectorAll(".bq-op");
      if (e.key === "Escape") { cerrar(); return; }
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && ops.length) {
        e.preventDefault();
        activo += e.key === "ArrowDown" ? 1 : -1;
        if (activo >= ops.length) activo = -1;
        if (activo < -1) activo = ops.length - 1;
        ops.forEach(function (o, i) { o.classList.toggle("bq-activo", i === activo); });
        if (activo > -1) ops[activo].scrollIntoView({ block: "nearest" });
      }
      if (e.key === "Enter" && activo > -1 && ops[activo]) { e.preventDefault(); ir(ops[activo].href); }
    });
    f.addEventListener("submit", function (e) {
      var raw = input.value.trim();
      e.preventDefault();
      if (!raw) { input.focus(); return; }
      cargar().then(function () {
        var r = buscar(raw);
        ir(r.exacto ? urlProducto(r.exacto) : urlResultados(raw));
      }, function () { location.href = urlResultados(raw); });
    });
    drop.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (a) { e.preventDefault(); ir(a.href); }
    });
    document.addEventListener("click", function (e) { if (!f.contains(e.target)) cerrar(); });
    function ir(href) {
      cerrar();
      // Si el producto está en esta misma página, el cambio de #p-… abre su ficha.
      var u = new URL(href, location.href);
      if (u.pathname === location.pathname && u.hash && u.search === location.search) {
        if (location.hash === u.hash) history.replaceState(null, "", location.pathname + location.search);
        location.hash = u.hash;
        input.blur();
      } else location.href = href;
    }
  }

  /* --- Página de resultados (buscar.html) -------------------------------- */
  function paginaResultados() {
    var cont = document.getElementById("resultados");
    if (!cont) return;
    var sp = new URLSearchParams(location.search), raw = (sp.get("q") || "").trim(), cualquiera = sp.get("o") === "1";
    var tit = document.getElementById("bq-titulo"), sub = document.getElementById("bq-sub");
    if (!raw) {
      tit.textContent = "Buscar productos";
      sub.textContent = "Escribe arriba lo que buscas: tipo de prenda, material, color o código.";
      cont.innerHTML = "";
      return;
    }
    document.title = "Resultados de “" + raw + "” | Uniformeweb";
    tit.innerHTML = '<span class="t-azul">Resultados de</span> <span class="t-morado">“' + esc(raw) + "”</span>";
    cargar().then(function () {
      var r = buscar(raw, cualquiera, true), cats = categorias(raw), n = r.productos.length;
      sub.innerHTML = (n ? n + (n === 1 ? " modelo" : " modelos") : "Ningún modelo") + (cualquiera ? " con cualquiera de las palabras" : "") + "." +
        (!cualquiera && palabras(raw).length > 1 ? ' <a href="' + urlResultados(raw, true) + '">Ver productos con cualquiera de las palabras →</a>' : "") +
        (cualquiera ? ' <a href="' + urlResultados(raw) + '">Ver solo los que tienen todas las palabras →</a>' : "");
      var html = cats.length ? '<div class="bq-cats-pag">' + cats.map(function (c) {
        return '<a class="btn btn-acento" href="' + BASE + c.id + '.html">Ver categoría ' + esc(c.nombre) + "</a>";
      }).join("") + "</div>" : "";
      if (n) {
        html += '<div class="tx-grid bq-grid">' + r.productos.map(function (p) {
          var e = estado(p);
          return '<article class="tx-card" data-id="' + esc(p.id) + '"><a class="tx-card-img" href="' + urlProducto(p) + '" aria-label="Ver ficha de ' + esc(p.nombre) + '">' +
              '<img src="' + foto(p, "large_default") + '" alt="' + esc(p.nombre) + '" loading="lazy">' +
              '<span class="tx-estado tx-' + e[0] + '">' + esc(e[1]) + "</span>" +
              (p.genero ? '<span class="tx-genero">' + esc(p.genero) + "</span>" : "") + "</a>" +
            '<div class="tx-card-txt"><h3><a href="' + urlProducto(p) + '">' + esc(p.nombre) + "</a></h3>" +
              '<p class="tx-cod">Cód. ' + esc(p.sku) + " · " + esc(p._cat) + "</p>" +
              '<a class="tx-ver-mas" href="' + urlProducto(p) + '">Ver colores y tallas <span aria-hidden="true">→</span></a></div>' +
            "</article>";
        }).join("") + "</div>";
      } else {
        html += '<div class="bq-vacio"><p>No encontramos modelos con “' + esc(raw) + '”. Prueba con otra palabra o pregúntanos: tenemos más productos que los publicados.</p>' +
          '<a class="btn btn-wa js-wa" href="https://wa.me/' + esc(UW.whatsapp || "") + "?text=" + encodeURIComponent("Hola Uniformeweb, busco: " + raw) + '" target="_blank" rel="noopener">Preguntar por WhatsApp</a></div>';
      }
      cont.innerHTML = html;
    }, function () {
      sub.textContent = "No se pudo cargar el catálogo. Intenta de nuevo en unos segundos.";
    });
  }

  window.UWBuscador = { buscar: function (q, o) { return buscar(q, o).productos; }, cargar: cargar };

  function iniciar() { caja(); paginaResultados(); }
  // Después de sitio.js, que arma la cabecera en DOMContentLoaded.
  if (document.readyState === "complete") iniciar();
  else document.addEventListener("DOMContentLoaded", iniciar);
})();
