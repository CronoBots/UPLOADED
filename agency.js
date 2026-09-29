/* ============================================================
   UPLOADED — moteur cinématique
   Lenis (smooth scroll) + GSAP ScrollTrigger + canvas particules.
   Toutes les scènes sont "scrubbées" : l'animation suit le scroll.
   Contenus facilement modifiables via CONFIG ci-dessous.
   ============================================================ */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     CONFIG — tout ce qui est éditable (textes / projets)
     --------------------------------------------------------- */
  const CONFIG = {
    rail: [
      { id: 'hero',     label: 'Intro' },
      { id: 'probleme', label: 'Constat' },
      { id: 'solution', label: 'Solution' },
      { id: 'web',      label: 'Web' },
      { id: 'apps',     label: 'Apps' },
      { id: 'seo',      label: 'SEO' },
      { id: 'process',  label: 'Méthode' },
      { id: 'works',    label: 'Réalisations' },
      { id: 'about',    label: 'Studio' },
      { id: 'contact',  label: 'Contact' },
    ],
    seoQuery: 'agence création site web liège',
    stats: [
      { word: 'Performance', desc: 'Sites rapides, Core Web Vitals soignés, chargement optimisé.' },
      { word: 'Visibilité',  desc: 'Fondations SEO propres pour être trouvé sur Google.' },
      { word: 'Expérience',  desc: 'Interfaces fluides et responsive, pensées pour vos utilisateurs.' },
      { word: 'Conversion',  desc: 'Chaque parcours conçu pour transformer les visiteurs en clients.' },
    ],
    // Projets RÉELS — aucune donnée inventée. Résultats = descriptions honnêtes.
    projects: [
      {
        slug: 'cryptonauts', title: 'Cryptonauts', sector: 'Web3 · NFT community',
        img: 'img/cryptonauts-desktop.webp',
        problem: "Une communauté NFT active mais dispersée, sans vitrine officielle pour centraliser classement, ventes et informations en temps réel.",
        solution: "Un site vitrine dynamique qui agrège les données on-chain et de marketplace, avec classement des détenteurs et statistiques rafraîchies automatiquement.",
        tech: ['HTML/CSS/JS', 'API on-chain', 'GraphQL', 'GitHub Actions', 'Automatisations'],
        result: "Un point de référence unique pour la communauté, mis à jour sans intervention manuelle.",
      },
      {
        slug: 'jaydenmusic', title: 'Jayden Music', sector: 'Artiste · musique',
        img: 'img/jaydenmusic-desktop.webp',
        problem: "Un artiste sans présence en ligne à la hauteur de son univers, difficile à trouver et à partager.",
        solution: "Un site immersif centré sur l'écoute et l'image de marque, pensé mobile-first pour le partage sur les réseaux.",
        tech: ['Design sur mesure', 'Responsive', 'Performance', 'SEO'],
        result: "Une vitrine soignée qui reflète l'identité de l'artiste et facilite la découverte.",
      },
      {
        slug: 'pizzapino', title: 'Pizza Pino', sector: 'Restaurant · commerce local',
        img: 'img/pizzapino-desktop.webp',
        problem: "Une pizzeria dépendante des plateformes tierces, sans canal direct pour présenter la carte et prendre contact.",
        solution: "Un site vitrine avec menu en ligne, liste de commande et appel direct — simple pour le client, autonome pour le gérant.",
        tech: ['Site vitrine', 'Menu dynamique', 'Mobile-first', 'SEO local'],
        result: "Un canal direct qui met en avant la carte et facilite la prise de contact.",
      },
      {
        slug: 'yumea', title: 'Yumea', sector: 'Marque · lifestyle',
        img: 'img/yumea-desktop.webp',
        problem: "Une marque émergente cherchant une présence digitale élégante et crédible pour se lancer.",
        solution: "Une identité digitale premium et cohérente, avec une expérience de navigation soignée sur tous les écrans.",
        tech: ['Direction artistique', 'Responsive', 'Performance', 'UX/UI'],
        result: "Une image de marque affirmée, prête à accueillir sa croissance.",
      },
    ],
  };

  /* ---------------------------------------------------------
     Helpers & état
     --------------------------------------------------------- */
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  document.documentElement.classList.add('reveal-ready');
  if (prefersReduced) document.body.classList.add('reduced');

  /* =========================================================
     PRELOADER
     ========================================================= */
  function preloader() {
    const el = $('#preloader');
    if (!el) return Promise.resolve();
    const bar = $('.preloader__bar i', el);
    const pct = $('#preloaderPct');
    return new Promise((resolve) => {
      let p = 0;
      const tick = () => {
        p = Math.min(100, p + Math.max(2, (100 - p) * 0.12));
        if (bar) bar.style.width = p + '%';
        if (pct) pct.textContent = Math.round(p);
        if (p < 99.5) { requestAnimationFrame(tick); }
        else {
          el.classList.add('done');
          setTimeout(resolve, 500);
        }
      };
      requestAnimationFrame(tick);
    });
  }

  /* =========================================================
     PARTICLE FIELD — réseau de points/lignes lumineuses
     energy (0→1) : intensifie connexions & luminosité (piloté au scroll)
     ========================================================= */
  class ParticleField {
    constructor(canvas, opts = {}) {
      this.c = canvas; this.ctx = canvas.getContext('2d');
      this.opts = Object.assign({
        density: 0.00009, maxCount: 120, linkDist: 130,
        speed: 0.18, color: '110,160,255', converge: false,
      }, opts);
      this.energy = 0; this.running = false; this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.mouse = { x: -9999, y: -9999 };
      this._resize = this.resize.bind(this);
      this.resize();
      window.addEventListener('resize', this._resize, { passive: true });

      // pause hors écran (perf)
      this.io = new IntersectionObserver((e) => {
        e[0].isIntersecting ? this.start() : this.stop();
      }, { threshold: 0.02 });
      this.io.observe(canvas);
    }
    resize() {
      const r = this.c.getBoundingClientRect();
      this.w = r.width; this.h = r.height;
      this.c.width = this.w * this.dpr; this.c.height = this.h * this.dpr;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const count = Math.min(this.opts.maxCount, Math.round(this.w * this.h * this.opts.density));
      this.n = Math.max(24, count);
      this.build();
    }
    build() {
      this.p = [];
      for (let i = 0; i < this.n; i++) {
        this.p.push({
          x: Math.random() * this.w, y: Math.random() * this.h,
          vx: (Math.random() - 0.5) * this.opts.speed,
          vy: (Math.random() - 0.5) * this.opts.speed,
          hx: Math.random() * this.w, hy: Math.random() * this.h, // home for converge
          r: Math.random() * 1.6 + 0.6,
        });
      }
    }
    start() { if (this.running || prefersReduced) return; this.running = true; this.loop(); }
    stop() { this.running = false; }
    setEnergy(e) { this.energy = clamp(e, 0, 1); }
    loop() {
      if (!this.running) return;
      const { ctx, w, h, opts } = this; ctx.clearRect(0, 0, w, h);
      const e = this.energy;
      const cx = w / 2, cy = h / 2;
      const link = opts.linkDist * (1 + e * 0.6);
      for (const a of this.p) {
        // mouvement : dérive + légère convergence vers le centre selon energy
        a.x += a.vx; a.y += a.vy;
        if (opts.converge) {
          a.x += (cx - a.x) * 0.0016 * e;
          a.y += (cy - a.y) * 0.0016 * e;
        }
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
        const dm = Math.hypot(a.x - this.mouse.x, a.y - this.mouse.y);
        const glow = dm < 120 ? 1 - dm / 120 : 0;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r + glow * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${opts.color},${0.35 + e * 0.4 + glow * 0.4})`;
        ctx.fill();
      }
      // liens
      for (let i = 0; i < this.p.length; i++) {
        for (let j = i + 1; j < this.p.length; j++) {
          const a = this.p[i], b = this.p[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < link) {
            const o = (1 - d / link) * (0.18 + e * 0.5);
            ctx.strokeStyle = `rgba(${opts.color},${o})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      requestAnimationFrame(() => this.loop());
    }
  }

  const fields = [];
  let heroFX = null; // pilote l'énergie du hero (3D si dispo, sinon canvas 2D)
  function initFields(opts = {}) {
    if (prefersReduced) return;
    const hero = $('#heroCanvas');
    const sol = $('#solutionCanvas');
    const cta = $('#ctaCanvas');
    const light = window.matchMedia('(max-width: 900px)').matches;
    if (hero && !opts.skipHero) fields.hero = new ParticleField(hero, { maxCount: light ? 60 : 130, converge: true, color: '120,165,255' });
    if (sol)  fields.sol  = new ParticleField(sol,  { maxCount: light ? 45 : 90, color: '139,120,255', linkDist: 150 });
    if (cta)  fields.cta  = new ParticleField(cta,  { maxCount: light ? 55 : 120, converge: true, color: '120,165,255' });

    // pointeur (glow) sur hero
    if (hero && fields.hero && !opts.skipHero) {
      window.addEventListener('pointermove', (ev) => {
        const r = hero.getBoundingClientRect();
        fields.hero.mouse.x = ev.clientX - r.left;
        fields.hero.mouse.y = ev.clientY - r.top;
      }, { passive: true });
    }
  }

  /* =========================================================
     FOND VIDÉO optionnel — activé si #heroVideo a un data-src
     (déposez un WebM/MP4 : Coverr, Pexels, Mixkit, Pixabay)
     ========================================================= */
  function initHeroVideo() {
    const v = $('#heroVideo'); if (!v) return false;
    const src = (v.getAttribute('data-src') || '').trim(); if (!src) return false;
    v.src = src; v.setAttribute('preload', 'auto');
    v.addEventListener('canplay', () => v.classList.add('is-on'), { once: true });
    const p = v.play(); if (p && p.catch) p.catch(() => {});
    const gl = $('#heroGL'); if (gl) gl.style.display = 'none';
    const c2d = $('#heroCanvas'); if (c2d) c2d.style.display = 'none';
    return true;
  }

  /* =========================================================
     FOND 3D WebGL — nuage de particules qui se TRANSFORME entre
     les 3 métiers : navigateur (web) → smartphone (apps) →
     loupe + courbe de croissance (SEO). Three.js. Desktop only,
     fallback canvas 2D sinon. Réagit souris + scroll (énergie).
     ========================================================= */
  // Échantillonne N points le long de "traits" (lignes + arcs) => forme en points
  function sampleShape(segments, N) {
    const segLen = (s) => s.type === 'arc'
      ? s.r * Math.abs(s.a1 - s.a0)
      : Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
    const segPt = (s, t) => s.type === 'arc'
      ? [s.c[0] + s.r * Math.cos(s.a0 + (s.a1 - s.a0) * t), s.c[1] + s.r * Math.sin(s.a0 + (s.a1 - s.a0) * t)]
      : [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t];
    const lens = segments.map(segLen);
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    const out = new Float32Array(N * 3);
    let i = 0;
    for (let s = 0; s < segments.length; s++) {
      const cnt = s === segments.length - 1 ? N - i : Math.round(N * lens[s] / total);
      for (let j = 0; j < cnt && i < N; j++) {
        const p = segPt(segments[s], Math.min(1, (j + Math.random() * 0.7) / Math.max(1, cnt)));
        out[i * 3] = p[0] + (Math.random() - 0.5) * 0.07;
        out[i * 3 + 1] = p[1] + (Math.random() - 0.5) * 0.07;
        out[i * 3 + 2] = (Math.random() - 0.5) * 0.55;
        i++;
      }
    }
    while (i < N) { const p = segPt(segments[0], Math.random()); out[i*3]=p[0]; out[i*3+1]=p[1]; out[i*3+2]=(Math.random()-0.5)*0.55; i++; }
    return out;
  }
  function heroShapeDefs() {
    const rect = (x0, y0, x1, y1) => ([
      { type: 'line', a: [x0, y1], b: [x1, y1] }, { type: 'line', a: [x0, y0], b: [x1, y0] },
      { type: 'line', a: [x0, y0], b: [x0, y1] }, { type: 'line', a: [x1, y0], b: [x1, y1] },
    ]);
    const circle = (cx, cy, r) => ({ type: 'arc', c: [cx, cy], r, a0: 0, a1: Math.PI * 2 });
    // 1) NAVIGATEUR
    const browser = [
      ...rect(-3, -2, 3, 2),
      { type: 'line', a: [-3, 1.3], b: [3, 1.3] },
      circle(-2.6, 1.65, 0.08), circle(-2.3, 1.65, 0.08), circle(-2.0, 1.65, 0.08),
      { type: 'line', a: [-1.4, 1.65], b: [1.2, 1.65] },
      { type: 'line', a: [-2.5, 0.7], b: [2.5, 0.7] },
      { type: 'line', a: [-2.5, 0.25], b: [1.4, 0.25] },
      ...rect(-2.5, -1.5, -0.2, -0.3), ...rect(0.2, -1.5, 2.5, -0.3),
    ];
    // 2) SMARTPHONE (rectangle arrondi vertical)
    const phone = [
      { type: 'line', a: [-0.75, 2.15], b: [0.75, 2.15] }, { type: 'line', a: [-0.75, -2.15], b: [0.75, -2.15] },
      { type: 'line', a: [-1.15, -1.75], b: [-1.15, 1.75] }, { type: 'line', a: [1.15, -1.75], b: [1.15, 1.75] },
      { type: 'arc', c: [-0.75, 1.75], r: 0.4, a0: Math.PI / 2, a1: Math.PI },
      { type: 'arc', c: [0.75, 1.75], r: 0.4, a0: 0, a1: Math.PI / 2 },
      { type: 'arc', c: [0.75, -1.75], r: 0.4, a0: -Math.PI / 2, a1: 0 },
      { type: 'arc', c: [-0.75, -1.75], r: 0.4, a0: Math.PI, a1: Math.PI * 1.5 },
      { type: 'line', a: [-0.32, 1.98], b: [0.32, 1.98] },
      { type: 'line', a: [-0.8, 0.9], b: [0.8, 0.9] }, { type: 'line', a: [-0.8, 0.45], b: [0.35, 0.45] },
      { type: 'line', a: [-0.6, -1.5], b: [0.6, -1.5] },
    ];
    // 3) LOUPE + BARRES DE CROISSANCE (SEO)
    const bar = (x, top) => ({ type: 'line', a: [x, -0.2], b: [x, top] });
    const seo = [
      circle(-0.4, 0.5, 1.55),
      { type: 'line', a: [0.7, -0.6], b: [2.1, -2.0] }, { type: 'line', a: [0.9, -0.42], b: [2.3, -1.82] },
      bar(-1.05, 0.15), bar(-0.65, 0.55), bar(-0.25, 1.0), bar(0.15, 1.45),
    ];
    return [browser, phone, seo];
  }
  function initHero3D() {
    if (prefersReduced || !window.THREE) return null;
    if (window.matchMedia('(max-width: 900px)').matches) return null;
    const host = $('#heroGL'); if (!host) return null;
    const THREE = window.THREE; let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch (e) { return null; }
    if (!renderer) return null;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    let w = host.clientWidth || window.innerWidth, h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070e, 0.05);
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 120);
    camera.position.set(0, 0, 8);

    const N = 4800;
    const shapes = heroShapeDefs().map((def) => sampleShape(def, N));
    const cur = Float32Array.from(shapes[0]);            // positions courantes
    // départ : explosion depuis une sphère aléatoire → converge vers la forme 0
    for (let k = 0; k < N; k++) {
      const r = 6 + Math.random() * 4, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      cur[k*3] = r*Math.sin(ph)*Math.cos(th); cur[k*3+1] = r*Math.sin(ph)*Math.sin(th); cur[k*3+2] = r*Math.cos(ph);
    }
    const colors = new Float32Array(N * 3);
    const cA = new THREE.Color(0x3b76ff), cB = new THREE.Color(0x8b6bff), tmp = new THREE.Color();
    for (let k = 0; k < N; k++) { tmp.copy(cA).lerp(cB, k / N); colors[k*3]=tmp.r; colors[k*3+1]=tmp.g; colors[k*3+2]=tmp.b; }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(cur, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true,
      opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    const pos = geo.attributes.position;
    let energy = 0, targetE = 0, time = 0, running = false, active = 0;
    const mouse = { x: 0, y: 0 };
    window.addEventListener('pointermove', (e) => {
      mouse.x = e.clientX / window.innerWidth - 0.5; mouse.y = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
    function resize() { w = host.clientWidth; h = host.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    window.addEventListener('resize', resize, { passive: true });

    function frame() {
      if (!running) return;
      time += 0.01;
      energy += (targetE - energy) * 0.05;
      const tgt = shapes[active], arr = pos.array;
      for (let k = 0; k < N; k++) {
        const o = k * 3;
        // morph doux vers la forme active + léger frémissement
        arr[o]   += (tgt[o]   - arr[o])   * 0.06 + Math.sin(time * 2 + k) * 0.0009;
        arr[o+1] += (tgt[o+1] - arr[o+1]) * 0.06 + Math.cos(time * 2 + k) * 0.0009;
        arr[o+2] += (tgt[o+2] - arr[o+2]) * 0.06;
      }
      pos.needsUpdate = true;
      points.rotation.y = mouse.x * 0.5 + Math.sin(time * 0.5) * 0.12 + energy * 0.6;
      points.rotation.x = mouse.y * 0.28;
      camera.position.z = 8 - energy * 2.6;
      camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    const io = new IntersectionObserver((ent) => { running = ent[0].isIntersecting; if (running) frame(); }, { threshold: 0.01 });
    io.observe(host);

    const c2d = $('#heroCanvas'); if (c2d) c2d.style.display = 'none';
    return { setEnergy(e) { targetE = clamp(e, 0, 1); }, setShape(i) { active = ((i % shapes.length) + shapes.length) % shapes.length; }, resize };
  }

  /* Cadence les 3 métiers : synchronise le libellé (#heroNow) et la forme 3D */
  function startHeroDisplay(hero3d) {
    const labels = $$('#heroNow li');
    const setActive = (i) => labels.forEach((li, k) => li.classList.toggle('is-on', k === i));
    setActive(0);
    if (prefersReduced) return;
    let i = 0;
    setInterval(() => {
      i = (i + 1) % 3;
      setActive(i);
      if (hero3d && hero3d.setShape) hero3d.setShape(i);
    }, 3400);
  }

  /* =========================================================
     LENIS + GSAP
     ========================================================= */
  let lenis = null;
  function initScroll() {
    if (!prefersReduced && typeof window.Lenis !== 'undefined') {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
      if (hasGSAP) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((t) => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
      } else {
        const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
    }
    if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
  }
  function scrollTo(target) {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 76;
    if (lenis) lenis.scrollTo(el, { offset: -navH, duration: 1.2 });
    else { const y = el.getBoundingClientRect().top + window.scrollY - navH; window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' }); }
  }

  /* =========================================================
     NAV + menu mobile + smooth links + progress
     ========================================================= */
  function initNav() {
    const nav = $('#nav');
    const burger = $('#navBurger');
    const menu = $('#mobileMenu');
    const progress = $('#scrollProgressBar');

    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      nav.classList.toggle('is-scrolled', y > 40);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const closeMenu = () => { nav.classList.remove('is-open'); menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true'); burger.setAttribute('aria-expanded', 'false'); document.body.classList.remove('is-locked'); };
    burger?.addEventListener('click', () => {
      const open = !menu.classList.contains('is-open');
      nav.classList.toggle('is-open', open); menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open)); burger.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-locked', open);
    });

    $$('[data-scroll-to]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href && href.startsWith('#')) { e.preventDefault(); closeMenu(); scrollTo(href); }
      });
    });
  }

  /* =========================================================
     RAIL (indicateur de section) + liens actifs
     ========================================================= */
  function initRail() {
    const rail = $('#rail'); const list = $('.rail__list', rail);
    if (!list) return;
    CONFIG.rail.forEach((s) => {
      const li = document.createElement('li');
      li.dataset.target = '#' + s.id;
      li.innerHTML = `<span class="label">${s.label}</span><span class="dot"></span>`;
      li.addEventListener('click', () => scrollTo('#' + s.id));
      list.appendChild(li);
    });
    const items = $$('#rail li');
    const navLinks = $$('.nav__links a');

    const setActive = (id) => {
      items.forEach((li) => li.classList.toggle('is-active', li.dataset.target === '#' + id));
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
    };
    if (hasGSAP) {
      CONFIG.rail.forEach((s) => {
        const sec = $('#' + s.id); if (!sec) return;
        ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: (self) => { if (self.isActive) setActive(s.id); } });
      });
    }
  }

  /* =========================================================
     REVEAL générique
     ========================================================= */
  function initReveal() {
    const els = $$('[data-reveal]');
    if (prefersReduced || !hasGSAP) { els.forEach((e) => e.classList.add('is-in')); return; }
    els.forEach((el) => {
      ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => el.classList.add('is-in') });
    });
  }

  /* =========================================================
     SCÈNES SCRUBBÉES (desktop) — gsap.matchMedia
     ========================================================= */
  function initScenes() {
    if (!hasGSAP) return;

    /* ---- Intro HERO : reveal du titre (tous écrans) ---- */
    if (!prefersReduced) {
      const heroLines = $$('.hero__title .line__inner');
      gsap.set(heroLines, { yPercent: 110 });
      gsap.to(heroLines, { yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out', delay: 0.25 });
      gsap.from('.hero__eyebrow, .hero__sub, .hero__actions', { y: 24, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.5 });
    }

    const mm = gsap.matchMedia();

    /* Les MÊMES animations tournent partout ; on n'adapte que la mécanique :
       desktop = sections "pinned" ; mobile = scroll-through (pas de pin sur les
       sections trop hautes) + process vertical. Le scroll pilote tout dans les 2 cas. */
    mm.add({ isDesktop: '(min-width: 901px)', isMobile: '(max-width: 900px)' }, (ctx) => {
      const { isDesktop } = ctx.conditions;
      const st = (desktop, mobile) => (isDesktop ? desktop : mobile);

      /* ================= HERO — caméra + énergie (pin sur les 2, centré) ================= */
      gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=110%', pin: '.hero__pin', scrub: true } })
        .to('.hero__content', { scale: isDesktop ? 1.12 : 1.06, y: -40, opacity: 0, ease: 'none' }, 0)
        .to('.hero__scroll', { opacity: 0, ease: 'none' }, 0)
        .to({}, { onUpdate() { if (heroFX) heroFX.setEnergy(this.progress()); } }, 0);

      /* ================= PROBLEM — grille qui se recompose ================= */
      const frags = $$('#fragGrid i');
      frags.forEach((f) => gsap.set(f, { x: gsap.utils.random(-140, 140), y: gsap.utils.random(-120, 120), rotate: gsap.utils.random(-40, 40), opacity: 0 }));
      if (isDesktop) {
        gsap.timeline({ scrollTrigger: { trigger: '#probleme', start: 'top top', end: '+=120%', pin: '.problem__pin', scrub: true } })
          .to(frags, { x: 0, y: 0, rotate: 0, opacity: 0.6, stagger: 0.02, ease: 'power2.out' }, 0)
          .from('.floatword', { opacity: 0, scale: 0.6, stagger: 0.1 }, 0.1)
          .from('.problem__list li', { y: 40, opacity: 0, stagger: 0.15, ease: 'power2.out' }, 0.3);
      } else {
        gsap.timeline({ scrollTrigger: { trigger: '#probleme', start: 'top 80%', end: 'top 8%', scrub: true } })
          .to(frags, { x: 0, y: 0, rotate: 0, opacity: 0.5, stagger: 0.015, ease: 'power2.out' }, 0)
          .from('.floatword', { opacity: 0, scale: 0.6, stagger: 0.08 }, 0);
        gsap.from('.problem__list li', { scrollTrigger: { trigger: '.problem__list', start: 'top 85%' }, y: 40, opacity: 0, stagger: 0.15, ease: 'power2.out' });
      }

      /* ================= SOLUTION — énergie du réseau + piliers ================= */
      if (isDesktop) {
        gsap.timeline({ scrollTrigger: { trigger: '#solution', start: 'top top', end: '+=120%', pin: '.solution__pin', scrub: true } })
          .to({}, { onUpdate() { if (fields.sol) fields.sol.setEnergy(this.progress()); } }, 0)
          .from('.pillar', { y: 60, opacity: 0, stagger: 0.25, ease: 'power3.out' }, 0.1)
          .from('.pillar__no', { scale: 0.5, opacity: 0, stagger: 0.25 }, 0.15);
      } else {
        ScrollTrigger.create({ trigger: '#solution', start: 'top 80%', end: 'center 40%', scrub: true,
          onUpdate: (s) => { if (fields.sol) fields.sol.setEnergy(s.progress); } });
        gsap.from('.pillar', { scrollTrigger: { trigger: '.pillars', start: 'top 85%' }, y: 50, opacity: 0, stagger: 0.18, ease: 'power3.out' });
      }

      /* ================= WEB — le navigateur se construit ================= */
      gsap.set('#browser', { transformPerspective: 1200 });
      gsap.timeline({ scrollTrigger: st(
          { trigger: '#web', start: 'top top', end: '+=160%', pin: '.web__pin', scrub: true },
          { trigger: '#browser', start: 'top 82%', end: 'bottom 45%', scrub: true }) })
        .from('#browser', { opacity: 0, y: 60, scale: 0.92, ease: 'power2.out' }, 0)
        .fromTo('#browser', { rotateX: isDesktop ? 8 : 4, rotateY: isDesktop ? -10 : -5 }, { rotateX: 0, rotateY: 0, ease: 'none' }, 0)
        .to('.bx-nav',   { opacity: 1, ease: 'none' }, 0.15)
        .to('.bx-hero',  { opacity: 1, ease: 'none' }, 0.32)
        .to('.bx-cards', { opacity: 1, ease: 'none' }, 0.52)
        .to('.bx-stats', { opacity: 1, ease: 'none' }, 0.72)
        .to('.browser__shot', { opacity: 1, ease: 'power1.out' }, 0.82)
        .to('#browser',  { scale: isDesktop ? 1.06 : 1.02, ease: 'none' }, 0.82);

      /* ================= APPS — téléphone qui tourne, écrans qui défilent ================= */
      const screens = $$('#phone .pscreen');
      gsap.set(screens, { opacity: 0 }); if (screens[0]) gsap.set(screens[0], { opacity: 1 });
      const appsTl = gsap.timeline({ scrollTrigger: st(
          { trigger: '#apps', start: 'top top', end: '+=170%', pin: '.apps__pin', scrub: true },
          { trigger: '#phone', start: 'top 82%', end: 'bottom 40%', scrub: true }) });
      appsTl.from('#phone', { opacity: 0, y: 50, ease: 'power2.out' }, 0)
            .fromTo('.phone__frame', { rotateY: isDesktop ? -16 : -8 }, { rotateY: isDesktop ? 12 : 6, ease: 'none' }, 0);
      screens.forEach((sc, i) => {
        if (i === 0) return;
        const at = 0.15 + i * 0.22;
        appsTl.to(screens[i - 1], { opacity: 0, ease: 'none' }, at).to(sc, { opacity: 1, ease: 'none' }, at);
      });

      /* ================= SEO — requête tapée, résultats, "vous" se démarque ================= */
      const results = $$('#serp .serp__item');
      const you = $('#serp .serp__item--you');
      gsap.set(results, { opacity: 0, y: 16 });
      const seoTl = gsap.timeline({ scrollTrigger: st(
          { trigger: '#seo', start: 'top top', end: '+=170%', pin: '.seo__pin', scrub: true, onUpdate: (s) => typeQuery(s.progress) },
          { trigger: '#serp', start: 'top 82%', end: 'bottom 35%', scrub: true, onUpdate: (s) => typeQuery(s.progress) }) });
      results.forEach((r, i) => seoTl.to(r, { opacity: 1, y: 0, ease: 'none' }, 0.3 + i * 0.08));
      if (isDesktop) {
        seoTl.fromTo(you, { y: 0 }, { y: () => -(you.offsetHeight + 12) * 2, ease: 'power2.inOut' }, 0.78)
             .to(you, { boxShadow: '0 0 45px -6px rgba(59,118,255,.7)', ease: 'none' }, 0.85);
      } else {
        seoTl.to(you, { scale: 1.03, boxShadow: '0 0 35px -8px rgba(59,118,255,.6)', ease: 'none' }, 0.8);
      }

      /* ================= PROCESS — horizontal (desktop) / vertical (mobile) ================= */
      const steps = $$('.pstep');
      const line = $('#processLine');
      if (isDesktop) {
        const track = $('#processTrack');
        const totalX = () => Math.max(0, track.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')));
        if (line) line.style.height = '';
        gsap.timeline({ scrollTrigger: {
          trigger: '#process', start: 'top top', end: () => '+=' + (track.scrollWidth * 0.9), pin: '.process__pin', scrub: true,
          onUpdate: (s) => {
            if (line) line.style.width = (s.progress * 100) + '%';
            const idx = Math.round(s.progress * (steps.length - 1));
            steps.forEach((el, i) => el.classList.toggle('is-active', i <= idx));
          },
        } }).to('.process__steps', { x: () => -totalX(), ease: 'none' });
      } else {
        if (line) { line.style.width = '100%'; line.style.height = '0%'; }
        steps.forEach((step, i) => ScrollTrigger.create({
          trigger: step, start: 'top 78%',
          onEnter: () => { step.classList.add('is-active'); if (line) line.style.height = ((i + 1) / steps.length * 100) + '%'; },
          onLeaveBack: () => { step.classList.remove('is-active'); if (line) line.style.height = (i / steps.length * 100) + '%'; },
        }));
      }

      /* ================= HERO SCRUB — carte projet qui grandit en plein écran ================= */
      const reelStage = $('#reelStage');
      if (reelStage) {
        const reelNames = $$('#reelNames li');
        // offsetWidth/Height = taille CSS sans transform → base fiable pour le scale
        const coverScale = () => {
          const bw = reelStage.offsetWidth || 1, bh = reelStage.offsetHeight || 1;
          const fx = window.innerWidth / bw, fy = window.innerHeight / bh;
          return (isDesktop ? Math.max(fx, fy) : fx) * 1.06;
        };
        const setName = (i) => reelNames.forEach((n, k) => n.classList.toggle('is-on', k === i));
        gsap.set(reelStage, { scale: 0.46 });
        gsap.timeline({ scrollTrigger: {
          trigger: '#reel', start: 'top top', end: '+=220%', pin: '.reel__pin', scrub: true,
          onUpdate: (s) => setName(s.progress < 0.5 ? 0 : s.progress < 0.72 ? 1 : 2),
        } })
          .to('#reelHead', { opacity: 0, y: -30, ease: 'none' }, 0)
          .to(reelStage, { scale: coverScale, ease: 'none' }, 0)
          .to('.reel__img[data-r="0"]', { opacity: 0, ease: 'none' }, 0.46)
          .to('.reel__img[data-r="1"]', { opacity: 1, ease: 'none' }, 0.46)
          .to('.reel__img[data-r="1"]', { opacity: 0, ease: 'none' }, 0.68)
          .to('.reel__img[data-r="2"]', { opacity: 1, ease: 'none' }, 0.68)
          .to(reelStage, { scale: () => coverScale() * 0.62, ease: 'none' }, 0.9);
      }
    });
  }

  /* SEO : effet machine à écrire piloté par le scroll (0→1) */
  function typeQuery(p) {
    const el = $('#serpQuery'); if (!el) return;
    const q = CONFIG.seoQuery;
    const n = Math.round(clamp(p / 0.35, 0, 1) * q.length);
    el.textContent = q.slice(0, n);
  }

  /* =========================================================
     WORKS — galerie + tilt + modale étude de cas
     ========================================================= */
  function initWorks() {
    const grid = $('#worksGrid'); if (!grid) return;
    CONFIG.projects.forEach((p, i) => {
      const card = document.createElement('article');
      card.className = 'work-card';
      card.dataset.i = i;
      card.innerHTML = `
        <div class="work-card__glow"></div>
        <div class="work-card__media"><img src="${p.img}" alt="${p.title} — ${p.sector}" loading="lazy" decoding="async"></div>
        <div class="work-card__body">
          <div><span class="work-card__meta">${p.sector}</span><div class="work-card__title">${p.title}</div></div>
          <span class="work-card__cta">Étude de cas →</span>
        </div>`;
      card.addEventListener('click', () => openCase(p));
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter') openCase(p); });
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      grid.appendChild(card);

      // reveal
      if (hasGSAP && !prefersReduced) {
        ScrollTrigger.create({ trigger: card, start: 'top 88%', once: true, onEnter: () => card.classList.add('is-in') });
      } else card.classList.add('is-in');

      // tilt (desktop, sans reduced motion)
      if (!prefersReduced && window.matchMedia('(pointer:fine)').matches) {
        const media = $('.work-card__media img', card);
        card.addEventListener('pointermove', (e) => {
          const r = card.getBoundingClientRect();
          const rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
          const ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
          card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
          if (media) media.style.transform = `scale(1.08) translate(${ry * 0.6}px, ${rx * -0.6}px)`;
        });
        card.addEventListener('pointerleave', () => { card.style.transform = ''; if (media) media.style.transform = ''; });
      }
    });
  }

  function openCase(p) {
    const modal = $('#caseModal'); const body = $('#caseBody'); if (!modal || !body) return;
    body.innerHTML = `
      <div class="case__hero"><img src="${p.img}" alt="${p.title}"></div>
      <div class="case__inner">
        <span class="case__meta">${p.sector}</span>
        <h3 class="case__title" id="caseTitle">${p.title}</h3>
        <div class="case__grid">
          <div class="case__block"><h4>Problématique</h4><p>${p.problem}</p></div>
          <div class="case__block"><h4>Solution</h4><p>${p.solution}</p></div>
          <div class="case__block"><h4>Technologies</h4><div class="case__tech">${p.tech.map((t) => `<span>${t}</span>`).join('')}</div></div>
          <div class="case__block"><h4>Résultat</h4><p>${p.result}</p><p class="case__ph">Projet réel — les indicateurs chiffrés sont communiqués sur demande.</p></div>
        </div>
      </div>`;
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked'); if (lenis) lenis.stop();
  }
  function closeCase() {
    const modal = $('#caseModal'); if (!modal) return;
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked'); if (lenis) lenis.start();
  }
  function initModal() {
    const modal = $('#caseModal'); if (!modal) return;
    $$('[data-close]', modal).forEach((el) => el.addEventListener('click', closeCase));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCase(); });
  }

  /* =========================================================
     STATS
     ========================================================= */
  function initStats() {
    const grid = $('#statsGrid'); if (!grid) return;
    CONFIG.stats.forEach((s) => {
      const li = document.createElement('li');
      li.innerHTML = `<div class="st-word">${s.word}</div><div class="st-desc">${s.desc}</div>`;
      grid.appendChild(li);
      if (hasGSAP && !prefersReduced) {
        ScrollTrigger.create({ trigger: li, start: 'top 90%', once: true, onEnter: () => li.classList.add('is-in') });
      } else li.classList.add('is-in');
    });
  }

  /* =========================================================
     CTA — la scène s'illumine au scroll
     ========================================================= */
  function initCTA() {
    if (!hasGSAP || prefersReduced) return;
    ScrollTrigger.create({
      trigger: '#contact', start: 'top bottom', end: 'center center', scrub: true,
      onUpdate: (self) => { if (fields.cta) fields.cta.setEnergy(self.progress); },
    });
  }

  /* =========================================================
     FORMULAIRE — validation élégante + envoi (formsubmit)
     ========================================================= */
  function initForm() {
    const form = $('#contactForm'); if (!form) return;
    const status = $('#formStatus');
    const setErr = (field, msg) => {
      const wrap = field.closest('.field'); if (!wrap) return;
      wrap.classList.toggle('has-error', !!msg);
      const err = $('[data-err]', wrap); if (err) err.textContent = msg || '';
    };
    const validators = {
      'f-name': (v) => v.trim().length >= 2 || 'Indiquez votre nom.',
      'f-email': (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Adresse email invalide.',
      'f-type': (v) => !!v || 'Choisissez un type de projet.',
      'f-message': (v) => v.trim().length >= 10 || 'Quelques mots de plus sur votre projet ?',
    };
    Object.keys(validators).forEach((id) => {
      const el = $('#' + id); if (!el) return;
      el.addEventListener('blur', () => { const r = validators[id](el.value); setErr(el, r === true ? '' : r); });
      el.addEventListener('input', () => { if (el.closest('.field').classList.contains('has-error')) { const r = validators[id](el.value); setErr(el, r === true ? '' : r); } });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form._honey && form._honey.value) return; // honeypot
      let ok = true; let firstBad = null;
      Object.keys(validators).forEach((id) => {
        const el = $('#' + id); const r = validators[id](el.value);
        if (r !== true) { ok = false; setErr(el, r); if (!firstBad) firstBad = el; } else setErr(el, '');
      });
      if (!ok) { firstBad?.focus(); status.textContent = 'Merci de corriger les champs indiqués.'; status.className = 'pform__status err'; return; }

      status.textContent = 'Envoi en cours…'; status.className = 'pform__status';
      const btn = $('button[type="submit"]', form); if (btn) btn.disabled = true;
      const endpoint = form.dataset.endpoint;
      try {
        const data = new FormData(form);
        const res = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: data });
        if (!res.ok) throw new Error('bad');
        form.reset();
        status.textContent = 'Message envoyé — je vous réponds sous 24 h. Merci !';
        status.className = 'pform__status ok';
      } catch (err) {
        const wa = form.dataset.whatsapp;
        status.innerHTML = `Une erreur est survenue. Écrivez-moi directement sur <a href="${wa}" target="_blank" rel="noopener" style="color:var(--accent-hi);text-decoration:underline">WhatsApp</a> ou à contact@uploaded.be.`;
        status.className = 'pform__status err';
      } finally { if (btn) btn.disabled = false; }
    });
  }

  /* =========================================================
     Fragments de la scène "Problème" (grille qui se recompose)
     ========================================================= */
  function initFragments() {
    const grid = $('#fragGrid'); if (!grid || grid.children.length) return;
    for (let i = 0; i < 24; i++) grid.appendChild(document.createElement('i'));
  }

  /* =========================================================
     Année footer
     ========================================================= */
  function initYear() { $$('.js-year').forEach((el) => el.textContent = new Date().getFullYear()); }

  /* =========================================================
     CURSEUR CUSTOM — point net + anneau qui suit en douceur
     ========================================================= */
  function initCursor() {
    if (prefersReduced || !window.matchMedia('(pointer: fine)').matches || window.matchMedia('(max-width: 900px)').matches) return;
    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    const ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.append(dot, ring);
    document.body.classList.add('has-cursor');
    let mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    }, { passive: true });
    const loop = () => { rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`; requestAnimationFrame(loop); };
    loop();
    const sel = 'a, button, .work-card, [data-scroll-to], input, textarea, select, .rail__list li, .wa-fab';
    document.addEventListener('pointerover', (e) => { if (e.target.closest && e.target.closest(sel)) ring.classList.add('is-hover'); });
    document.addEventListener('pointerout', (e) => { if (e.target.closest && e.target.closest(sel)) ring.classList.remove('is-hover'); });
    // masque le curseur quand il quitte la fenêtre
    document.addEventListener('mouseleave', () => { dot.style.opacity = ring.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = ring.style.opacity = '1'; });
  }

  /* =========================================================
     BOUTONS MAGNÉTIQUES — attirés par le curseur
     ========================================================= */
  function initMagnetic() {
    if (prefersReduced || !window.matchMedia('(pointer: fine)').matches) return;
    const targets = $$('.nav__cta, .hero__actions .btn, .pform__actions .btn, .cta .btn');
    targets.forEach((el) => {
      const s = 0.32;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * s}px, ${y * s}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* =========================================================
     BOOT
     ========================================================= */
  function boot() {
    initYear();
    initFragments();
    initScroll();
    // Fond du hero : vidéo (si data-src) → sinon 3D WebGL → sinon canvas 2D
    const videoOn = initHeroVideo();
    const hero3d = videoOn ? null : initHero3D();
    initFields({ skipHero: videoOn || !!hero3d });
    heroFX = hero3d || { setEnergy: (e) => { if (fields.hero) fields.hero.setEnergy(e); } };
    startHeroDisplay(hero3d);
    initCursor();
    initMagnetic();
    initNav();
    initRail();
    initReveal();
    initWorks();
    initStats();
    initModal();
    initForm();
    initScenes();
    initCTA();
    if (hasGSAP) requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  preloader().then(boot);
  // filet de sécurité : si le preloader n'aboutit pas, on démarre quand même
  window.addEventListener('load', () => { setTimeout(() => { if (!window.__uploadedBooted) { window.__uploadedBooted = true; } }, 100); });
})();
