/* ============================================================
   UPLOADED — Template ÉDITORIAL · interactions
   Lenis + GSAP · accordéon services · lignes projets · curseur.
   Contenu éditable via CONFIG.
   ============================================================ */
(() => {
  'use strict';

  const CONFIG = {
    services: [
      { no: '01', name: 'Création Web', img: 'img/yumea-desktop.webp',
        desc: "Des sites rapides, modernes et conçus pour convertir vos visiteurs en clients. Design sur mesure, responsive, performance, UX/UI, sécurité et CMS personnalisés.",
        tags: ['Design sur mesure', 'Responsive', 'Performance', 'UX/UI', 'Conversion', 'Sécurité', 'CMS'] },
      { no: '02', name: 'Applications mobiles', img: 'img/jaydenmusic-mobile.webp',
        desc: "Des applications iOS et Android modernes, intuitives et pensées pour offrir une expérience simple, fluide et mémorable — conçues pour évoluer avec votre activité.",
        tags: ['iOS', 'Android', 'Cross-platform', 'Sur mesure'] },
      { no: '03', name: 'Référencement SEO', img: 'img/pizzapino-desktop.webp',
        desc: "Une stratégie SEO conçue pour améliorer votre visibilité et attirer durablement un trafic qualifié. Fondations techniques propres, contenu, autorité — sans promesses en l'air.",
        tags: ['Visibilité', 'Trafic qualifié', 'Autorité', 'Conversions'] },
    ],
    projects: [
      { slug: 'cryptonauts', title: 'Cryptonauts', sector: 'Web3 · NFT community', img: 'img/cryptonauts-desktop.webp',
        problem: "Une communauté NFT active mais dispersée, sans vitrine officielle pour centraliser classement, ventes et informations en temps réel.",
        solution: "Un site vitrine dynamique qui agrège les données on-chain et de marketplace, avec classement des détenteurs et statistiques rafraîchies automatiquement.",
        tech: ['HTML/CSS/JS', 'API on-chain', 'GraphQL', 'GitHub Actions', 'Automatisations'],
        result: "Un point de référence unique pour la communauté, mis à jour sans intervention manuelle." },
      { slug: 'jaydenmusic', title: 'Jayden Music', sector: 'Artiste · musique', img: 'img/jaydenmusic-desktop.webp',
        problem: "Un artiste sans présence en ligne à la hauteur de son univers, difficile à trouver et à partager.",
        solution: "Un site immersif centré sur l'écoute et l'image de marque, pensé mobile-first pour le partage sur les réseaux.",
        tech: ['Design sur mesure', 'Responsive', 'Performance', 'SEO'],
        result: "Une vitrine soignée qui reflète l'identité de l'artiste et facilite la découverte." },
      { slug: 'pizzapino', title: 'Pizza Pino', sector: 'Restaurant · commerce local', img: 'img/pizzapino-desktop.webp',
        problem: "Une pizzeria dépendante des plateformes tierces, sans canal direct pour présenter la carte et prendre contact.",
        solution: "Un site vitrine avec menu en ligne, liste de commande et appel direct — simple pour le client, autonome pour le gérant.",
        tech: ['Site vitrine', 'Menu dynamique', 'Mobile-first', 'SEO local'],
        result: "Un canal direct qui met en avant la carte et facilite la prise de contact." },
      { slug: 'yumea', title: 'Yumea', sector: 'Marque · lifestyle', img: 'img/yumea-desktop.webp',
        problem: "Une marque émergente cherchant une présence digitale élégante et crédible pour se lancer.",
        solution: "Une identité digitale premium et cohérente, avec une expérience de navigation soignée sur tous les écrans.",
        tech: ['Direction artistique', 'Responsive', 'Performance', 'UX/UI'],
        result: "Une image de marque affirmée, prête à accueillir sa croissance." },
    ],
    steps: [
      { no: '01', name: 'Découverte', desc: 'On cerne vos objectifs, votre marché et vos utilisateurs.' },
      { no: '02', name: 'Stratégie', desc: 'Architecture, contenus et parcours pensés pour convertir.' },
      { no: '03', name: 'Design', desc: 'Une direction artistique sur mesure, jamais générique.' },
      { no: '04', name: 'Développement', desc: 'Un code propre, rapide et durable, testé sur tous les écrans.' },
      { no: '05', name: 'Mise en ligne', desc: 'Déploiement, mesure et vérifications avant l\'ouverture.' },
      { no: '06', name: 'Optimisation', desc: 'On suit, on ajuste, on fait progresser dans la durée.' },
    ],
    values: [
      { no: '01', name: 'Performance', desc: 'Sites rapides, Core Web Vitals soignés.' },
      { no: '02', name: 'Visibilité', desc: 'Fondations SEO propres pour être trouvé.' },
      { no: '03', name: 'Expérience', desc: 'Interfaces fluides et responsive.' },
      { no: '04', name: 'Conversion', desc: 'Chaque parcours pensé pour transformer.' },
    ],
    facts: [
      { b: '25 ans', i: 'de métier' },
      { b: '1', i: 'interlocuteur unique' },
      { b: '24 h', i: 'pour un premier retour' },
    ],
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(max-width: 900px)').matches || !window.matchMedia('(pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  document.documentElement.classList.add('reveal-ready');
  if (prefersReduced) document.body.classList.add('reduced');

  /* ---------------- PRELOADER ---------------- */
  function preloader() {
    const el = $('#preloader'); if (!el) return Promise.resolve();
    const bar = $('.pre__rule i', el), pct = $('#prePct');
    return new Promise((resolve) => {
      let p = 0;
      const tick = () => {
        p = Math.min(100, p + Math.max(2.5, (100 - p) * 0.14));
        if (bar) bar.style.width = p + '%'; if (pct) pct.textContent = Math.round(p);
        if (p < 99.5) requestAnimationFrame(tick);
        else { el.classList.add('done'); setTimeout(resolve, 460); }
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------------- LENIS + GSAP ---------------- */
  let lenis = null;
  function initScroll() {
    if (!prefersReduced && typeof window.Lenis !== 'undefined') {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
      if (hasGSAP) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
      else { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
    }
    if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
  }
  function scrollTo(target) {
    const el = typeof target === 'string' ? $(target) : target; if (!el) return;
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 82;
    if (lenis) lenis.scrollTo(el, { offset: -navH, duration: 1.2 });
    else { const y = el.getBoundingClientRect().top + window.scrollY - navH; window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' }); }
  }

  /* ---------------- NAV ---------------- */
  function initNav() {
    const nav = $('#nav'), burger = $('#navBurger'), menu = $('#mobileMenu');
    const onScroll = () => { nav.classList.toggle('is-scrolled', (window.scrollY || 0) > 30); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    const close = () => { nav.classList.remove('is-open'); menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true'); burger.setAttribute('aria-expanded', 'false'); document.body.classList.remove('is-locked'); };
    burger?.addEventListener('click', () => {
      const open = !menu.classList.contains('is-open');
      nav.classList.toggle('is-open', open); menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open)); burger.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-locked', open);
    });
    $$('[data-scroll-to]').forEach((a) => a.addEventListener('click', (e) => {
      const href = a.getAttribute('href'); if (href && href.startsWith('#')) { e.preventDefault(); close(); scrollTo(href); }
    }));
    // liens actifs
    if (hasGSAP) {
      const map = [['#services', ['Création Web', 'Applications', 'SEO']], ['#work', ['Réalisations']], ['#about', ['À propos']]];
      const links = $$('.nav__links a');
      const setActive = (id) => links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
      ['#services', '#work', '#about', '#contact'].forEach((id) => { const sec = $(id); if (sec) ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => { if (s.isActive) setActive(id); } }); });
    }
  }

  /* ---------------- SERVICES (accordéon + preview) ---------------- */
  function buildServices() {
    const ul = $('#srv'); if (!ul) return;
    const preview = $('#srvPreview');
    CONFIG.services.forEach((s) => {
      const li = document.createElement('li'); li.className = 'srv__row'; li.dataset.img = s.img;
      li.innerHTML = `
        <button class="srv__head" aria-expanded="false">
          <span class="srv__no">${s.no}</span>
          <span class="srv__name">${s.name}</span>
          <span class="srv__plus" aria-hidden="true"></span>
        </button>
        <div class="srv__panel"><div class="srv__panel-in">
          <span></span>
          <div>
            <p class="srv__desc">${s.desc}</p>
            <div class="srv__tags">${s.tags.map((t) => `<span>${t}</span>`).join('')}</div>
          </div>
        </div></div>`;
      ul.appendChild(li);

      const head = $('.srv__head', li), panel = $('.srv__panel', li);
      head.addEventListener('click', () => {
        const open = !li.classList.contains('is-open');
        $$('.srv__row', ul).forEach((r) => { r.classList.remove('is-open'); $('.srv__panel', r).style.maxHeight = null; $('.srv__head', r).setAttribute('aria-expanded', 'false'); });
        if (open) { li.classList.add('is-open'); panel.style.maxHeight = panel.scrollHeight + 'px'; head.setAttribute('aria-expanded', 'true'); }
      });
    });

    // preview flottante (desktop)
    if (preview && !isTouch && !prefersReduced) {
      const section = $('#services');
      let raf = null, tx = 0, ty = 0, cx = 0, cy = 0;
      $$('.srv__head', ul).forEach((head) => {
        const row = head.closest('.srv__row');
        head.addEventListener('pointerenter', () => { preview.src = row.dataset.img; preview.classList.add('is-on'); });
        head.addEventListener('pointerleave', () => { preview.classList.remove('is-on'); });
      });
      section.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; });
      const loop = () => { cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
        preview.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%) scale(1)`; raf = requestAnimationFrame(loop); };
      loop();
    }
  }

  /* ---------------- WORK ---------------- */
  function buildWork() {
    const ul = $('#works'); if (!ul) return;
    CONFIG.projects.forEach((p, i) => {
      const li = document.createElement('li'); li.className = 'work-row'; li.tabIndex = 0; li.setAttribute('role', 'button');
      if (isTouch) li.classList.add('reveal-static');
      li.innerHTML = `
        <div class="work-row__head">
          <span class="work-row__no">${String(i + 1).padStart(2, '0')}</span>
          <span class="work-row__name">${p.title}</span>
          <span class="work-row__meta">${p.sector}</span>
        </div>
        <div class="work-row__media"><img src="${p.img}" alt="${p.title} — ${p.sector}" loading="lazy" decoding="async"></div>`;
      li.addEventListener('click', () => openCase(p));
      li.addEventListener('keydown', (e) => { if (e.key === 'Enter') openCase(p); });
      ul.appendChild(li);
      if (hasGSAP && !prefersReduced) ScrollTrigger.create({ trigger: li, start: 'top 88%', once: true, onEnter: () => gsap.from(li, { y: 26, opacity: 0, duration: .9, ease: 'power3.out' }) });
    });
  }

  /* ---------------- PROCESS / VALUES / FACTS ---------------- */
  function buildSteps() {
    const ol = $('#steps'); if (!ol) return;
    CONFIG.steps.forEach((s) => { const li = document.createElement('li');
      li.innerHTML = `<span class="steps__no">${s.no}</span><div><div class="steps__name">${s.name}</div><p class="steps__desc">${s.desc}</p></div>`;
      ol.appendChild(li);
      if (hasGSAP && !prefersReduced) ScrollTrigger.create({ trigger: li, start: 'top 90%', once: true, onEnter: () => gsap.from(li, { y: 20, opacity: 0, duration: .8, ease: 'power2.out' }) });
    });
  }
  function buildValues() {
    const ul = $('#values'); if (!ul) return;
    CONFIG.values.forEach((v) => { const li = document.createElement('li');
      li.innerHTML = `<div class="v-no">${v.no}</div><div class="v-name">${v.name}</div><div class="v-desc">${v.desc}</div>`;
      ul.appendChild(li);
      if (hasGSAP && !prefersReduced) ScrollTrigger.create({ trigger: li, start: 'top 92%', once: true, onEnter: () => gsap.from(li, { y: 18, opacity: 0, duration: .7, ease: 'power2.out' }) });
    });
  }
  function buildFacts() {
    const ul = $('#facts'); if (!ul) return;
    CONFIG.facts.forEach((f) => { const li = document.createElement('li'); li.innerHTML = `<b>${f.b}</b><i>${f.i}</i>`; ul.appendChild(li); });
  }

  /* ---------------- MODAL ---------------- */
  function openCase(p) {
    const modal = $('#caseModal'), body = $('#caseBody'); if (!modal || !body) return;
    body.innerHTML = `
      <button class="modal__close" data-close aria-label="Fermer">Fermer ×</button>
      <div class="case__hero"><img src="${p.img}" alt="${p.title}"></div>
      <div class="case__inner">
        <span class="case__meta">${p.sector}</span>
        <h3 class="case__title" id="caseTitle">${p.title}</h3>
        <div class="case__grid">
          <div class="case__block"><h4>Problématique</h4><p>${p.problem}</p></div>
          <div class="case__block"><h4>Solution</h4><p>${p.solution}</p></div>
          <div class="case__block"><h4>Technologies</h4><div class="case__tech">${p.tech.map((t) => `<span>${t}</span>`).join('')}</div></div>
          <div class="case__block"><h4>Résultat</h4><p>${p.result}</p><p class="case__ph">Projet réel — indicateurs chiffrés communiqués sur demande.</p></div>
        </div>
      </div>`;
    $('[data-close]', body).addEventListener('click', closeCase);
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('is-locked'); if (lenis) lenis.stop();
  }
  function closeCase() { const modal = $('#caseModal'); if (!modal) return; modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('is-locked'); if (lenis) lenis.start(); }
  function initModal() { const modal = $('#caseModal'); if (!modal) return; $$('[data-close]', modal).forEach((el) => el.addEventListener('click', closeCase)); document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCase(); }); }

  /* ---------------- REVEAL + HERO INTRO ---------------- */
  function initReveal() {
    const els = $$('[data-reveal]');
    if (prefersReduced || !hasGSAP) { els.forEach((e) => e.classList.add('is-in')); $$('.rule').forEach((r) => r.classList.add('is-in')); return; }
    els.forEach((el) => ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => el.classList.add('is-in') }));
    $$('.rule').forEach((r) => ScrollTrigger.create({ trigger: r, start: 'top 92%', once: true, onEnter: () => r.classList.add('is-in') }));
  }
  function heroIntro() {
    if (prefersReduced || !hasGSAP) { $('.hero__rule')?.classList.add('is-in'); return; }
    const lines = $$('.hero__title .ln > span');
    gsap.set(lines, { yPercent: 110 });
    gsap.to(lines, { yPercent: 0, duration: 1.15, stagger: 0.1, ease: 'expo.out', delay: 0.15 });
    gsap.from('.hero__eyebrow, .hero__index', { opacity: 0, y: 16, duration: .9, delay: .3, ease: 'power2.out' });
    gsap.from('.hero__foot', { opacity: 0, y: 22, duration: 1, delay: .7, ease: 'power3.out' });
    setTimeout(() => $('.hero__rule')?.classList.add('is-in'), 700);
  }

  /* ---------------- CURSEUR + MAGNÉTIQUE ---------------- */
  function initCursor() {
    if (prefersReduced || isTouch) return;
    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    const ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.append(dot, ring); document.body.classList.add('has-cursor');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; }, { passive: true });
    const loop = () => { rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); };
    loop();
    const sel = 'a, button, .srv__head, .work-row, [data-scroll-to], input, textarea, select, .wa-fab';
    document.addEventListener('pointerover', (e) => { if (e.target.closest && e.target.closest(sel)) ring.classList.add('is-hover'); });
    document.addEventListener('pointerout', (e) => { if (e.target.closest && e.target.closest(sel)) ring.classList.remove('is-hover'); });
  }
  function initMagnetic() {
    if (prefersReduced || isTouch) return;
    $$('.nav__cta, .lnk--fill').forEach((el) => {
      const s = 0.3;
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * s}px, ${(e.clientY - (r.top + r.height / 2)) * s}px)`; });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------------- FORM ---------------- */
  function initForm() {
    const form = $('#contactForm'); if (!form) return;
    const status = $('#formStatus');
    const setErr = (f, m) => { const w = f.closest('.field') || f.parentElement; w.classList.toggle('has-error', !!m); const e = $('[data-err]', w); if (e) e.textContent = m || ''; };
    const V = {
      'f-name': (v) => v.trim().length >= 2 || 'Indiquez votre nom.',
      'f-email': (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Adresse email invalide.',
      'f-type': (v) => !!v || 'Choisissez un type de projet.',
      'f-message': (v) => v.trim().length >= 10 || 'Quelques mots de plus ?',
    };
    Object.keys(V).forEach((id) => { const el = $('#' + id); if (!el) return;
      el.addEventListener('blur', () => { const r = V[id](el.value); setErr(el, r === true ? '' : r); });
      el.addEventListener('input', () => { const w = el.closest('.field') || el.parentElement; if (w.classList.contains('has-error')) { const r = V[id](el.value); setErr(el, r === true ? '' : r); } });
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); if (form._honey && form._honey.value) return;
      let ok = true, first = null;
      Object.keys(V).forEach((id) => { const el = $('#' + id); const r = V[id](el.value); if (r !== true) { ok = false; setErr(el, r); if (!first) first = el; } else setErr(el, ''); });
      if (!ok) { first?.focus(); status.textContent = 'Merci de corriger les champs indiqués.'; status.className = 'form__status err'; return; }
      status.textContent = 'Envoi en cours…'; status.className = 'form__status';
      const btn = $('button[type="submit"]', form); if (btn) btn.disabled = true;
      try {
        const res = await fetch(form.dataset.endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
        if (!res.ok) throw new Error('bad');
        form.reset(); status.textContent = 'Message envoyé — je vous réponds sous 24 h. Merci !'; status.className = 'form__status ok';
      } catch (err) {
        status.innerHTML = `Une erreur est survenue. Écrivez-moi sur <a href="${form.dataset.whatsapp}" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:underline">WhatsApp</a> ou à contact@uploaded.be.`;
        status.className = 'form__status err';
      } finally { if (btn) btn.disabled = false; }
    });
  }

  function initYear() { $$('.js-year').forEach((el) => el.textContent = new Date().getFullYear()); }

  /* ---------------- BOOT ---------------- */
  function boot() {
    initYear();
    initScroll();
    buildServices();
    buildWork();
    buildSteps();
    buildValues();
    buildFacts();
    initNav();
    initModal();
    initForm();
    initReveal();
    heroIntro();
    initCursor();
    initMagnetic();
    if (hasGSAP) requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  preloader().then(boot);
})();
