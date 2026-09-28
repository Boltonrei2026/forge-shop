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
  var scrollOpts = function () { return { behavior: reduceMotion ? "auto" : "smooth", block: "start" }; };

  PRODUCTS.forEach(function (p) {
    colorKeys(p).forEach(function (k) {
      if (!COLORS[k]) console.warn('[Forge merch] Color "' + k + '" on "' + p.id + '" is missing from COLORS.');
    });
  });

  /* ---------- Image (or placeholder) for exactly one product + color + view ---------- */
  function media(p, colorKey, view, variant) {
    var c = colorInfo(colorKey);
    var url = (p.colors[colorKey] || {})[view];
    var decorative = variant === "thumb" || variant === "line";
    if (url) {
      var alt = decorative ? "" : p.name + ", " + c.label + ", " + view + " view";
      return '<img src="' + esc(url) + '" alt="' + esc(alt) + '" decoding="async"' + (variant === "card" ? ' loading="lazy"' : "") + ">";
    }
    if (decorative) return '<div class="fm-ph fm-ph--thumb" aria-hidden="true"><span class="fm-ph__dot" style="--ph:' + c.hex + '"></span></div>';
    return '<div class="fm-ph" role="img" aria-label="Image needed: ' + esc(p.name + ", " + c.label + ", " + view) + '">' +
      '<span class="fm-ph__dot" style="--ph:' + c.hex + '"></span>' +
      '<span class="fm-ph__title">' + esc(p.name) + "</span>" +
      '<span class="fm-ph__meta">' + esc(c.label) + ", " + view + "</span>" +
      '<span class="fm-ph__path">' + esc(p.id) + " / " + esc(colorKey) + " / " + view + "</span></div>";
  }
  function preload(p, colorKey) {
    var slot = p.colors[colorKey] || {};
    ["front", "back"].forEach(function (v) { if (slot[v]) { var i = new Image(); i.src = slot[v]; } });
  }

  /* ---------- Controls shared by product blocks and the modal ---------- */
  function colorButtons(p, st) {
    return '<div class="fm-colors" role="group" aria-label="Color">' + colorKeys(p).map(function (k) {
      var c = colorInfo(k);
      return '<button type="button" class="fm-color" data-action="color" data-value="' + esc(k) + '" aria-pressed="' + (k === st.color) + '">' +
        '<span class="fm-dot" style="--sw:' + c.hex + '" aria-hidden="true"></span>' + esc(c.label) + "</button>";
    }).join("") + "</div>";
  }
  function viewText(st) {
    return '<div class="fm-views" role="group" aria-label="View">' + ["front", "back"].map(function (v) {
      return '<button type="button" class="fm-view" data-action="view" data-value="' + v + '" aria-pressed="' + (v === st.view) + '">' + viewLabel(v) + "</button>";
    }).join("") + "</div>";
  }
  function viewThumbs(st) {
    return '<div class="fm-pd__thumbs" role="group" aria-label="View">' + ["front", "back"].map(function (v) {
      return '<button type="button" class="fm-thumb" data-action="view" data-value="' + v + '" aria-pressed="' + (v === st.view) + '">' +
        '<span class="fm-thumb__img" data-thumb="' + v + '"></span>' + viewLabel(v) + "</button>";
    }).join("") + "</div>";
  }
  function sizeButtons(p, st) {
    return '<div class="fm-sizes" role="group" aria-label="Size">' + p.sizes.map(function (s) {
      return '<button type="button" class="fm-size" data-action="size" data-value="' + esc(s) + '" aria-pressed="' + (s === st.size) + '">' + esc(s) + "</button>";
    }).join("") + '</div><p class="fm-error" data-error hidden>Choose a size to add this to your cart.</p>';
  }

  /* Sync a block to its state. The main image always comes from color + view together. */
  function sync(el, p, st, animate) {
    var stage = $("[data-stage]", el);
    if (stage) {
      stage.innerHTML = media(p, st.color, st.view, stage.getAttribute("data-stage"));
      if (animate && !reduceMotion && stage.firstElementChild) stage.firstElementChild.classList.add("fm-fade");
      stage.setAttribute("data-color", st.color);
      stage.setAttribute("data-view", st.view);
    }
    $$("[data-thumb]", el).forEach(function (t) { t.innerHTML = media(p, st.color, t.getAttribute("data-thumb"), "thumb"); });
    [["color", st.color], ["view", st.view], ["size", st.size]].forEach(function (pair) {
      $$('[data-action="' + pair[0] + '"]', el).forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-value") === pair[1])); });
    });
    var cn = $("[data-color-name]", el); if (cn) cn.textContent = colorInfo(st.color).label;
    var q = $("[data-qty]", el); if (q) q.textContent = st.qty;
    var dec = $('[data-action="qty-dec"]', el); if (dec) dec.disabled = st.qty <= 1;
  }
  function syncProduct(p, except) {
    $$('#fm-catalog [data-id="' + p.id + '"]').forEach(function (el) { if (el !== except) sync(el, p, cardState[p.id], false); });
  }

  function handle(action, value, el, p, st) {
    if (action === "color") { st.color = value; sync(el, p, st, true); preload(p, value); }
    else if (action === "view") { st.view = value; sync(el, p, st, true); }
    else if (action === "size") { st.size = value; $("[data-error]", el).hidden = true; sync(el, p, st, false); }
    else if (action === "qty-inc") { st.qty = Math.min(99, st.qty + 1); sync(el, p, st, false); }
    else if (action === "qty-dec") { st.qty = Math.max(1, st.qty - 1); sync(el, p, st, false); }
    else if (action === "add") {
      if (!st.size) {
        $("[data-error]", el).hidden = false;
        var first = $('[data-action="size"]', el); if (first) first.focus();
        return false;
      }
      addToCart(p.id, st.color, st.size, st.qty || 1);
      return true;
    }
    return false;
  }

  /* ---------- Header, logo, nav ---------- */
  function logoHTML() {
    return SITE.logoUrl ? '<img src="' + esc(SITE.logoUrl) + '" alt="' + esc(SITE.logoAlt) + '">' : '<span class="fm-logo__text">Forge Learning Academy</span>';
  }
  var homeUrl = (SITE.nav[0] && SITE.nav[0].url) || "#";
  if (!SITE.showHeader) { $("#fm-header").hidden = true; $("#fm-fab").hidden = false; }
  ["#fm-logo", "#fm-footer-logo"].forEach(function (s) { $(s).href = homeUrl; $(s).innerHTML = logoHTML(); });
  $("#fm-try").href = SITE.tryForgeUrl;
  var anchorAttr = function (url) { return url.charAt(0) === "#" ? " data-scroll" : ""; };
  $("#fm-nav-list").innerHTML = SITE.nav.map(function (l) {
    return '<li><a href="' + esc(l.url) + '"' + (l.current ? ' aria-current="page"' : "") + anchorAttr(l.url) + ">" + esc(l.label) + "</a></li>";
  }).join("") + '<li class="fm-nav__cta"><a class="fm-btn fm-btn--gold" href="' + esc(SITE.tryForgeUrl) + '">Try Forge Free</a></li>';
  $("#fm-footer-links").innerHTML = SITE.nav.map(function (l) {
    return '<a href="' + esc(l.url) + '"' + anchorAttr(l.url) + ">" + esc(l.label) + "</a>";
  }).join("");
  $("#fm-year").textContent = new Date().getFullYear();

  var menuBtn = $("#fm-menu-toggle"), nav = $("#fm-nav");
  function setMenu(open) { nav.classList.toggle("is-open", open); menuBtn.setAttribute("aria-expanded", String(open)); }
  menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });

  /* ---------- Hero ---------- */
  if (SITE.heroImage && SITE.heroImageIsProduct) $("#fm-hero-media").classList.add("is-product");
  $("#fm-hero-media").innerHTML = SITE.heroImage
    ? '<img src="' + esc(SITE.heroImage) + '" alt="' + esc(SITE.heroImageAlt) + '">'
    : '<div class="fm-ph fm-ph--dark" role="img" aria-label="Image needed: hero campaign photo"><span class="fm-ph__title">Campaign photo</span><span class="fm-ph__path">SITE.heroImage</span></div>';

  /* ---------- Catalog: collection sections with editorial statements ---------- */
  var activeTrack = "all", searchQuery = "";
  var cardState = {};
  PRODUCTS.forEach(function (p) { cardState[p.id] = { color: colorKeys(p)[0], view: "front", size: null, qty: 1 }; });
  var productsIn = function (key) { return PRODUCTS.filter(function (p) { return p.categories.indexOf(key) !== -1; }); };

  function passes(p) {
    if (activeTrack !== "all" && p.categories.indexOf(activeTrack) === -1) return false;
    var words = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return true;
    var hay = [p.name, p.description].concat(p.categories, colorKeys(p).map(function (k) { return colorInfo(k).label; })).join(" ").toLowerCase();
    return words.every(function (w) { return hay.indexOf(w) !== -1; });
  }

  function productHTML(p) {
    var st = cardState[p.id];
    return '<article class="fm-product" data-id="' + esc(p.id) + '">' +
      '<div class="fm-product__head"><h3 class="fm-product__name">' + esc(p.name) + '</h3><span class="fm-price">' + money(p.price) + "</span></div>" +
      '<button type="button" class="fm-product__stage" data-action="details" aria-label="See details for ' + esc(p.name) + '"><div class="fm-stage" data-stage="card"></div></button>' +
      '<div class="fm-product__opts">' + colorButtons(p, st) + viewText(st) + "</div>" +
      sizeButtons(p, st) +
      '<div class="fm-product__buy"><button type="button" class="fm-btn fm-btn--gold fm-btn--block" data-action="add">Add to cart</button>' +
      '<button type="button" class="fm-link" data-action="details">View details</button></div></article>';
  }

  function renderNav() {
    $("#fm-catnav-list").innerHTML = Object.keys(SITE.collections).map(function (k) {
      var empty = !productsIn(k).length;
      return '<button type="button" class="fm-catlink" data-jump="' + esc(k) + '" data-empty="' + empty + '">' + esc(SITE.collections[k].label) +
        (empty ? '<span class="fm-sr">, not in the shop yet</span>' : "") + "</button>";
    }).join("");
    $("#fm-tracks").innerHTML = TRACKS.map(function (t) {
      return '<button type="button" class="fm-track" data-track="' + esc(t.id) + '" aria-pressed="' + (t.id === activeTrack) + '">' + esc(t.label) + "</button>";
    }).join("");
    $("#fm-tracks").style.display = "contents";
    var kidsBtns = ["boys", "girls"].filter(function (k) { return SITE.collections[k] && productsIn(k).length; });
    $("#fm-kids-btns").innerHTML = kidsBtns.map(function (k, i) {
      return '<button type="button" class="fm-btn ' + (i ? "fm-btn--line" : "fm-btn--gold") + '" data-jump="' + k + '">Shop ' + esc(SITE.collections[k].label.toLowerCase()) + "</button>";
    }).join("");
  }

  function renderCatalog() {
    var html = "", n = 0, anyShown = false, searching = !!searchQuery.trim();
    var track = TRACKS.find(function (t) { return t.id === activeTrack; });
    Object.keys(SITE.collections).forEach(function (key) {
      var all = productsIn(key); if (!all.length) return;
      var shown = all.filter(passes);
      if (searching && !shown.length) return;
      anyShown = anyShown || shown.length > 0;
      var c = SITE.collections[key];
      html += '<section class="fm-collection" id="fm-c-' + esc(key) + '" aria-labelledby="fm-c-' + esc(key) + '-t"><div class="fm-wrap">' +
        '<div class="fm-collection__head"><h2 class="fm-collection__title fm-display" id="fm-c-' + esc(key) + '-t">' + esc(c.title || c.label) + "</h2>" +
        (c.intro ? '<p class="fm-collection__intro">' + esc(c.intro) + "</p>" : "") + "</div>" +
        (c.banner ? '<div class="fm-collection__banner"><img src="' + esc(c.banner) + '" alt="" loading="lazy"></div>' : "") +
        (shown.length ? '<div class="fm-products">' + shown.map(productHTML).join("") + "</div>"
          : '<p class="fm-collection__none">No ' + esc(track.label.toLowerCase()) + " designs in this collection yet.</p>") +
        "</div></section>";
      if (!searching && SITE.statements[n]) {
        html += '<section class="fm-statement" aria-label="' + esc(SITE.statements[n]) + '"><div class="fm-wrap"><p class="fm-display">' + esc(SITE.statements[n]) + "</p></div></section>";
      }
      n++;
    });
    if (searching && !anyShown) {
      html = '<div class="fm-wrap fm-search-empty"><p>Nothing matches "' + esc(searchQuery.trim()) + '".</p><button type="button" class="fm-btn fm-btn--line" data-reset>Clear search</button></div>';
    }
    $("#fm-catalog").innerHTML = html;
    PRODUCTS.forEach(function (p) { syncProduct(p, null); });
  }

  function setTrack(id) {
    activeTrack = id;
    $$(".fm-track").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-track") === id)); });
    renderCatalog();
  }
  function clearSearch() { searchQuery = ""; $("#fm-search-input").value = ""; }
  function jumpTo(key) {
    var c = SITE.collections[key];
    if (!productsIn(key).length) { toast(c.label + " isn't in the shop yet."); return; }
    if (searchQuery.trim() || (activeTrack !== "all" && !productsIn(key).some(passes))) { clearSearch(); activeTrack = "all"; renderNav(); renderCatalog(); }
    setMenu(false);
    var sec = $("#fm-c-" + key); if (sec) sec.scrollIntoView(scrollOpts());
  }

  root.addEventListener("click", function (e) {
    var j = e.target.closest("[data-jump]"); if (j) { jumpTo(j.getAttribute("data-jump")); return; }
    var t = e.target.closest("[data-track]"); if (t) { setTrack(t.getAttribute("data-track")); return; }
    if (e.target.closest("#fm-catalog [data-reset]")) { clearSearch(); renderCatalog(); return; }
    var a = e.target.closest("a[data-scroll]");
    if (a) {
      var target = document.querySelector(a.getAttribute("href"));
      if (target) { e.preventDefault(); setMenu(false); target.scrollIntoView(scrollOpts()); }
      return;
    }
    var btn = e.target.closest("#fm-catalog [data-action]"); if (!btn) return;
    var block = btn.closest(".fm-product"); if (!block) return;
    var p = byId(block.getAttribute("data-id")), st = cardState[p.id], action = btn.getAttribute("data-action");
    if (action === "details") { openModal(p.id, btn); return; }
    var added = handle(action, btn.getAttribute("data-value"), block, p, st);
    syncProduct(p, block);
    if (added && action === "add") openCart(btn);
  });

  /* ---------- Search ---------- */
  var searchBar = $("#fm-search"), searchInput = $("#fm-search-input"), searchBtn = $("#fm-search-open");
  function openSearch() { searchBar.hidden = false; searchBtn.setAttribute("aria-expanded", "true"); setMenu(false); searchInput.focus(); }
  function closeSearch() { searchBar.hidden = true; searchBtn.setAttribute("aria-expanded", "false"); if (searchQuery) { clearSearch(); renderCatalog(); } searchBtn.focus(); }
  searchBtn.addEventListener("click", function () { searchBar.hidden ? openSearch() : closeSearch(); });
  $("#fm-search-close").addEventListener("click", closeSearch);
  searchInput.addEventListener("input", function () { searchQuery = searchInput.value; renderCatalog(); });
  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); var first = $("#fm-catalog .fm-collection, #fm-catalog .fm-search-empty"); if (first) first.scrollIntoView(scrollOpts()); }
  });

  /* ---------- Overlays ---------- */
  function setLock() {
    var open = !$("#fm-modal").hidden || $("#fm-drawer").classList.contains("is-open");
    document.documentElement.classList.toggle("fm-lock", open);
  }
  function trapTab(container, e) {
    var f = $$('button:not([disabled]),a[href],input,[tabindex]:not([tabindex="-1"])', container).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Product detail modal ---------- */
  var modal = $("#fm-modal"), modalBody = $("#fm-modal-body"), modalState = null, modalReturn = null;
  function openModal(id, trigger) {
    var p = byId(id), cs = cardState[id];
    modalState = { id: id, color: cs.color, view: cs.view, size: cs.size, qty: 1 };
    modalReturn = trigger || document.activeElement;
    modalBody.innerHTML =
      '<div class="fm-pd"><div class="fm-pd__media"><div class="fm-stage" data-stage="large"></div>' + viewThumbs(modalState) + "</div>" +
      '<div class="fm-pd__info"><h2 class="fm-pd__name" id="fm-modal-title">' + esc(p.name) + "</h2>" +
      '<p class="fm-pd__price">' + money(p.price) + "</p>" +
      (p.description ? '<p class="fm-pd__desc">' + esc(p.description) + "</p>" : "") +
      '<p class="fm-pd__label">Color</p>' + colorButtons(p, modalState) +
      '<p class="fm-pd__label">Size</p>' + sizeButtons(p, modalState) +
      '<p class="fm-pd__label">Quantity</p><div class="fm-qty">' +
        '<button type="button" data-action="qty-dec" aria-label="Decrease quantity">&minus;</button><span data-qty aria-live="polite">1</span>' +
        '<button type="button" data-action="qty-inc" aria-label="Increase quantity">+</button></div>' +
      '<div class="fm-product__buy"><button type="button" class="fm-btn fm-btn--gold fm-btn--block" data-action="add">Add to cart</button>' +
      '<p class="fm-pd__ship">Shipping calculated at checkout.</p></div></div></div>';
    sync(modalBody, p, modalState, false);
    modal.hidden = false; setLock();
    $(".fm-modal__close", modal).focus();
  }
  function closeModal(restoreFocus) {
    if (modal.hidden) return;
    var p = byId(modalState.id), cs = cardState[p.id];
    cs.color = modalState.color; cs.view = modalState.view; if (modalState.size) cs.size = modalState.size;
    syncProduct(p, null);
    modal.hidden = true; modalBody.innerHTML = ""; setLock();
    if (restoreFocus !== false && modalReturn && document.contains(modalReturn)) modalReturn.focus();
  }
  modal.addEventListener("click", function (e) {
    if (e.target.closest("[data-modal-close]")) { closeModal(); return; }
    var btn = e.target.closest("[data-action]"); if (!btn || !modalState) return;
    var p = byId(modalState.id), action = btn.getAttribute("data-action");
    if (handle(action, btn.getAttribute("data-value"), modalBody, p, modalState) && action === "add") {
      var back = modalReturn; closeModal(false); openCart(back);
    }
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
    $("#fm-checkout").disabled = count === 0;
    if (count === 0) $("#fm-checkout-note").hidden = true;
    var list = $("#fm-cart-items");
    if (!cart.length) {
      list.innerHTML = '<li class="fm-cart-empty"><p>Your cart is empty.</p><button type="button" class="fm-btn" data-cart-close>Keep shopping</button></li>';
      return;
    }
    list.innerHTML = cart.map(function (i) {
      var p = byId(i.id);
      return '<li class="fm-line" data-key="' + esc(i.key) + '"><div class="fm-line__img">' + media(p, i.color, "front", "line") + "</div>" +
        '<div><p class="fm-line__name">' + esc(p.name) + '</p><p class="fm-line__meta">' + esc(colorInfo(i.color).label) + ", size " + esc(i.size) + "</p>" +
        '<div class="fm-qty"><button type="button" data-cart="dec" aria-label="Decrease quantity"' + (i.qty <= 1 ? " disabled" : "") + ">&minus;</button>" +
        "<span>" + i.qty + '</span><button type="button" data-cart="inc" aria-label="Increase quantity">+</button></div></div>' +
        '<div class="fm-line__end"><span class="fm-line__price">' + money(p.price * i.qty) + "</span>" +
        '<button type="button" class="fm-link" data-cart="remove">Remove</button></div></li>';
    }).join("");
  }
  function openCart(trigger) {
    cartReturn = trigger || document.activeElement;
    setMenu(false);
    drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false"); setLock();
    setTimeout(function () { $("#fm-cart-close").focus(); }, 60);
  }
  function closeCart() {
    if (!drawer.classList.contains("is-open")) return;
    drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true"); setLock();
    if (cartReturn && document.contains(cartReturn)) cartReturn.focus();
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
    var order = buildOrder();
    if (!order.items.length) return;
    try { window.dispatchEvent(new CustomEvent("forge-merch:checkout", { detail: order })); } catch (e) {}
    var handled = false;
    try { handled = forgeMerchCheckout(order) === true; } catch (e) { console.error("[Forge merch] checkout hook failed", e); }
    if (!handled) {
      var n = $("#fm-checkout-note");
      n.textContent = "Online checkout isn't connected yet. Your cart is saved on this device.";
      n.hidden = false;
    }
  });

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $("#fm-toast"); t.textContent = msg; t.classList.add("is-on");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 2200);
  }

  /* ---------- Keyboard ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (!modal.hidden) closeModal();
      else if (drawer.classList.contains("is-open")) closeCart();
      else if (!searchBar.hidden) closeSearch();
      else if (nav.classList.contains("is-open")) { setMenu(false); menuBtn.focus(); }
    } else if (e.key === "Tab") {
      if (!modal.hidden) trapTab($(".fm-modal__panel"), e);
      else if (drawer.classList.contains("is-open")) trapTab($(".fm-drawer__panel"), e);
    }
  });

  renderNav();
  renderCatalog();
  renderCart();
})();
