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
  const HERO_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
  const HERO_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse; uniform float uEnergy;
    uniform vec3 uBg; uniform vec3 uBlue; uniform vec3 uViolet; uniform vec3 uCyan;
    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
      vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy; i=mod289(i);
      vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
      float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
      vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
      vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
      vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
      return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }
    float fbm(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*snoise(p); p*=2.03; a*=0.5; } return v; }
    void main(){
      vec2 asp = vec2(uRes.x/max(uRes.y,1.0), 1.0);
      vec2 p = (vUv-0.5)*asp;
      float t = uTime*0.05;
      float w1 = fbm(vec3(p*1.3, t));
      float w2 = fbm(vec3(p*0.9+vec2(5.2,1.3), t*0.7)+w1*0.6);
      vec2 warp = vec2(w1,w2)*0.55;
      float fb = fbm(vec3((p+warp)*1.05+vec2(1.7,9.2), t*1.2));
      float fv = fbm(vec3((p-warp*0.8)*0.95+vec2(-4.0,2.0), t*0.9+10.0));
      float fc = fbm(vec3((p+warp*1.2)*1.4+vec2(8.0,-3.0), t*1.5+20.0));
      float b = smoothstep(0.08,0.92,fb*0.5+0.5);
      float vv = smoothstep(0.20,0.96,fv*0.5+0.5);
      float c = smoothstep(0.36,1.0,fc*0.5+0.5);
      vec3 col = uBg;
      col = mix(col, uBlue,   b*(0.55+uEnergy*0.4));
      col = mix(col, uViolet, vv*(0.45+uEnergy*0.35));
      col += uCyan * c * (0.10+uEnergy*0.18);
      float md = distance(p, (uMouse-0.5)*asp);
      col += uBlue * smoothstep(0.7,0.0,md) * (0.10+uEnergy*0.14);
      float vig = smoothstep(1.35,0.15,length(p));
      col *= mix(0.5,1.0,vig);
      float g = fract(sin(dot(vUv*uRes, vec2(12.9898,78.233)))*43758.5453);
      col += (g-0.5)*0.02;
      gl_FragColor = vec4(col, 1.0);
    }`;

  /* =========================================================
     FOND WebGL — DÉGRADÉ LIQUIDE animé (shader Three.js)
     Couleurs qui coulent, réagit à la souris + au scroll (énergie).
     Desktop ET mobile. Fallback canvas 2D si WebGL indisponible.
     ========================================================= */
  function initHero3D() {
    if (prefersReduced || !window.THREE) return null;
    const host = $('#heroGL'); if (!host) return null;
    const THREE = window.THREE; let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' }); }
    catch (e) { return null; }
    if (!renderer) return null;
    const light = window.matchMedia('(max-width: 900px)').matches;
    renderer.setPixelRatio(Math.min(light ? 1.5 : 2, window.devicePixelRatio || 1));
    let w = host.clientWidth || window.innerWidth, h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTime: { value: 0 }, uRes: { value: new THREE.Vector2(w, h) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) }, uEnergy: { value: 0 },
      uBg: { value: new THREE.Color(0x05070e) },
      uBlue: { value: new THREE.Color(0x2340ff) },
      uViolet: { value: new THREE.Color(0x7b34ff) },
      uCyan: { value: new THREE.Color(0x3fa0ff) },
    };
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ uniforms, vertexShader: HERO_VERT, fragmentShader: HERO_FRAG }));
    scene.add(mesh);

    let energy = 0, target = 0, running = false;
    const mTarget = { x: 0.5, y: 0.5 };
    let lastInput = -999;
    const setInput = (x, y) => { mTarget.x = clamp(x, 0, 1); mTarget.y = clamp(y, 0, 1); lastInput = uniforms.uTime.value; };
    window.addEventListener('pointermove', (e) => setInput(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight), { passive: true });
    window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) setInput(t.clientX / window.innerWidth, 1 - t.clientY / window.innerHeight); }, { passive: true });
    // MOBILE : le dégradé suit l'inclinaison du téléphone (gyroscope)
    if (light) {
      const onTilt = (e) => { if (e.gamma == null && e.beta == null) return;
        setInput(0.5 + clamp((e.gamma || 0) / 40, -1, 1) * 0.5, 0.5 - clamp(((e.beta || 0) - 45) / 40, -1, 1) * 0.5); };
      const DOE = window.DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission === 'function') {
        // iOS : permission requise → demandée quand on touche le hero (contextuel)
        const heroEl = $('#hero') || document.body;
        heroEl.addEventListener('touchend', function once() {
          DOE.requestPermission().then((s) => { if (s === 'granted') window.addEventListener('deviceorientation', onTilt); }).catch(() => {});
        }, { once: true });
      } else if (DOE) { window.addEventListener('deviceorientation', onTilt); }
    }
    function resize() { w = host.clientWidth; h = host.clientHeight; renderer.setSize(w, h); uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio()); }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    function frame() {
      if (!running) return;
      uniforms.uTime.value += 0.016;
      energy += (target - energy) * 0.05;
      uniforms.uEnergy.value = energy;
      // dérive douce quand pas d'interaction récente → vivant sans y toucher
      let tx = mTarget.x, ty = mTarget.y;
      if (uniforms.uTime.value - lastInput > 2.0) {
        const a = uniforms.uTime.value * 0.25;
        tx = 0.5 + Math.cos(a) * 0.3; ty = 0.5 + Math.sin(a * 0.8) * 0.24;
      }
      uniforms.uMouse.value.x += (tx - uniforms.uMouse.value.x) * 0.045;
      uniforms.uMouse.value.y += (ty - uniforms.uMouse.value.y) * 0.045;
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    const io = new IntersectionObserver((ent) => { running = ent[0].isIntersecting; if (running) frame(); }, { threshold: 0.01 });
    io.observe(host);

    const c2d = $('#heroCanvas'); if (c2d) c2d.style.display = 'none';
    return { setEnergy(e) { target = clamp(e, 0, 1); }, resize };
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
