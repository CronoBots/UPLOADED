/* =====================================================================
   Uploaded — home.js
   Monographie d'atelier. Autonome (FR). Aucune dépendance à script.js/i18n.js.
   ===================================================================== */
(function () {
  "use strict";
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
            showSuccess("Merci " + name + " ! Votre demande est envoyée, je vous réponds à " + email + " sous 24 h.");
            form.reset();
          } else {
            showFallback("Un souci est survenu. Réessayez, appelez-moi au 0460 96 21 46, ou :");
          }
        })
        .catch(function () {
          setLoading(false);
          showFallback("Connexion impossible. Réessayez, appelez-moi au 0460 96 21 46, ou :");
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
        t: ["5 à 10 pages", "Référencement local", "Mobile d'abord", "Prise en main"],
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

})();
