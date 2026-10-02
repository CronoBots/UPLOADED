/* =====================================================================
   uploaded.be — film piloté par le scroll (GSAP + ScrollTrigger)

   Principe
   1. ScrollTrigger épingle la scène (#film) pendant 400 % de hauteur
      d'écran et en tire une progression de 0 à 1 (scrub: true).
   2. Cette progression pilote une timeline GSAP : textes, zoom, parallaxe.
   3. La même progression fixe la position de la vidéo. Le réglage de
      video.currentTime se fait dans une boucle requestAnimationFrame,
      lissée et limitée à une demande de recherche à la fois : c'est ce
      qui évite les saccades, même en tournant vite la molette.
   La vidéo n'est jamais lue : elle n'avance que si l'on descend.
   ===================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;

  // Mode statique (réduire les animations) : la page se lit sans film.
  if (!root.classList.contains("is-film")) return;

  // GSAP absent (fichier bloqué, réseau) : repli propre en mode statique.
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove("is-film"); return; }
  gsap.registerPlugin(ScrollTrigger);

  // Sur mobile, la barre d'adresse qui apparaît et disparaît ne doit pas
  // recalculer toute la page à chaque geste.
  ScrollTrigger.config({ ignoreMobileResize: true });

  var film  = document.getElementById("film");
  var stage = film.querySelector(".stage");
  var media = stage.querySelector(".media");
  var video = stage.querySelector(".video");
  var $ = function (s) { return stage.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(stage.querySelectorAll(s)); };

  /* ------------------------------------------------------------------
     1. Choix de la vidéo : paysage sur écran large, portrait sur téléphone.
     Chacune est encodée en images-clés uniquement (ffmpeg -g 1) : chaque
     image se décode seule, donc on peut sauter n'importe où instantanément.
     ------------------------------------------------------------------ */
  // MP4 (H.264) partout où il est lu — Safari, iOS, Chrome, Edge, Firefox ;
  // WebM (VP9) pour les navigateurs qui ne lisent pas le H.264.
  var EXT = video.canPlayType('video/mp4; codecs="avc1.640028"') ? ".mp4" : ".webm";
  var portraitQuery = window.matchMedia("(max-aspect-ratio: 4/5)");
  function pickSource() {
    var portrait = portraitQuery.matches;
    var src = (portrait ? video.dataset.srcPortrait : video.dataset.srcLandscape) + EXT;
    if (video.getAttribute("src") === src) return;
    if (portrait && video.dataset.posterPortrait) video.poster = video.dataset.posterPortrait;
    ready = false;
    video.src = src;
    video.load();
  }

  var duration = 0;   // durée de la vidéo, connue après loadedmetadata
  var ready = false;  // la vidéo peut être positionnée

  video.addEventListener("loadedmetadata", function () {
    duration = video.duration || 0;
    ready = duration > 0;
    stage.classList.remove("no-video");
    wake();
  });
  // Échec de chargement : on garde la mise en scène, avec un halo à la place de l'image.
  video.addEventListener("error", function () { stage.classList.add("no-video"); });
  setTimeout(function () { if (!ready) stage.classList.add("no-video"); }, 9000);

  // iOS / Safari mobile : une vidéo ne se positionne de façon fiable qu'après
  // une première lecture. On la « réveille » au premier contact, sans la montrer jouer.
  function unlock() {
    var p = video.play();
    if (p && p.then) p.then(function () { video.pause(); }).catch(function () {});
    else video.pause();
  }
  window.addEventListener("touchstart", unlock, { passive: true, once: true });
  window.addEventListener("pointerdown", unlock, { passive: true, once: true });

  pickSource();
  if (portraitQuery.addEventListener) portraitQuery.addEventListener("change", function () { pickSource(); ScrollTrigger.refresh(); });

  /* ------------------------------------------------------------------
     2. Scroll → vidéo, dans une boucle requestAnimationFrame.
     « target » vient de ScrollTrigger, « shown » le suit en douceur
     (interpolation linéaire). On ne lance une nouvelle recherche que
     lorsque la précédente est terminée (video.seeking === false).
     ------------------------------------------------------------------ */
  var target = 0, shown = 0, running = false;
  var SMOOTH = 0.14;            // 0 → très mou, 1 → collé au scroll
  var FRAME = 1 / 30;           // une image de la vidéo (30 i/s)

  function frame() {
    var diff = target - shown;
    shown = Math.abs(diff) < 0.0004 ? target : shown + diff * SMOOTH;

    // Variable CSS --p : barre de progression et halo de repli
    stage.style.setProperty("--p", shown.toFixed(4));

    if (ready && !video.seeking) {
      var t = shown * Math.max(0, duration - FRAME);
      if (Math.abs(video.currentTime - t) > FRAME * 0.5) video.currentTime = t;
    }

    if (shown !== target) requestAnimationFrame(frame);
    else running = false;       // plus rien à faire : la boucle s'arrête
  }
  function wake() { if (!running) { running = true; requestAnimationFrame(frame); } }

  /* ------------------------------------------------------------------
     3. Timeline du film. Sa durée vaut 1 : chaque position (0.15, 0.5…)
     correspond directement à une fraction du scroll.
     ------------------------------------------------------------------ */
  var tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: film,
      start: "top top",
      end: "+=400%",            // 4 écrans de défilement pendant l'épinglage
      pin: true,
      scrub: true,              // la timeline suit exactement le scroll
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        target = self.progress; wake();
        stage.classList.toggle("is-final", self.progress > 0.78);   // retire le voile pour le final
      }
    }
  });

  // Entrée et sortie d'un élément : fondu + translateY (transform/opacity
  // uniquement, pour rester sur le GPU).
  function inOut(el, tIn, tOut, opts) {
    opts = opts || {};
    var d = opts.d || 0.05, y = opts.y || 60;
    tl.fromTo(el, { autoAlpha: 0, y: y }, { autoAlpha: 1, y: 0, duration: d, ease: "power2.out", immediateRender: false }, tIn);
    if (tOut != null) tl.to(el, { autoAlpha: 0, y: -y, duration: d, ease: "power2.in" }, tOut);
  }

  // SECTION 1 — le titre s'élève, grossit légèrement et s'efface
  tl.to(".hero-sub", { autoAlpha: 0, y: 20, duration: 0.05 }, 0)
    .to(".hero-title", { yPercent: -18, scale: 1.08, autoAlpha: 0, duration: 0.15, ease: "power1.in" }, 0)
    .to(".hero-title .line:nth-child(2)", { xPercent: 4, duration: 0.15 }, 0);   // parallaxe entre les deux lignes

  // Zoom très léger de la vidéo : on s'approche, puis on recule pour le final
  tl.fromTo(media, { scale: 1 }, { scale: 1.1, duration: 0.55, ease: "sine.inOut" }, 0)
    .to(media, { scale: 1, duration: 0.45, ease: "sine.inOut" }, 0.55);

  // SECTION 2 — STORY : trois phrases, l'une chassant l'autre
  var lines = $$(".story-line");
  inOut(lines[0], 0.15, 0.26);
  inOut(lines[1], 0.27, 0.38);
  inOut(lines[2], 0.39, 0.50);

  // SECTION 3 — FEATURE : arrivée décalée, puis parallaxe à vitesses différentes
  var feats = $$(".feature");
  feats.forEach(function (f, i) {
    tl.fromTo(f, { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power2.out", immediateRender: false }, 0.52 + i * 0.035);
  });
  tl.to(feats[0], { y: -50, duration: 0.22 }, 0.57)
    .to(feats[1], { y: -110, duration: 0.22 }, 0.57)
    .to(feats[2], { y: -25, duration: 0.22 }, 0.57)
    .to(feats, { autoAlpha: 0, duration: 0.04, stagger: 0.01 }, 0.75);

  // SECTION 4 — FINAL : le titre au-dessus du logo qui se forme, puis le bouton
  tl.fromTo(".final-title", { autoAlpha: 0, y: 60, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.07, ease: "power2.out", immediateRender: false }, 0.81)
    .fromTo(".final-btn", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power2.out", immediateRender: false }, 0.9)
    .set({}, {}, 1);            // la timeline dure exactement 1

  // Les polices peuvent changer la taille des textes : on recalcule une fois chargées.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
