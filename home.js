/* =====================================================================
   Uploaded — home.js
   Monographie d'atelier. Autonome (FR). Aucune dépendance à script.js/i18n.js.
   ===================================================================== */
(function () {
  "use strict";
  // Disposition de la maquette en test : visible seulement sur uploaded.be/?test
  if (/[?&]test\b/.test(location.search)) document.documentElement.classList.add("layout-test");
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var STILL = /[?&]still\b/.test(window.location.search); /* mode capture : fige les entrées */
  if (STILL) { prefersReduced = true; document.documentElement.classList.add("capture"); }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- Année ---- */
  $$(".js-year").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---- Reveal ---- */
  var revealEls = $$(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { ro.observe(el); });
  }

  /* ---- Masthead : barre givrée dès 40 px de défilement (comme jaydenmusic.com) ---- */
  var masthead = $("#masthead");
  var cover = $(".cover");
  if (masthead) {
    var onScroll = function () { masthead.classList.toggle("is-scrolled", window.scrollY > 40); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---- Lien actif selon la section visible ---- */
  if ("IntersectionObserver" in window) {
    var navLinks = $$(".nav-links a[href^='#'], .nav-drawer a[href^='#']");
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach(function (sec) { spy.observe(sec); });
  }

  /* ---- Menu mobile ---- */
  var toggle = $(".nav-toggle");
  if (toggle) {
    var closeNav = function () { document.body.classList.remove("nav-open"); toggle.setAttribute("aria-expanded", "false"); };
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$(".nav-drawer a").forEach(function (el) { el.addEventListener("click", closeNav); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });
  }

  /* ---- Bouton haut de page ---- */
  var toTop = $("#to-top");
  if (toTop) {
    toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" }); });
    if ("IntersectionObserver" in window && cover) {
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { toTop.classList.toggle("show", !e.isIntersecting); });
      }, { threshold: 0 });
      tio.observe(cover);
    }
  }

  /* ---- Mobile : boutons flottants masqués sur la fiche d'un projet ---- */
  var scInfo = $(".showcase-info");
  if (scInfo && "IntersectionObserver" in window) {
    var small = window.matchMedia("(max-width: 900px)");
    var infoSeen = false;
    var syncFab = function () { document.body.classList.toggle("fab-hidden", infoSeen && small.matches); };
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { infoSeen = e.isIntersecting; });
      syncFab();
    }, { threshold: 0 }).observe(scInfo);
    if (small.addEventListener) small.addEventListener("change", syncFab);
  }

  /* ---- Formulaire de contact (AJAX formsubmit, reste sur la page) ---- */
  (function () {
    var form = $("#contact-form");
    var message = $("#form-message");
    if (!form || !message) return;
    var nameInput = form.elements.namedItem("name");
    var emailInput = form.elements.namedItem("email");
    var submitBtn = $("#contact-submit");
    var formCheck = $("#form-check");
    var endpoint = (form.dataset.endpoint || "").trim();
    if (endpoint) form.setAttribute("action", endpoint);

    // Préremplissage depuis le Labo (estimateur) : ?projet=…&type=…
    try {
      var qs = new URLSearchParams(window.location.search);
      var pre = qs.get("projet"), preType = qs.get("type");
      var msgEl = form.elements.namedItem("message"), typeEl = form.elements.namedItem("Type de projet");
      if (pre && msgEl && !msgEl.value) msgEl.value = pre;
      if (preType && typeEl) {
        var want = preType.toLowerCase();
        Array.prototype.some.call(typeEl.options, function (o) {
          var t = o.text.toLowerCase();
          var hit = (want.indexOf("mobile") > -1 && t.indexOf("mobile") > -1) || (want.indexOf("ia") === 0 || want.indexOf("assistant") > -1) && t.indexOf("intelligence") > -1
            || (want.indexOf("bot") > -1 && t.indexOf("bot ") === 0) || (want.indexOf("sur mesure") > -1 && t.indexOf("autre") === 0)
            || ((want.indexOf("site") > -1 || want.indexOf("e-commerce") > -1) && t.indexOf("site web") === 0);
          if (hit) typeEl.value = o.value || o.text;
          return hit;
        });
      }
      if (pre || preType) { history.replaceState(null, "", window.location.pathname + window.location.hash); }
    } catch (e) {}

    function showError(msg) { message.className = "form-message error"; message.textContent = msg; }
    // Repli : si l'envoi échoue, la demande n'est pas perdue — on propose
    // WhatsApp, avec le message déjà rédigé. Aucune adresse e-mail n'est
    // écrite dans la page : les robots à spam n'ont rien à y ramasser.
    function showFallback(msg) {
      var wa = (form.dataset.whatsapp || "").trim();
      message.className = "form-message error";
      message.textContent = msg;
      if (!wa) return;
      var typeEl = form.elements.namedItem("Téléphone");
      var msgEl = form.elements.namedItem("message");
      var body = "Bonjour, ma demande depuis uploaded.be n'est pas partie."
        + "\nNom / entreprise : " + nameInput.value.trim()
        + "\nE-mail : " + emailInput.value.trim()
        + "\nTéléphone : " + ((typeEl && typeEl.value) || "—")
        + "\n\n" + ((msgEl && msgEl.value.trim()) || "");
      var a = document.createElement("a");
      a.href = wa + "?text=" + encodeURIComponent(body);
      a.target = "_blank"; a.rel = "noopener";
      a.className = "form-fallback";
      a.textContent = "Envoyer par WhatsApp";
      message.appendChild(document.createTextNode(" "));
      message.appendChild(a);
    }
    function showSuccess(msg) {
      if (formCheck) { void formCheck.offsetWidth; formCheck.classList.add("show"); }
      message.className = "form-message success"; message.textContent = msg;
    }
    function setLoading(on) {
      if (!submitBtn) return;
      submitBtn.disabled = on;
      submitBtn.innerHTML = on ? "Envoi…" : 'Envoyer ma demande <span class="btn-ar" aria-hidden="true">→</span>';
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      message.className = "form-message";
      nameInput.classList.remove("invalid");
      emailInput.classList.remove("invalid");
      if (formCheck) formCheck.classList.remove("show");

      var name = nameInput.value.trim();
      var email = emailInput.value.trim();
      var emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      var gotcha = form.elements.namedItem("_gotcha");
      if (gotcha && gotcha.value) return;

      if (!name) nameInput.classList.add("invalid");
      if (!emailValid) emailInput.classList.add("invalid");
      if (!name || !emailValid) {
        showError("Merci d'indiquer votre nom et une adresse e-mail valide.");
        return;
      }

      if (!endpoint) { form.submit(); return; }
      setLoading(true);
      fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (res) {
          setLoading(false);
          if (res.ok) {
            showSuccess("Merci " + name + " ! Votre demande est envoyée, je vous réponds à " + email + " sous 24 h.");
            form.reset();
          } else {
            showFallback("Un souci est survenu. Réessayez, appelez-moi au 0460 96 21 46, ou :");
          }
        })
        .catch(function () {
          setLoading(false);
          showFallback("Connexion impossible. Réessayez, appelez-moi au 0460 96 21 46, ou :");
        });
    });
  })();

  /* ---- Hero : réseau de nœuds interactif (constellation 3D — web / IA / crypto / bots) ---- */
  (function () {
    var canvas = $("[data-forge]");
    if (!canvas) return;
    var cover = $(".cover");
    var ctx = null;
    try { ctx = canvas.getContext("2d"); } catch (e) {}
    if (!ctx) return; /* repli CSS (dégradé sombre déjà en place) */

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(W * dpr));
      canvas.height = Math.max(1, Math.floor(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    var nodes = [];
    function build() {
      var n = Math.round((W * H) / 15000);
      n = Math.max(26, Math.min(W < 640 ? 44 : 90, n));
      nodes = [];
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * 2 - 1,
          vx: (Math.random() * 2 - 1) * 0.00018, vy: (Math.random() * 2 - 1) * 0.00018, vz: (Math.random() * 2 - 1) * 0.00018
        });
      }
    }
    build();

    var mouse = { x: 0.5, y: 0.5, active: false };
    var rotX = 0.06, rotY = 0, tRotX = 0.06, tRotY = 0;
    if (finePointer && !prefersReduced) {
      window.addEventListener("pointermove", function (e) {
        var r = cover.getBoundingClientRect();
        mouse.x = (e.clientX - r.left) / r.width;
        mouse.y = (e.clientY - r.top) / r.height;
        mouse.active = (e.clientY - r.top) < r.height + 60 && (e.clientY - r.top) > -60;
        tRotY = (mouse.x - 0.5) * 0.6;
        tRotX = 0.06 + (mouse.y - 0.5) * -0.4;
      }, { passive: true });
      window.addEventListener("pointerleave", function () { mouse.active = false; tRotY = 0; tRotX = 0.06; });
    }

    var CONN = 130, running = true, visible = true, started = false, raf = 0, t = 0;
    var P = [];

    function frame() {
      raf = 0;
      if (!running || !visible) return;
      t += 1;
      rotY += (tRotY - rotY) * 0.05; rotX += (tRotX - rotX) * 0.05;
      var ry = rotY + t * 0.0009, rx = rotX;
      var cosY = Math.cos(ry), sinY = Math.sin(ry), cosX = Math.cos(rx), sinX = Math.sin(rx);
      var spread = Math.min(W, H) * 0.62;
      var cx = W * (W > 820 ? 0.6 : 0.5), cy = H * 0.5, focal = 640;

      P.length = 0;
      for (var i = 0; i < nodes.length; i++) {
        var nd = nodes[i];
        nd.x += nd.vx; nd.y += nd.vy; nd.z += nd.vz;
        if (nd.x > 1 || nd.x < -1) nd.vx *= -1;
        if (nd.y > 1 || nd.y < -1) nd.vy *= -1;
        if (nd.z > 1 || nd.z < -1) nd.vz *= -1;
        var x = nd.x * spread, y = nd.y * spread, z = nd.z * spread;
        var x1 = x * cosY - z * sinY, z1 = x * sinY + z * cosY;
        var y1 = y * cosX - z1 * sinX, z2 = y * sinX + z1 * cosX;
        var sc = focal / (focal + z2 + spread);
        P.push({ sx: cx + x1 * sc, sy: cy + y1 * sc, sc: sc });
      }

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter"; /* bloom additif — les lueurs s'additionnent */

      /* connexions entre nœuds proches */
      for (var a = 0; a < P.length; a++) {
        for (var b = a + 1; b < P.length; b++) {
          var dx = P[a].sx - P[b].sx, dy = P[a].sy - P[b].sy;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONN) {
            var al = (1 - d / CONN) * 0.32 * Math.min(P[a].sc, P[b].sc);
            if (al > 0.015) {
              ctx.strokeStyle = "rgba(99,102,241," + al.toFixed(3) + ")";
              ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(P[a].sx, P[a].sy); ctx.lineTo(P[b].sx, P[b].sy); ctx.stroke();
            }
          }
        }
      }

      /* nœuds (+ halo & liens au curseur) */
      var mx = mouse.x * W, my = mouse.y * H;
      for (var k = 0; k < P.length; k++) {
        var p = P[k], near = 0;
        if (mouse.active) {
          var ex = p.sx - mx, ey = p.sy - my, dm = Math.sqrt(ex * ex + ey * ey);
          if (dm < 150) {
            near = 1 - dm / 150;
            ctx.strokeStyle = "rgba(192,132,252," + (near * 0.55 * p.sc).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(p.sx, p.sy); ctx.stroke();
          }
        }
        var r = (1.0 + p.sc * 1.5) * (1 + near * 1.3);
        /* halo doux (2 arcs, sans shadowBlur global pour la perf) */
        ctx.fillStyle = "rgba(120,108,240," + (0.05 + 0.08 * p.sc + near * 0.32).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(p.sx, p.sy, r * 3.2, 0, 6.283); ctx.fill(); /* halo bloom */
        ctx.fillStyle = "rgba(150,138,235," + (0.10 + 0.14 * p.sc).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(p.sx, p.sy, r * 1.7, 0, 6.283); ctx.fill(); /* lueur médiane */
        ctx.fillStyle = near > 0.15
          ? "rgba(224,208,255," + (0.85 + near * 0.15).toFixed(3) + ")"
          : "rgba(170,158,245," + (0.4 + p.sc * 0.5).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, 6.283); ctx.fill(); /* cœur */
      }
      ctx.globalCompositeOperation = "source-over";

      if (!started) { started = true; canvas.classList.add("is-live"); }
      if (!prefersReduced) raf = requestAnimationFrame(frame);
    }
    function loop() { if (!raf && running && visible) raf = requestAnimationFrame(frame); }

    var rt = null;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { resize(); build(); if (prefersReduced) frame(); }, 180); });

    if ("IntersectionObserver" in window && cover) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { visible = en.isIntersecting; if (visible) loop(); });
      }, { threshold: 0 });
      vio.observe(cover);
    }
    document.addEventListener("visibilitychange", function () { if (document.hidden) running = false; else { running = true; loop(); } });

    if (prefersReduced) frame(); /* une seule image figée */
    else loop();
  })();

  /* ------------------------------------------------------------ Showcase « aperçu PC + mobile »
     Maquette navigateur + téléphone qui défile entre les projets, parallaxe 3D à la souris.
     Rotation auto 5,5 s (pause au survol / hors viewport / onglet caché), figée sous
     prefers-reduced-motion. Cliquer l'aperçu ouvre le site. */
  (function () {
    var showcase = $("[data-showcase]");
    if (!showcase) return;
    var PROJECTS = [
      { host: "pizzeriapino.be", url: "https://pizzeriapino.be/", desktop: "img/pizzapino-desktop.webp?v=7", mobile: "img/pizzapino-mobile.webp?v=8", name: "Pizzeria Pino", kind: "Site web · Restaurant italien", desc: "Un restaurant italien à Nandrin : la carte, la réservation et l'appel en un geste, depuis le téléphone.", tags: ["Carte en ligne", "Réservation", "Appel direct"] },
      { host: "jaydenmusic.com", url: "https://jaydenmusic.com/", desktop: "img/jaydenmusic-desktop.webp?v=7", mobile: "img/jaydenmusic-mobile.webp?v=8", name: "Jayden", kind: "Site web · Artiste musical", desc: "Le site officiel d'un chanteur pop-rock, en français et en anglais : son album, ses clips, ses concerts.", tags: ["FR / EN", "Musique & clips", "Actus"] },
      { host: "yumea-wellness.be", url: "https://yumea-wellness.be/", desktop: "img/yumea-desktop.webp?v=7", mobile: "img/yumea-mobile.webp?v=8", name: "Yuméa Wellness", glow: .3, kind: "Site web · Bien-être & Head Spa", desc: "Un institut de Head Spa japonais : les rituels et leurs tarifs, les bons cadeaux, la prise de rendez-vous.", tags: ["Rituels & tarifs", "Bons cadeaux", "Rendez-vous"] },
      { host: "crypto-nauts.com", url: "https://crypto-nauts.com/", desktop: "img/cryptonauts-desktop.webp?v=1", mobile: "img/cryptonauts-mobile.webp?v=1", name: "Cryptonauts", kind: "Site web · Collection NFT", desc: "L'univers d'une collection NFT sur la blockchain Cronos : les collections, le classement des détenteurs, un bot de ventes.", tags: ["Collections", "Classement", "Bot de ventes"] }
    ];
    var warmed = {};
    function warm(i) {
      var k = (i + PROJECTS.length) % PROJECTS.length, p = PROJECTS[k];
      if (!p || warmed[k]) return;
      warmed[k] = true;
      new Image().src = p.desktop;
      new Image().src = p.mobile;
    }

    var q = function (s) { return showcase.querySelector(s); };
    var elDesktop = q("[data-sc-desktop]"), elMobile = q("[data-sc-mobile]");
    var elUrl = q("[data-sc-url]"), elKind = q("[data-sc-kind]"), elTitle = q("[data-sc-title]");
    var elDesc = q("[data-sc-desc]"), elLink = q("[data-sc-link]"), elTags = q("[data-sc-tags]");
    var tabsWrap = q("[data-sc-tabs]");
    var devicesEl = q("[data-devices]");
    var INT = prefersReduced ? 0 : 5500;
    showcase.style.setProperty("--sc-int", INT + "ms");
    var index = 0, timer = null, started = false;

    if (devicesEl) {
      devicesEl.classList.add("is-clickable");
      devicesEl.setAttribute("role", "link");
      devicesEl.setAttribute("tabindex", "0");
      var openProject = function () { var u = PROJECTS[index] && PROJECTS[index].url; if (u) window.open(u, "_blank", "noopener"); };
      var swipedAt = 0;
      devicesEl.addEventListener("click", function () { if (Date.now() - swipedAt > 500) openProject(); });
      devicesEl.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openProject(); } });
    }

    var tabs = PROJECTS.map(function (p, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "sc-tab"; b.setAttribute("role", "tab");
      b.innerHTML = '<span class="sc-n">' + (i < 9 ? "0" : "") + (i + 1) + '</span><span class="sc-name"></span>'
        + '<span class="sc-bar" aria-hidden="true"><span class="sc-dot-fill"></span></span>';
      b.querySelector(".sc-name").textContent = p.name;
      b.addEventListener("click", function () { if (!started) { started = true; showcase.classList.add("is-live"); } go(i, true); arm(); });
      tabsWrap.appendChild(b);
      return b;
    });

    function restartFill(i) {
      if (prefersReduced) return;
      var fill = tabs[i] && tabs[i].querySelector(".sc-dot-fill");
      if (!fill) return;
      fill.style.animation = "none"; void fill.offsetWidth; fill.style.animation = "";
    }
    function paintScreens(i) {
      var p = PROJECTS[i];
      if (elDesktop) { elDesktop.src = p.desktop; elDesktop.alt = p.name + " — aperçu du site (version ordinateur)"; }
      if (elMobile) elMobile.src = p.mobile;
    }
    function paint(i) { paintScreens(i); paintInfo(i); setAmbient(PROJECTS[i].desktop, PROJECTS[i].glow); }
    function paintInfo(i) {
      var p = PROJECTS[i];
      if (elUrl) elUrl.textContent = p.host;
      if (elLink) elLink.href = p.url;
      if (elKind) elKind.textContent = p.kind;
      if (elTitle) elTitle.textContent = p.name;
      if (elDesc) elDesc.textContent = p.desc;
      if (elTags) {
        elTags.textContent = "";
        (p.tags || []).forEach(function (t) { var li = document.createElement("li"); li.textContent = t; elTags.appendChild(li); });
      }
      if (devicesEl) devicesEl.setAttribute("aria-label", "Ouvrir le site " + p.name + " (" + p.host + ")");
      tabs.forEach(function (t, k) { t.classList.toggle("active", k === i); t.setAttribute("aria-selected", k === i ? "true" : "false"); });
      var at = tabs[i];
      if (at && at.parentNode.scrollWidth > at.parentNode.clientWidth) at.parentNode.scrollTo({ left: at.offsetLeft - 16, behavior: prefersReduced ? "auto" : "smooth" });
      restartFill(i);
    }
    /* Rotation en cube : le projet affiché (face avant, .devices) et le
       suivant (un clone posé sur la face latérale) pivotent ensemble de 90°.
       Au repos, la face avant n'a aucune transformation : rien ne bouge ni
       ne floute entre deux rotations. */
    var cube = q("[data-sc-cube]");
    var ambient = q("[data-sc-ambient]");
    function setAmbient(src, glow) {
      if (!ambient) return;
      ambient.style.setProperty("--glow", glow || .62); // un site clair éclaire moins fort qu'un site sombre
      var imgs = ambient.querySelectorAll("img"), on = ambient.querySelector("img.on");
      if (on && on.getAttribute("src") === src) return;
      var next = imgs[0] === on ? imgs[1] : imgs[0];
      next.onload = function () { next.classList.add("on"); if (on) on.classList.remove("on"); next.onload = null; };
      next.src = src;
    }
    var TURN = 900, shown = 0, turning = false;
    var decoded = function (imgs, ms) {
      var all = Promise.all(imgs.map(function (im) { return im.decode ? im.decode().catch(function () {}) : null; }));
      return Promise.race([all, new Promise(function (r) { setTimeout(r, ms); })]);
    };
    function turn(forced) {
      if (turning || shown === index) return;
      turning = true;
      var target = index, n = PROJECTS.length, p = PROJECTS[target];
      var dir = forced || ((target - shown + n) % n <= n / 2 ? 1 : -1);
      var face = devicesEl.cloneNode(true);
      ["data-devices", "role", "tabindex", "aria-label"].forEach(function (a) { face.removeAttribute(a); });
      face.classList.remove("is-clickable"); face.classList.add("sc-face-next"); face.setAttribute("aria-hidden", "true");
      var d = face.querySelector("[data-sc-desktop]"), m = face.querySelector("[data-sc-mobile]");
      d.removeAttribute("data-sc-desktop"); m.removeAttribute("data-sc-mobile");
      d.alt = ""; m.loading = "eager"; d.src = p.desktop; m.src = p.mobile;
      decoded([d, m], 800).then(function () {
        setAmbient(p.desktop, p.glow);
        var half = devicesEl.offsetWidth / 2;
        face.style.transform = "rotateY(" + (dir * 90) + "deg) translateZ(" + half + "px)";
        devicesEl.style.transform = "translateZ(" + half + "px)";
        cube.style.transform = "translateZ(" + -half + "px)";
        cube.appendChild(face);
        void cube.offsetWidth;
        cube.classList.add("is-turning");
        cube.style.transform = "translateZ(" + -half + "px) rotateY(" + (-dir * 90) + "deg)";
        setTimeout(function () {
          paintScreens(target);
          decoded([elDesktop, elMobile], 400).then(function () {
            cube.classList.remove("is-turning");
            cube.style.transform = ""; devicesEl.style.transform = "";
            face.remove();
            shown = target; turning = false;
            turn(); // un autre projet a pu être choisi pendant la rotation
          });
        }, TURN);
      });
    }
    function go(i, animate, dir) {
      index = (i + PROJECTS.length) % PROJECTS.length;
      warm(index + 1);
      if (animate && !prefersReduced && cube && window.Promise) {
        showcase.classList.add("is-info-swap");
        setTimeout(function () { paintInfo(index); showcase.classList.remove("is-info-swap"); }, 280);
        turn(dir);
      } else if (animate && !prefersReduced) {
        showcase.classList.add("is-swapping");
        setTimeout(function () { paint(index); shown = index; showcase.classList.remove("is-swapping"); }, 220);
      } else { paint(index); shown = index; }
    }
    /* Balayage gauche / droite sur la maquette (écrans tactiles) : vers la
       gauche, projet suivant ; vers la droite, projet précédent. Le cube
       tourne dans le sens du doigt. Le défilement vertical reste libre. */
    var stageEl = q(".showcase-stage");
    if (stageEl && devicesEl) {
      var sx = 0, sy = 0, tracking = false;
      stageEl.addEventListener("touchstart", function (e) {
        if (e.touches.length !== 1) { tracking = false; return; }
        sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
      }, { passive: true });
      stageEl.addEventListener("touchend", function (e) {
        if (!tracking) return;
        tracking = false;
        var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
        swipedAt = Date.now();
        if (!started) { started = true; showcase.classList.add("is-live"); }
        var step = dx < 0 ? 1 : -1;
        go(index + step, true, step);
        arm();
      }, { passive: true });
    }
    function arm() { if (!INT) return; clearInterval(timer); timer = setInterval(function () { go(index + 1, true); }, INT); }
    function stop() { clearInterval(timer); }

    paint(0);
    warmed[0] = true;
    if ("requestIdleCallback" in window) requestIdleCallback(function () { warm(1); }, { timeout: 3000 });
    else window.addEventListener("load", function () { setTimeout(function () { warm(1); }, 600); });

    if ("IntersectionObserver" in window && !prefersReduced) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !started) { started = true; showcase.classList.add("is-live"); restartFill(index); arm(); }
        });
      }, { threshold: 0.35 });
      io.observe(showcase);
    }

    showcase.addEventListener("pointerenter", function () { stop(); showcase.classList.add("is-paused"); });
    showcase.addEventListener("pointerleave", function () { showcase.classList.remove("is-paused"); if (started) { restartFill(index); arm(); } });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (started && !showcase.matches(":hover")) { restartFill(index); arm(); }
    });

    /* Suivi de la souris : le PC et le téléphone s'inclinent vers le curseur
       (profondeur 3D). Seul mouvement de la maquette : ni flottement ni zoom, et le
       téléphone s'incline autant que le PC pour que son écran reste bien lisible.
       Chaque appareil a sa propre perspective : hors d'un espace 3D commun,
       le z-index s'applique et le téléphone ne passe jamais derrière le PC. */
    if (finePointer && !prefersReduced) {
      var stage = showcase.querySelector(".showcase-stage");
      var laptop = showcase.querySelector(".laptop-device");
      var phone = showcase.querySelector(".phone");
      if (stage && laptop && phone) {
        var clamp = function (v) { return v < -0.5 ? -0.5 : v > 0.5 ? 0.5 : v; };
        var lastE = null, ticking = false;
        var apply = function () {
          ticking = false; if (!lastE) return;
          var sr = stage.getBoundingClientRect();
          var rx = clamp((lastE.clientX - sr.left) / sr.width - 0.5);
          var ry = clamp((lastE.clientY - sr.top) / sr.height - 0.5);
          var tilt = " rotateY(" + (rx * 9).toFixed(2) + "deg) rotateX(" + (-ry * 6).toFixed(2) + "deg)";
          // Parallaxe de profondeur : le téléphone (devant) se déplace plus que
          // la tablette, le rétroéclairage (au fond) part dans l'autre sens.
          laptop.style.transform = "perspective(1500px) translate(" + (rx * -6).toFixed(1) + "px," + (ry * -4).toFixed(1) + "px)" + tilt;
          phone.style.transform = "perspective(1500px) translate(" + (rx * 16).toFixed(1) + "px," + (ry * 10).toFixed(1) + "px)" + tilt;
          if (ambient) ambient.style.transform = "translate(" + (rx * -18).toFixed(1) + "px," + (ry * -12).toFixed(1) + "px)";
        };
        window.addEventListener("pointermove", function (e) { lastE = e; if (!ticking) { ticking = true; requestAnimationFrame(apply); } }, { passive: true });
        document.addEventListener("mouseleave", function () { laptop.style.transform = ""; phone.style.transform = ""; if (ambient) ambient.style.transform = ""; });
      }
    }

  })();

  /* ------------------------------------------------------------ L'orbite des prestations
     Six noeuds sur un anneau, panneau de detail a droite. Clavier : chaque noeud est un
     <button>. La rotation automatique s'arrete au premier clic et ne demarre jamais sous
     prefers-reduced-motion. */
  (function () {
    var nodesEl = $("#orbit-nodes"), linesEl = $("#orbit-lines"), panel = $("#orbit-panel");
    if (!nodesEl || !linesEl || !panel) return;

    var ico = function (d) {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
             'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
    };
    var SERVICES = [
      { n: "Site vitrine sur mesure",
        i: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18"/><path d="M6.6 6.6h.01M9.2 6.6h.01"/>',
        d: "Présenter votre activité, inspirer confiance et recevoir des appels. Dessiné pour vous, jamais posé sur un thème acheté. C'est le besoin de neuf clients sur dix.",
        t: ["5 à 10 pages", "Référencement local", "Mobile d'abord", "Prise en main"],
        u: "/creation-site-web-liege/", ul: "Voir la page Liège & Neupré" },
      { n: "Boutique & réservation",
        i: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
        d: "Vendre vos produits ou laisser vos clients réserver un créneau seuls, même à 23 h. Paiement sécurisé, gestion simple, pensé mobile d'abord.",
        t: ["Paiement sécurisé", "Créneaux", "Click & collect", "Stock"],
        u: "#commande", ul: "Parler de ce projet",
        pre: "Bonjour, je voudrais une boutique en ligne ou un système de réservation. " },
      { n: "Refonte d'un site existant",
        i: '<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-13.7 5.7L4 16"/><path d="M4 20v-4h4"/>',
        d: "Votre site est lent, daté ou invisible sur Google ? On garde ce qui marche, on refait le reste. Vos contenus et votre référencement acquis sont préservés.",
        t: ["Contenus repris", "SEO préservé", "Redirections", "Sans coupure"],
        u: "#commande", ul: "Parler de ce projet",
        pre: "Bonjour, j'ai déjà un site que je voudrais refondre. " },
      { n: "Application mobile",
        i: '<rect x="6" y="2.5" width="12" height="19" rx="2.6"/><path d="M10.5 18.6h3"/>',
        d: "De la maquette à la publication sur les stores, quand un site ne suffit plus et qu'il vous faut une vraie application.",
        t: ["iOS & Android", "Maquette", "Publication", "Mises à jour"],
        u: "/creation-application-mobile-belgique/", ul: "Voir la page application mobile" },
      { n: "Référencement Google",
        i: '<circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/><path d="M8 11h6M11 8v6"/>',
        d: "Être trouvé quand quelqu'un cherche votre métier près de chez vous. Search Console, données structurées, contenus écrits pour votre région, et les chiffres qui disent ce que ça rapporte.",
        t: ["Search Console", "Données structurées", "Contenus locaux", "Relevé mensuel"],
        u: "#commande", ul: "Parler de ce projet",
        pre: "Bonjour, je voudrais être mieux référencé sur Google. " },
      { n: "Hébergement & évolutions",
        i: '<rect x="3" y="4" width="18" height="6" rx="1.8"/><rect x="3" y="14" width="18" height="6" rx="1.8"/><path d="M7 7h.01M7 17h.01"/>',
        d: "Une fois en ligne, un site vit. Je m'occupe de l'hébergement, des sauvegardes, de la sécurité et des changements que vous me demandez.",
        t: ["Hébergement", "Sauvegardes", "Sécurité", "Modifications"],
        u: "#budget", ul: "Voir le budget" }
    ];

    var actif = 0, boucle = null, touche = false, html = "", traits = "";
    SERVICES.forEach(function (f, i) {
      var a = (i * (360 / SERVICES.length) - 90) * Math.PI / 180, r = 42;
      var x = 50 + r * Math.cos(a), y = 50 + r * Math.sin(a);
      html += '<button type="button" class="node" data-i="' + i + '" style="left:' + x.toFixed(2) +
              "%;top:" + y.toFixed(2) + '%" aria-pressed="false" aria-label="' + f.n + '">' +
              '<span class="ic">' + ico(f.i) + '</span><span class="lb" aria-hidden="true">' + f.n + "</span></button>";
      traits += '<line x1="50" y1="50" x2="' + x.toFixed(2) + '" y2="' + y.toFixed(2) + '"/>';
    });
    nodesEl.innerHTML = html; linesEl.innerHTML = traits;

    function montre(i, net) {
      actif = i;
      $$(".node", nodesEl).forEach(function (n, k) {
        n.classList.toggle("on", k === i); n.setAttribute("aria-pressed", k === i ? "true" : "false");
      });
      $$("line", linesEl).forEach(function (l, k) { l.classList.toggle("on", k === i); });
      var f = SERVICES[i];
      var h = '<span class="o-panel-n">0' + (i + 1) + " / 0" + SERVICES.length + "</span><h3>" + f.n + "</h3><p>" + f.d + "</p>" +
              "<ul>" + f.t.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>" +
              '<p class="o-panel-link">' + (f.u ? '<a href="' + f.u + '"' + (f.pre ? ' data-prefill="' + f.pre.replace(/"/g, "&quot;") + '"' : "") + ">" + f.ul + " →</a>" : "Sur devis, après un échange") + "</p>";
      if (net || prefersReduced) { panel.innerHTML = h; return; }
      panel.classList.add("swap");
      setTimeout(function () { panel.innerHTML = h; panel.classList.remove("swap"); }, 220);
    }

    nodesEl.addEventListener("click", function (e) {
      var n = e.target.closest(".node"); if (!n) return;
      touche = true; clearInterval(boucle); montre(Number(n.getAttribute("data-i")));
    });

    /* Lien « Parler de ce projet » : pré-remplit le message du contact sans
       écraser ce que le visiteur aurait déjà tapé, puis y place le curseur. */
    panel.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-prefill]"); if (!a) return;
      var msg = $("#message");
      if (msg && !msg.value.trim()) msg.value = a.getAttribute("data-prefill");
      if (msg) setTimeout(function () { msg.focus(); }, 420);
    });
    montre(0, true);

    if (!prefersReduced && "IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          clearInterval(boucle);
          if (x.isIntersecting && !touche) boucle = setInterval(function () { montre((actif + 1) % SERVICES.length); }, 4200);
        });
      }, { threshold: .35 }).observe($("#orbit"));
    }
  })();

  /* ------------------------------------------------------------ Estimateur de budget
     Fourchette indicative en direct. Aucune valeur figee : le CTA pre-remplit le
     message de contact avec la configuration choisie, sans ecraser un texte deja saisi. */
  (function () {
    var root = $("#estimate"); if (!root) return;
    var amount = $("#est-amount"), month = $("#est-month"), cta = $("#est-cta");
    var pagesInput = $("#est-pages-n"), maint = $("#est-maint");
    if (!amount || !cta || !pagesInput || !maint) return;

    var eur = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") + "\u00a0€"; }; // espaces insécables : « 1 400 € » ne se coupe pas et reste lisible quelle que soit la police
    function lu(sel) { return root.querySelector(sel); }

    function update() {
      var r = lu('input[name="est-formula"]:checked');
      var base = r ? Number(r.value) : 0, label = r ? r.getAttribute("data-label") : "";
      var pages = Math.max(0, Math.min(20, parseInt(pagesInput.value, 10) || 0));
      pagesInput.value = pages;
      var total = base + pages * 150;

      amount.textContent = "dès " + eur(total);
      month.textContent = maint.checked ? "+ 25 €/mois" : "";
      $$(".est-opt", root).forEach(function (o) { o.classList.toggle("is-on", o.querySelector("input").checked); });

      var msg = "Bonjour, je souhaite " + label;
      var s = pages > 1 ? "s" : "";
      if (pages > 0) msg += " avec " + pages + " page" + s + " supplémentaire" + s;
      if (maint.checked) msg += (pages > 0 ? " et" : " avec") + " un suivi mensuel";
      msg += ". Estimation indicative : dès " + eur(total) + (maint.checked ? " + 25 €/mois" : "") + ". ";
      cta.setAttribute("data-prefill", msg);
    }

    root.addEventListener("input", update);
    root.addEventListener("click", function (e) {
      var b = e.target.closest(".est-step"); if (!b) return;
      pagesInput.value = (parseInt(pagesInput.value, 10) || 0) + Number(b.getAttribute("data-step"));
      update();
    });
    cta.addEventListener("click", function () {
      var m = $("#message");
      if (m && !m.value.trim()) m.value = cta.getAttribute("data-prefill");
      if (m) setTimeout(function () { m.focus(); }, 420);
    });
    update();
  })();

})();
