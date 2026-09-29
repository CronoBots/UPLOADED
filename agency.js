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
  function initFields() {
    if (prefersReduced) return;
    const hero = $('#heroCanvas');
    const sol = $('#solutionCanvas');
    const cta = $('#ctaCanvas');
    const light = window.matchMedia('(max-width: 900px)').matches;
    if (hero) fields.hero = new ParticleField(hero, { maxCount: light ? 60 : 130, converge: true, color: '120,165,255' });
    if (sol)  fields.sol  = new ParticleField(sol,  { maxCount: light ? 45 : 90, color: '139,120,255', linkDist: 150 });
    if (cta)  fields.cta  = new ParticleField(cta,  { maxCount: light ? 55 : 120, converge: true, color: '120,165,255' });

    // pointeur (glow) sur hero
    if (hero && fields.hero) {
      window.addEventListener('pointermove', (ev) => {
        const r = hero.getBoundingClientRect();
        fields.hero.mouse.x = ev.clientX - r.left;
        fields.hero.mouse.y = ev.clientY - r.top;
      }, { passive: true });
    }
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
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.2 });
    else el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
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
    const mm = gsap.matchMedia();

    /* -------- commun (desktop + mobile léger) -------- */
    mm.add('(min-width: 901px)', () => {
      /* ---- HERO : caméra avance, particules convergent ---- */
      const heroTitleLines = $$('.hero__title .line__inner');
      gsap.set(heroTitleLines, { yPercent: 110 });
      gsap.to(heroTitleLines, { yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out', delay: 0.2 });
      gsap.from('.hero__eyebrow, .hero__sub, .hero__actions', { y: 24, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.5 });

      const heroTl = gsap.timeline({
        scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=110%', pin: '.hero__pin', scrub: true },
      });
      heroTl.to('.hero__content', { scale: 1.12, y: -40, opacity: 0, ease: 'none' }, 0)
            .to('.hero__scroll', { opacity: 0, ease: 'none' }, 0)
            .to({}, { duration: 1, onUpdate() { if (fields.hero) fields.hero.setEnergy(this.progress()); } }, 0);

      /* ---- PROBLEM : grille fragmentée qui se reconnecte ---- */
      const frags = $$('#fragGrid i');
      frags.forEach((f) => gsap.set(f, { x: gsap.utils.random(-140, 140), y: gsap.utils.random(-120, 120), rotate: gsap.utils.random(-40, 40), opacity: 0 }));
      gsap.timeline({ scrollTrigger: { trigger: '#probleme', start: 'top top', end: '+=120%', pin: '.problem__pin', scrub: true } })
        .to(frags, { x: 0, y: 0, rotate: 0, opacity: 0.6, stagger: 0.02, ease: 'power2.out' }, 0)
        .from('.floatword', { opacity: 0, scale: 0.6, stagger: 0.1 }, 0.1)
        .from('.problem__list li', { y: 40, opacity: 0, stagger: 0.15, ease: 'power2.out' }, 0.3);

      /* ---- SOLUTION : plateforme se construit, piliers ---- */
      gsap.timeline({ scrollTrigger: { trigger: '#solution', start: 'top top', end: '+=120%', pin: '.solution__pin', scrub: true } })
        .to({}, { onUpdate() { if (fields.sol) fields.sol.setEnergy(this.progress()); } }, 0)
        .from('.pillar', { y: 60, opacity: 0, stagger: 0.25, ease: 'power3.out' }, 0.1)
        .from('.pillar__no', { scale: 0.5, opacity: 0, stagger: 0.25 }, 0.15);

      /* ---- WEB : le navigateur se construit composant par composant ---- */
      gsap.set('#browser', { rotateX: 8, rotateY: -10, transformPerspective: 1200 });
      gsap.timeline({ scrollTrigger: { trigger: '#web', start: 'top top', end: '+=160%', pin: '.web__pin', scrub: true } })
        .from('#browser', { opacity: 0, y: 80, scale: 0.9, ease: 'power2.out' }, 0)
        .to('#browser', { rotateX: 0, rotateY: 0, ease: 'none' }, 0)
        .to('.bx-nav',   { opacity: 1, ease: 'none' }, 0.15)
        .to('.bx-hero',  { opacity: 1, ease: 'none' }, 0.3)
        .to('.bx-cards', { opacity: 1, ease: 'none' }, 0.5)
        .to('.bx-stats', { opacity: 1, ease: 'none' }, 0.7)
        .to('#browser',  { scale: 1.06, ease: 'none' }, 0.8);

      /* ---- APPS : le téléphone tourne, les écrans défilent ---- */
      const screens = $$('#phone .pscreen');
      gsap.set(screens, { opacity: 0 });
      gsap.set(screens[0], { opacity: 1 });
      const appsTl = gsap.timeline({ scrollTrigger: { trigger: '#apps', start: 'top top', end: '+=170%', pin: '.apps__pin', scrub: true } });
      appsTl.from('#phone', { opacity: 0, y: 60, ease: 'power2.out' }, 0)
            .to('.phone__frame', { rotateY: 12, ease: 'none' }, 0);
      screens.forEach((sc, i) => {
        if (i === 0) return;
        const at = 0.15 + i * 0.22;
        appsTl.to(screens[i - 1], { opacity: 0, ease: 'none' }, at)
              .to(sc, { opacity: 1, ease: 'none' }, at);
      });

      /* ---- SEO : requête tapée, résultats, "vous" remonte ---- */
      const results = $$('#serp .serp__item');
      const you = $('#serp .serp__item--you');
      gsap.set(results, { opacity: 0, y: 16 });
      const seoTl = gsap.timeline({ scrollTrigger: {
        trigger: '#seo', start: 'top top', end: '+=170%', pin: '.seo__pin', scrub: true,
        onUpdate: (self) => typeQuery(self.progress),
      } });
      results.forEach((r, i) => seoTl.to(r, { opacity: 1, y: 0, ease: 'none' }, 0.3 + i * 0.08));
      // "vous" remonte de la 3e place vers le haut
      seoTl.to(you, { order: 0 }, 0.7)
           .fromTo(you, { y: 0 }, { y: () => -(you.offsetHeight + 12) * 2, ease: 'power2.inOut' }, 0.78)
           .to(you, { boxShadow: '0 0 45px -6px rgba(59,118,255,.7)', ease: 'none' }, 0.85);

      /* ---- PROCESS : scroll horizontal + ligne lumineuse ---- */
      const track = $('#processTrack');
      const steps = $$('.pstep');
      const line = $('#processLine');
      const totalX = () => Math.max(0, track.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) );
      const procTl = gsap.timeline({ scrollTrigger: {
        trigger: '#process', start: 'top top', end: () => '+=' + (track.scrollWidth * 0.9),
        pin: '.process__pin', scrub: true,
        onUpdate: (self) => {
          if (line) line.style.width = (self.progress * 100) + '%';
          const idx = Math.round(self.progress * (steps.length - 1));
          steps.forEach((s, i) => s.classList.toggle('is-active', i <= idx));
        },
      } });
      procTl.to('.process__steps', { x: () => -totalX(), ease: 'none' });
    });

    /* -------- MOBILE : storytelling conservé, sans pins lourds -------- */
    mm.add('(max-width: 900px)', () => {
      // révélations simples, pas de pin ni scrub coûteux
      $$('.bx').forEach((b) => b.style.opacity = 1);
      const first = $('#phone .pscreen[data-ps="0"]'); if (first) first.style.opacity = 1;
      $$('#serp .serp__item').forEach((r) => { r.style.opacity = 1; r.style.transform = 'none'; });
      typeQuery(1);
      $$('.pstep').forEach((s) => s.classList.add('is-active'));

      const groups = ['.pillar', '.problem__list li', '.tagcloud li', '#browser', '#phone', '#serp'];
      groups.forEach((sel) => $$(sel).forEach((el) => {
        ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true,
          onEnter: () => gsap.fromTo(el, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' }) });
      }));
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
     BOOT
     ========================================================= */
  function boot() {
    initYear();
    initFragments();
    initScroll();
    initFields();
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
