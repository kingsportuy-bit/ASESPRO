(() => {
  'use strict';
  const root = document.documentElement;
  const rootStyle = getComputedStyle(root);
  const tokenMs = (name, fallback) => { const value = parseFloat(rootStyle.getPropertyValue(name)); return Number.isFinite(value) ? value : fallback; };
  const motion = { ease: rootStyle.getPropertyValue('--motion-gsap-ease').trim() || 'power3.out', fast: tokenMs('--motion-fast', 180) / 1000, base: tokenMs('--motion-base', 260) / 1000, layout: tokenMs('--motion-layout', 500) / 1000, enter: tokenMs('--motion-enter', 680) / 1000 };
  window.ASESPRO_MOTION = motion;
  root.classList.add('js');
  const page = document.body.dataset.page || '';
  document.querySelectorAll('[data-nav]').forEach((link) => { if (link.dataset.nav === page) link.setAttribute('aria-current', 'page'); });

  const menuToggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#site-menu');
  const menuOverlay = document.querySelector('.menu-overlay');
  const menuClose = document.querySelector('.mobile-menu-close');
  if (menuToggle && menu) {
    const closeMenu = () => {
      menu.classList.remove('is-open');
      menuOverlay?.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menú');
    };
    const openMenu = () => {
      menu.classList.add('is-open');
      menuOverlay?.classList.add('is-open');
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Cerrar menú');
    };
    menuToggle.addEventListener('click', () => menu.classList.contains('is-open') ? closeMenu() : openMenu());
    menuClose?.addEventListener('click', closeMenu);
    menuOverlay?.addEventListener('click', closeMenu);
    document.addEventListener('click', (event) => {
      if (menu.classList.contains('is-open') && !menu.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
    });
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  }

  const processGrid = document.querySelector('.process-grid');
  if (processGrid && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    processGrid.querySelectorAll('li').forEach((step, index) => {
      step.addEventListener('pointerenter', () => { processGrid.dataset.progress = String(index + 1); }, { passive: true });
      step.addEventListener('pointerleave', (event) => { if (!event.relatedTarget || !event.relatedTarget.closest?.('.process-grid li')) processGrid.dataset.progress = '0'; }, { passive: true });
    });
  }

  // Pins and the city list are two views of the same selection.
  const cityNames = new Set(['Montevideo', 'Punta del Este', 'Durazno', 'Paso de los Toros', 'Mercedes']);
  const updateCity = (city) => {
    if (!cityNames.has(city)) return;
    document.querySelectorAll('.map-point[data-city], .city-list-item[data-city]').forEach((item) => {
      const active = item.dataset.city === city;
      item.setAttribute('aria-pressed', String(active));
      item.classList.toggle('is-active', active);
    });
  };
  document.querySelectorAll('.map-point[data-city], .city-list-item[data-city]').forEach((item) => item.addEventListener('click', () => updateCity(item.dataset.city)));
  const initialCity = document.querySelector('.map-point[aria-pressed="true"]')?.dataset.city || document.querySelector('.city-list-item[aria-pressed="true"]')?.dataset.city;
  if (initialCity) updateCity(initialCity);

  // Principles stay readable without JS and become a keyboard-friendly single selection with JS.
  const principleTabs = [...document.querySelectorAll('.principle-tab')];
  const principlePanels = [...document.querySelectorAll('.principle-panel')];
  if (principleTabs.length && principlePanels.length) {
    const setPrinciple = (key) => {
      principleTabs.forEach((tab) => { const active = tab.dataset.principle === key; tab.setAttribute('aria-selected', String(active)); tab.classList.toggle('is-active', active); });
      principlePanels.forEach((panel) => { const active = panel.dataset.principlePanel === key; panel.hidden = !active; panel.toggleAttribute('inert', !active); });
    };
    principleTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => setPrinciple(tab.dataset.principle));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? principleTabs.length - 1 : (index + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + principleTabs.length) % principleTabs.length;
        principleTabs[next].focus(); setPrinciple(principleTabs[next].dataset.principle);
      });
    });
    setPrinciple((principleTabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || principleTabs[0]).dataset.principle);
  }

  const galleryDialog = document.querySelector('[data-gallery-dialog]');
  if (galleryDialog) {
    const galleryImage = galleryDialog.querySelector('[data-gallery-image]');
    const galleryTitle = galleryDialog.querySelector('[data-gallery-title]');
    const galleryCopy = galleryDialog.querySelector('[data-gallery-copy]');
    const galleryItems = {
      directivas: { src: 'assets/team/team-directivas.jpg', alt: 'Equipo ASESPRO reunido', title: 'Trabajo compartido.', copy: 'Escuchar, coordinar y cuidar cada detalle.' },
      supervision: { src: 'assets/team/team-supervision-reunion.jpg', alt: 'Equipo ASESPRO en reunión', title: 'Coordinación cercana.', copy: 'La supervisión acompaña cada servicio.' },
      playa: { src: 'assets/team/team-playa.jpg', alt: 'Equipo ASESPRO en una jornada compartida', title: 'Cercanía.', copy: 'Una forma compartida de hacer el trabajo.' }
    };
    document.querySelectorAll('[data-gallery-open]').forEach((button) => button.addEventListener('click', () => {
      const item = galleryItems[button.dataset.galleryOpen];
      if (!item) return;
      if (galleryImage) { galleryImage.src = item.src; galleryImage.alt = item.alt; }
      if (galleryTitle) galleryTitle.textContent = item.title;
      if (galleryCopy) galleryCopy.textContent = item.copy;
      galleryDialog.showModal();
    }));
    galleryDialog.querySelector('[data-gallery-close]')?.addEventListener('click', () => galleryDialog.close());
    galleryDialog.addEventListener('click', (event) => { if (event.target === galleryDialog) galleryDialog.close(); });
  }

  const form = document.querySelector('#contact-form');
  if (form) {
    const params = new URLSearchParams(window.location.search);
    ['service', 'city'].forEach((name) => { const value = params.get(name); if (!value || !form.elements[name]) return; const controls = form.elements[name].length === undefined ? [form.elements[name]] : [...form.elements[name]]; const input = controls.find((item) => item.value === value); if (input) input.checked = true; });
    const submit = form.querySelector('button[type="submit"]');
    const serviceSummary = form.querySelector('[data-summary-service]');
    const citySummary = form.querySelector('[data-summary-city]');
    const buildMessage = () => { const data = new FormData(form); return ['Hola ASESPRO, quiero consultar por ' + (data.get('service') || 'un servicio') + ' en ' + (data.get('city') || 'mi ciudad') + '.', data.get('name') ? 'Soy ' + data.get('name') + '.' : '', String(data.get('message') || '')].filter(Boolean).join(' '); };
    const updateForm = () => { const data = new FormData(form); const valid = Boolean(data.get('service') && data.get('city') && String(data.get('message') || '').trim()); if (serviceSummary) serviceSummary.textContent = String(data.get('service') || 'Elegí tu espacio'); if (citySummary) citySummary.textContent = String(data.get('city') || 'Elegí tu ciudad'); if (submit) submit.disabled = !valid; };
    form.addEventListener('input', updateForm); form.addEventListener('change', updateForm);
    form.addEventListener('submit', (event) => { event.preventDefault(); if (!form.checkValidity()) { form.reportValidity(); return; } const url = 'https://wa.me/59898382388?text=' + encodeURIComponent(buildMessage()); window.open(url, '_blank', 'noopener,noreferrer'); });
    updateForm();
  }

  if (window.gsap) {
    if (!document.querySelector('.home-hero')) window.gsap.fromTo('.page-hero h1', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: motion.enter, ease: motion.ease, overwrite: 'auto' });
    if (window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const selectors = 'body[data-page] .section-intro h2,body[data-page] .service-contact-cta h2,body[data-page] .testimonial-heading h2,body[data-page] .team-teaser-copy h2,body[data-page] .direction-preview h2,body[data-page] .property-bridge-copy h2,body[data-page] .faq-layout h2,body[data-page] .contact-section h2,body[data-page] .video-copy h2,body[data-page] .coverage-map-copy h2';
        window.gsap.utils.toArray(selectors).filter((title) => !title.closest('.brand-intro,.logo-band,.home-hero')).forEach((title) => window.gsap.fromTo(title, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: motion.enter, ease: motion.ease, overwrite: 'auto', scrollTrigger: { trigger: title, start: 'top 88%', once: true } }));
      }
    }
  }
})();
