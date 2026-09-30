/* Forge Shop store logic: pages, product switching, cart. No edits needed. */
(function () {
  "use strict";
  var root = document.getElementById("forge-merch");
  if (!root) return;

  var $ = function (s, el) { return (el || root).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || root).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var money = function (n) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: SITE.currency || "USD",
      minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n);
  };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var byId = function (id) { return PRODUCTS.find(function (p) { return p.id === id; }); };
  var colorInfo = function (k) { return COLORS[k] || { label: k, hex: "#8A94A8" }; };
  var colorKeys = function (p) { return Object.keys(p.colors); };
  var viewLabel = function (v) { return v === "back" ? "Back" : "Front"; };
  var firstView = function (p) { return p.preview === "back" ? "back" : "front"; };
  var otherView = function (p) { return firstView(p) === "back" ? "front" : "back"; };
  var collectionKeys = function () { return Object.keys(SITE.collections); };
  var productsIn = function (key) { return PRODUCTS.filter(function (p) { return p.categories.indexOf(key) !== -1; }); };
  var collectionOf = function (p) { return collectionKeys().find(function (k) { return p.categories.indexOf(k) !== -1; }); };
  var productUrl = function (p, color) { return "/product/" + p.id + (color ? "?color=" + encodeURIComponent(color) : ""); };

  PRODUCTS.forEach(function (p) {
    colorKeys(p).forEach(function (k) {
      if (!COLORS[k]) console.warn('[Forge shop] Color "' + k + '" on "' + p.id + '" is missing from COLORS.');
    });
  });

  /* ---------- Images ---------- */
  function imgUrl(p, color, view) { return (p.colors[color] || {})[view] || ""; }
  function img(p, color, view, opts) {
    opts = opts || {};
    var url = imgUrl(p, color, view);
    var alt = opts.decorative ? "" : p.name + ", " + colorInfo(color).label + ", " + view + " view";
    if (!url) return '<div class="fm-tile__img--empty' + (opts.cls ? " " + opts.cls : "") + '" style="position:absolute;inset:0">' + esc(p.name + " " + colorInfo(color).label + " " + view) + "</div>";
    return '<img src="' + esc(url) + '" alt="' + esc(alt) + '"' + (opts.cls ? ' class="' + opts.cls + '"' : "") +
      (opts.eager ? "" : ' loading="lazy"') + ' decoding="async">';
  }
  function preload(p, color) {
    ["front", "back"].forEach(function (v) { var u = imgUrl(p, color, v); if (u) { var i = new Image(); i.src = u; } });
  }

  /* ---------- Header, nav, footer ---------- */
  var isShopLink = function (url) { return url.charAt(0) === "#" || url === "/"; };
  function logoHTML() {
    return SITE.logoUrl ? '<img src="' + esc(SITE.logoUrl) + '" alt="' + esc(SITE.logoAlt) + '">' : '<span class="fm-logo__text">Forge Learning Academy</span>';
  }
  var homeUrl = (SITE.nav[0] && SITE.nav[0].url) || "/";
  if (!SITE.showHeader) { $("#fm-header").hidden = true; $("#fm-fab").hidden = false; }
  ["#fm-logo", "#fm-footer-logo"].forEach(function (s) { $(s).href = homeUrl; $(s).innerHTML = logoHTML(); });
  $("#fm-try").href = SITE.tryForgeUrl;
  $("#fm-nav-list").innerHTML = SITE.nav.map(function (l) {
    var shop = isShopLink(l.url);
    return '<li><a href="' + (shop ? "/" : esc(l.url)) + '"' + (shop ? " data-link" : "") + (l.current ? ' aria-current="page"' : "") + ">" + esc(l.label) + "</a></li>";
  }).join("") + '<li class="fm-nav__cta"><a class="fm-btn fm-btn--gold" href="' + esc(SITE.tryForgeUrl) + '">Try Forge Free</a></li>';
  $("#fm-footer-links").innerHTML = SITE.nav.map(function (l) {
    var shop = isShopLink(l.url);
    return '<a href="' + (shop ? "/" : esc(l.url)) + '"' + (shop ? " data-link" : "") + ">" + esc(l.label) + "</a>";
  }).join("");
  $("#fm-year").textContent = new Date().getFullYear();

  var menuBtn = $("#fm-menu-toggle"), nav = $("#fm-nav");
  function setMenu(open) { nav.classList.toggle("is-open", open); menuBtn.setAttribute("aria-expanded", String(open)); }
  menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });

  function renderSubnav(active) {
    $("#fm-subnav").innerHTML = '<a href="/" data-link' + (active === "home" ? ' aria-current="page"' : "") + ">Shop</a>" +
      collectionKeys().map(function (k) {
        return '<a href="/' + esc(k) + '" data-link data-empty="' + !productsIn(k).length + '"' + (active === k ? ' aria-current="page"' : "") + ">" +
          esc(SITE.collections[k].label) + "</a>";
      }).join("");
  }

  /* ---------- Router ---------- */
  var view = $("#fm-view");
  function go(url, replace) {
    if (replace) history.replaceState(null, "", url); else history.pushState(null, "", url);
    render(true);
  }
  function setTitle(t) { document.title = (t ? t + " | " : "") + "Forge Shop | Forge Learning Academy"; }

  function render(scrollTop) {
    var path = location.pathname.replace(/\/+$/, "") || "/";
    var q = new URLSearchParams(location.search);
    setMenu(false);
    var m;
    if (path === "/" || path === "/index.html") { renderSubnav("home"); homePage(); }
    else if ((m = path.match(/^\/product\/([^\/]+)$/)) && byId(decodeURIComponent(m[1]))) {
      var p = byId(decodeURIComponent(m[1])); renderSubnav(collectionOf(p)); productPage(p, q.get("color"));
    }
    else if ((m = path.match(/^\/([a-z0-9-]+)$/)) && SITE.collections[m[1]]) { renderSubnav(m[1]); collectionPage(m[1], q.get("designs") || "all"); }
    else if (path === "/order/success") { renderSubnav(""); successPage(); }
    else if (path === "/search") { renderSubnav(""); searchPage(q.get("q") || ""); }
    else { renderSubnav(""); notFoundPage(); }
    if (scrollTop) { window.scrollTo(0, 0); view.focus({ preventScroll: true }); }
  }

  root.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-link]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    closeCart(false);
    go(a.getAttribute("href"));
  });
  window.addEventListener("popstate", function () { render(false); });

  function crumbs(items) {
    return '<nav class="fm-crumbs" aria-label="Breadcrumb">' + items.map(function (it, i) {
      var last = i === items.length - 1;
      return (i ? '<span aria-hidden="true">/</span>' : "") +
        (last ? '<span aria-current="page">' + esc(it[0]) + "</span>" : '<a href="' + it[1] + '" data-link>' + esc(it[0]) + "</a>");
    }).join("") + "</nav>";
  }

  /* ---------- Product card (links to the product page) ---------- */
  var cardColor = {};
  function cardHTML(p) {
    var c = cardColor[p.id] || colorKeys(p)[0];
    return '<article class="fm-card" data-id="' + esc(p.id) + '">' +
      '<a class="fm-card__media" href="' + productUrl(p, c) + '" data-link aria-label="' + esc(p.name) + '">' +
        img(p, c, firstView(p), { cls: "is-front", decorative: true }) + img(p, c, otherView(p), { cls: "is-back", decorative: true }) + "</a>" +
      '<div class="fm-card__meta"><h3 class="fm-card__name"><a href="' + productUrl(p, c) + '" data-link>' + esc(p.name) + "</a></h3>" +
        '<span class="fm-card__price">' + money(p.price) + "</span></div>" +
      '<div class="fm-card__colors"><div class="fm-dots" role="group" aria-label="Color">' + colorKeys(p).map(function (k) {
        var ci = colorInfo(k);
        return '<button type="button" class="fm-dotbtn" data-card-color="' + esc(k) + '" aria-pressed="' + (k === c) + '" aria-label="' + esc(ci.label) +
          '" title="' + esc(ci.label) + '"><span class="fm-dot" style="--sw:' + ci.hex + '"></span></button>';
      }).join("") + '</div></div><p class="fm-card__colorname">' + esc(colorInfo(c).label) + "</p></article>";
  }
  function gridHTML(list) { return '<div class="fm-grid">' + list.map(cardHTML).join("") + "</div>"; }

  view.addEventListener("click", function (e) {
    var b = e.target.closest("[data-card-color]"); if (!b) return;
    var card = b.closest(".fm-card"), p = byId(card.getAttribute("data-id")), c = b.getAttribute("data-card-color");
    cardColor[p.id] = c; preload(p, c);
    var tmp = document.createElement("div"); tmp.innerHTML = cardHTML(p);
    card.replaceWith(tmp.firstChild);
    var again = $('.fm-card[data-id="' + p.id + '"] [data-card-color="' + c + '"]', view); if (again) again.focus();
  });

  /* ---------- Home ---------- */
  function homePage() {
    setTitle("");
    var tiles = collectionKeys().map(function (k) {
      var c = SITE.collections[k], list = productsIn(k), first = list[0];
      var pic = c.image ? '<img src="' + esc(c.image) + '" alt="" loading="lazy">'
        : first ? img(first, colorKeys(first)[0], firstView(first), { decorative: true }) : "";
      return '<a class="fm-tile" href="/' + esc(k) + '" data-link>' +
        (pic ? '<div class="fm-tile__img">' + pic + "</div>" : '<div class="fm-tile__img fm-tile__img--empty">Not in the shop yet</div>') +
        '<div class="fm-tile__label"><span class="fm-tile__name">' + esc(c.label) + '</span><span class="fm-tile__count">' +
        (list.length ? list.length + (list.length === 1 ? " design" : " designs") : "") + "</span></div></a>";
    }).join("");
    var kids = ["boys", "girls"].filter(function (k) { return SITE.collections[k] && productsIn(k).length; });
    var heroImg = SITE.heroImage
      ? '<img src="' + esc(SITE.heroImage) + '"' + (SITE.heroImageSmall ? ' srcset="' + esc(SITE.heroImageSmall) + " 768w, " + esc(SITE.heroImage) + ' 1536w" sizes="100vw"' : "") +
        ' alt="' + esc(SITE.heroImageAlt || "") + '" fetchpriority="high">' : "";
    view.innerHTML =
      '<section class="fm-hero" aria-labelledby="fm-hero-title"><div class="fm-wrap fm-hero__copy"><div>' +
        '<p class="fm-kicker">Forge Shop</p><h1 class="fm-hero__title fm-display" id="fm-hero-title"><span>Wear what</span><span>you\'re building.</span></h1></div>' +
        '<div class="fm-hero__aside"><p class="fm-hero__sub">Purpose-driven apparel for a brighter generation.</p>' +
        '<a class="fm-btn fm-btn--gold" href="#fm-collections" data-jump>Shop the collection</a></div></div>' +
        '<div class="fm-hero__media' + (SITE.heroImageIsProduct ? " is-product" : "") + '">' + heroImg + "</div></section>" +
      '<section class="fm-home-section" id="fm-collections" aria-labelledby="fm-coll-title"><div class="fm-wrap">' +
        '<h2 class="fm-section-title fm-display" id="fm-coll-title">Shop by collection</h2><div class="fm-tiles">' + tiles + "</div></div></section>" +
      (SITE.statements && SITE.statements[0] ? '<section class="fm-statement"><div class="fm-wrap"><p class="fm-display">' + esc(SITE.statements[0]) + "</p></div></section>" : "") +
      '<section class="fm-kids" aria-labelledby="fm-kids-title"><div class="fm-wrap fm-kids__inner">' +
        '<p class="fm-kids__words fm-display" aria-hidden="true"><span>Kinder</span><span>Braver</span><span>Smarter</span><span>Stronger</span></p>' +
        '<div class="fm-kids__side"><h2 class="fm-section-title fm-display" id="fm-kids-title">The kids\' collection</h2><p>Created to do great things.</p>' +
        (kids.length ? '<div class="fm-kids__btns">' + kids.map(function (k, i) {
          return '<a class="fm-btn ' + (i ? "fm-btn--line" : "fm-btn--gold") + '" href="/' + k + '" data-link>Shop ' + esc(SITE.collections[k].label.toLowerCase()) + "</a>";
        }).join("") + "</div>" : "") + "</div></div></section>";
    var jump = $("[data-jump]", view);
    jump.addEventListener("click", function (e) {
      e.preventDefault(); $("#fm-collections").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Collection ---------- */
  function collectionPage(key, track) {
    var c = SITE.collections[key], all = productsIn(key);
    if (!TRACKS.some(function (t) { return t.id === track; })) track = "all";
    setTitle(c.title || c.label);
    var shown = all.filter(function (p) { return track === "all" || p.categories.indexOf(track) !== -1; });
    var t = TRACKS.find(function (x) { return x.id === track; });
    view.innerHTML = '<div class="fm-page"><div class="fm-wrap">' + crumbs([["Shop", "/"], [c.label, "/" + key]]) +
      '<div class="fm-page__head"><div><h1 class="fm-page__title fm-display">' + esc(c.title || c.label) + "</h1>" +
        (c.intro ? '<p class="fm-page__intro">' + esc(c.intro) + "</p>" : "") + "</div>" +
        (all.length ? '<div class="fm-tracks" role="group" aria-label="Filter designs"><span class="fm-tracks__label">Designs</span>' +
          TRACKS.map(function (x) { return '<button type="button" class="fm-track" data-track="' + esc(x.id) + '" aria-pressed="' + (x.id === track) + '">' + esc(x.label) + "</button>"; }).join("") + "</div>" : "") +
      "</div>" +
      (!all.length ? '<div class="fm-note"><p>The ' + esc(c.label.toLowerCase()) + ' collection isn\'t in the shop yet.</p><a class="fm-btn fm-btn--gold" href="/" data-link>Back to the shop</a></div>'
        : shown.length ? gridHTML(shown)
        : '<div class="fm-note"><p>No ' + esc(t.label.toLowerCase()) + ' designs in this collection yet.</p></div>') +
      "</div></div>";
    $$("[data-track]", view).forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-track");
        history.replaceState(null, "", "/" + key + (id === "all" ? "" : "?designs=" + id));
        collectionPage(key, id);
      });
    });
  }

  /* ---------- Product ---------- */
  function productPage(p, colorParam) {
    var key = collectionOf(p), c = key ? SITE.collections[key] : null;
    var st = { color: p.colors[colorParam] ? colorParam : colorKeys(p)[0], view: firstView(p), size: null, qty: 1 };
    setTitle(p.name);
    var related = key ? productsIn(key).filter(function (x) { return x.id !== p.id; }) : [];
    view.innerHTML = '<div class="fm-page"><div class="fm-wrap">' +
      crumbs([["Shop", "/"]].concat(c ? [[c.label, "/" + key]] : [], [[p.name, productUrl(p)]])) +
      '<div class="fm-pdp" data-pdp><div class="fm-pdp__media"><div class="fm-pdp__stage" data-stage></div>' +
        '<div class="fm-thumbs" role="group" aria-label="View">' + [firstView(p), otherView(p)].map(function (v) {
          return '<button type="button" class="fm-thumb" data-action="view" data-value="' + v + '"><span class="fm-thumb__img" data-thumb="' + v + '"></span>' + viewLabel(v) + "</button>";
        }).join("") + "</div></div>" +
      '<div class="fm-pdp__info"><h1 class="fm-pdp__name">' + esc(p.name) + '</h1><p class="fm-pdp__price">' + money(p.price) + "</p>" +
        (p.description ? '<p class="fm-pdp__desc">' + esc(p.description) + "</p>" : "") +
        '<p class="fm-pdp__label">Color<span data-color-name></span></p><div class="fm-dots" role="group" aria-label="Color">' + colorKeys(p).map(function (k) {
          var ci = colorInfo(k);
          return '<button type="button" class="fm-dotbtn" data-action="color" data-value="' + esc(k) + '" aria-label="' + esc(ci.label) + '" title="' + esc(ci.label) +
            '"><span class="fm-dot" style="--sw:' + ci.hex + '"></span></button>';
        }).join("") + "</div>" +
        '<p class="fm-pdp__label">Size</p><div class="fm-sizes" role="group" aria-label="Size">' + p.sizes.map(function (s) {
          return '<button type="button" class="fm-size" data-action="size" data-value="' + esc(s) + '">' + esc(s) + "</button>";
        }).join("") + '</div><p class="fm-error" data-error hidden>Choose a size to add this to your cart.</p>' +
        '<p class="fm-pdp__label">Quantity</p><div class="fm-qty"><button type="button" data-action="qty-dec" aria-label="Decrease quantity">&minus;</button>' +
        '<span data-qty aria-live="polite">1</span><button type="button" data-action="qty-inc" aria-label="Increase quantity">+</button></div>' +
        '<div class="fm-pdp__buy"><button type="button" class="fm-btn fm-btn--gold fm-btn--block" data-action="add">Add to cart</button>' +
        '<p class="fm-pdp__ship">' + (typeof SHIPPING !== "undefined" ? "Free standard shipping on orders over " + money(SHIPPING.freeOver) + ". Printed to order." : "Shipping calculated at checkout.") + "</p></div></div></div>" +
      (related.length ? '<section class="fm-related" aria-labelledby="fm-rel-title"><h2 class="fm-section-title fm-display" id="fm-rel-title">More from the ' +
        esc(c.label.toLowerCase()) + "'s collection</h2>" + gridHTML(related) + "</section>" : "") +
      "</div></div>";
    var el = $("[data-pdp]", view);
    function sync(animate) {
      var stage = $("[data-stage]", el);
      stage.innerHTML = img(p, st.color, st.view, { eager: true });
      if (animate && !reduceMotion && stage.firstElementChild) stage.firstElementChild.classList.add("fm-fade");
      stage.setAttribute("data-color", st.color); stage.setAttribute("data-view", st.view);
      $$("[data-thumb]", el).forEach(function (t) { t.innerHTML = img(p, st.color, t.getAttribute("data-thumb"), { decorative: true, eager: true }); });
      [["color", st.color], ["view", st.view], ["size", st.size]].forEach(function (pair) {
        $$('[data-action="' + pair[0] + '"]', el).forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-value") === pair[1])); });
      });
      $("[data-color-name]", el).textContent = colorInfo(st.color).label;
      $("[data-qty]", el).textContent = st.qty;
      $('[data-action="qty-dec"]', el).disabled = st.qty <= 1;
    }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-action]"); if (!b) return;
      var a = b.getAttribute("data-action"), v = b.getAttribute("data-value");
      if (a === "color") { st.color = v; preload(p, v); history.replaceState(null, "", productUrl(p, v)); sync(true); }
      else if (a === "view") { st.view = v; sync(true); }
      else if (a === "size") { st.size = v; $("[data-error]", el).hidden = true; sync(false); }
      else if (a === "qty-inc") { st.qty = Math.min(99, st.qty + 1); sync(false); }
      else if (a === "qty-dec") { st.qty = Math.max(1, st.qty - 1); sync(false); }
      else if (a === "add") {
        if (!st.size) { $("[data-error]", el).hidden = false; $('[data-action="size"]', el).focus(); return; }
        addToCart(p.id, st.color, st.size, st.qty); openCart(b);
      }
    });
    sync(false);
    colorKeys(p).forEach(function (k) { if (k !== st.color) return; preload(p, k); });
  }

  /* ---------- Search ---------- */
  function searchPage(q) {
    var words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var list = !words.length ? [] : PRODUCTS.filter(function (p) {
      var hay = [p.name, p.description].concat(p.categories, colorKeys(p).map(function (k) { return colorInfo(k).label; })).join(" ").toLowerCase();
      return words.every(function (w) { return hay.indexOf(w) !== -1; });
    });
    setTitle("Search");
    view.innerHTML = '<div class="fm-page"><div class="fm-wrap">' + crumbs([["Shop", "/"], ["Search", "/search"]]) +
      '<div class="fm-page__head"><h1 class="fm-page__title fm-display">' + (q.trim() ? 'Results for "' + esc(q.trim()) + '"' : "Search") + "</h1></div>" +
      (list.length ? gridHTML(list) : '<div class="fm-note"><p>' + (q.trim() ? "Nothing matches that search." : "Type what you're looking for above.") +
        '</p><a class="fm-btn fm-btn--gold" href="/" data-link>Back to the shop</a></div>') + "</div></div>";
  }
  function successPage() {
    setTitle("Order confirmed");
    cart = []; saveCart(); renderCart();
    view.innerHTML = '<div class="fm-page"><div class="fm-wrap"><div class="fm-page__head"><div><p class="fm-kicker">Order confirmed</p>' +
      '<h1 class="fm-page__title fm-display">Thank you.</h1><p class="fm-page__intro">Your payment went through and a receipt is on its way to your email. ' +
      "Every shirt is printed to order, so please allow extra time. Kids' and adult shirts ship in separate packages.</p></div></div>" +
      '<a class="fm-btn fm-btn--gold" href="/" data-link>Keep shopping</a></div></div>';
  }
  function notFoundPage() {
    setTitle("Not found");
    view.innerHTML = '<div class="fm-page"><div class="fm-wrap"><div class="fm-page__head"><h1 class="fm-page__title fm-display">Page not found</h1></div>' +
      '<div class="fm-note"><p>That page isn\'t in the shop.</p><a class="fm-btn fm-btn--gold" href="/" data-link>Back to the shop</a></div></div></div>';
  }

  var searchForm = $("#fm-search"), searchInput = $("#fm-search-input"), searchBtn = $("#fm-search-open");
  function openSearch() { searchForm.hidden = false; searchBtn.setAttribute("aria-expanded", "true"); setMenu(false); searchInput.focus(); }
  function closeSearch() { searchForm.hidden = true; searchBtn.setAttribute("aria-expanded", "false"); searchBtn.focus(); }
  searchBtn.addEventListener("click", function () { searchForm.hidden ? openSearch() : closeSearch(); });
  $("#fm-search-close").addEventListener("click", closeSearch);
  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    go("/search?q=" + encodeURIComponent(searchInput.value.trim()));
  });

  /* ---------- Cart ---------- */
  var cart = loadCart(), drawer = $("#fm-drawer"), cartReturn = null;
  function loadCart() {
    try {
      var arr = JSON.parse(localStorage.getItem(SITE.storageKey) || "[]");
      if (!Array.isArray(arr)) return [];
      return arr.filter(function (i) { var p = byId(i.id); return p && p.colors[i.color] && p.sizes.indexOf(i.size) !== -1 && i.qty > 0; });
    } catch (e) { return []; }
  }
  function saveCart() { try { localStorage.setItem(SITE.storageKey, JSON.stringify(cart)); } catch (e) {} }
  function addToCart(id, color, size, qty) {
    var key = id + "|" + color + "|" + size;
    var existing = cart.find(function (i) { return i.key === key; });
    if (existing) existing.qty = Math.min(99, existing.qty + qty);
    else cart.push({ key: key, id: id, color: color, size: size, qty: qty });
    saveCart(); renderCart();
    $$("[data-cart-count]").forEach(function (b) { b.classList.remove("is-bump"); void b.offsetWidth; b.classList.add("is-bump"); });
    toast("Added " + byId(id).name + " to your cart");
  }
  function buildOrder() {
    var items = cart.map(function (i) {
      var p = byId(i.id);
      return { id: i.id, name: p.name, color: i.color, colorLabel: colorInfo(i.color).label, size: i.size, qty: i.qty, unitPrice: p.price, lineTotal: p.price * i.qty };
    });
    return { items: items, subtotal: items.reduce(function (s, i) { return s + i.lineTotal; }, 0), currency: SITE.currency };
  }
  function renderCart() {
    var order = buildOrder(), count = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    $$("[data-cart-count]").forEach(function (b) { b.textContent = count; b.hidden = count === 0; });
    $("#fm-cart-open").setAttribute("aria-label", "Open cart, " + count + (count === 1 ? " item" : " items"));
    $("#fm-subtotal").textContent = money(order.subtotal);
    if (typeof SHIPPING !== "undefined") {
      var left = SHIPPING.freeOver - order.subtotal;
      $("#fm-ship-note").textContent = (left > 0
        ? "Add " + money(left) + " more for free shipping. Otherwise " + money(SHIPPING.flatRate) + " flat."
        : "You've got free standard shipping.") + " Tax calculated at checkout.";
    }
    $("#fm-checkout").disabled = count === 0;
    if (count === 0) $("#fm-checkout-note").hidden = true;
    var list = $("#fm-cart-items");
    if (!cart.length) {
      list.innerHTML = '<li class="fm-cart-empty"><p>Your cart is empty.</p><button type="button" class="fm-btn" data-cart-close>Keep shopping</button></li>';
      return;
    }
    list.innerHTML = cart.map(function (i) {
      var p = byId(i.id);
      return '<li class="fm-line" data-key="' + esc(i.key) + '"><div class="fm-line__img">' + img(p, i.color, "front", { decorative: true }) + "</div>" +
        '<div><p class="fm-line__name"><a href="' + productUrl(p, i.color) + '" data-link>' + esc(p.name) + '</a></p><p class="fm-line__meta">' + esc(colorInfo(i.color).label) + ", size " + esc(i.size) + "</p>" +
        '<div class="fm-qty"><button type="button" data-cart="dec" aria-label="Decrease quantity"' + (i.qty <= 1 ? " disabled" : "") + ">&minus;</button>" +
        "<span>" + i.qty + '</span><button type="button" data-cart="inc" aria-label="Increase quantity">+</button></div></div>' +
        '<div class="fm-line__end"><span class="fm-line__price">' + money(p.price * i.qty) + "</span>" +
        '<button type="button" class="fm-link" data-cart="remove">Remove</button></div></li>';
    }).join("");
  }
  function setLock() { document.documentElement.classList.toggle("fm-lock", drawer.classList.contains("is-open")); }
  function openCart(trigger) {
    cartReturn = trigger || document.activeElement;
    setMenu(false);
    drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false"); setLock();
    setTimeout(function () { $("#fm-cart-close").focus(); }, 60);
  }
  function closeCart(restore) {
    if (!drawer.classList.contains("is-open")) return;
    drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true"); setLock();
    if (restore !== false && cartReturn && document.contains(cartReturn)) cartReturn.focus();
  }
  $("#fm-cart-open").addEventListener("click", function (e) { openCart(e.currentTarget); });
  $("#fm-fab").addEventListener("click", function (e) { openCart(e.currentTarget); });
  drawer.addEventListener("click", function (e) {
    if (e.target.closest("[data-cart-close]")) { closeCart(); return; }
    var b = e.target.closest("[data-cart]"); if (!b) return;
    var key = b.closest("[data-key]").getAttribute("data-key");
    var item = cart.find(function (i) { return i.key === key; }); if (!item) return;
    var act = b.getAttribute("data-cart");
    if (act === "inc") item.qty = Math.min(99, item.qty + 1);
    if (act === "dec") item.qty = Math.max(1, item.qty - 1);
    if (act === "remove") cart = cart.filter(function (i) { return i.key !== key; });
    saveCart(); renderCart();
    var again = $('[data-key="' + key + '"] [data-cart="' + act + '"]', drawer);
    (again && !again.disabled ? again : $("#fm-cart-close")).focus();
  });
  $("#fm-checkout").addEventListener("click", function () {
    var order = buildOrder(), btn = $("#fm-checkout"), n = $("#fm-checkout-note");
    if (!order.items.length) return;
    try { window.dispatchEvent(new CustomEvent("forge-merch:checkout", { detail: order })); } catch (e) {}
    btn.disabled = true; btn.textContent = "Opening secure checkout..."; n.hidden = true;
    fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.map(function (i) { return { id: i.id, color: i.color, size: i.size, qty: i.qty }; }) }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok && res.d.url) { window.location.href = res.d.url; return; }
        throw new Error(res.d.error || "Checkout failed");
      })
      .catch(function (e) {
        n.textContent = (e && e.message && e.message !== "Failed to fetch") ? e.message : "We couldn't reach checkout. Please try again.";
        n.hidden = false; btn.disabled = false; btn.textContent = "Checkout";
      });
  });
  window.addEventListener("storage", function (e) { if (e.key === SITE.storageKey) { cart = loadCart(); renderCart(); } });

  var toastTimer;
  function toast(msg) {
    var t = $("#fm-toast"); t.textContent = msg; t.classList.add("is-on");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 2200);
  }

  function trapTab(container, e) {
    var f = $$('button:not([disabled]),a[href],input,[tabindex]:not([tabindex="-1"])', container).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (drawer.classList.contains("is-open")) closeCart();
      else if (!searchForm.hidden) closeSearch();
      else if (nav.classList.contains("is-open")) { setMenu(false); menuBtn.focus(); }
    } else if (e.key === "Tab" && drawer.classList.contains("is-open")) trapTab($(".fm-drawer__panel"), e);
  });

  renderCart();
  render(false);
})();
