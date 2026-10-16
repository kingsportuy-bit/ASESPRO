(() => {
  document.documentElement.classList.add('components-ready');

  const servicePanels = [...document.querySelectorAll('[data-service-panel]')];
  if (servicePanels.length) {
    const setService = (id, writeHash = true) => {
      servicePanels.forEach((panel) => {
        const active = panel.dataset.servicePanel === id;
        panel.classList.toggle('service-option--active', active);
        panel.querySelector('.service-option-trigger')?.setAttribute('aria-expanded', String(active));
      });
      if (writeHash && id) history.replaceState(null, '', `#${id}`);
    };
    const requested = location.hash.slice(1);
    setService(servicePanels.some((panel) => panel.dataset.servicePanel === requested) ? requested : servicePanels[0].dataset.servicePanel, false);
    servicePanels.forEach((panel) => panel.querySelector('.service-option-trigger')?.addEventListener('click', () => setService(panel.dataset.servicePanel)));
    addEventListener('hashchange', () => { const id = location.hash.slice(1); if (servicePanels.some((panel) => panel.dataset.servicePanel === id)) setService(id, false); });
  }

  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const images = [...document.querySelectorAll('[data-chapter-image]')];
  const caption = document.querySelector('[data-chapter-caption]');
  const captions = { mision: 'Escuchar antes de coordinar.', vision: 'Acompañar con claridad y cercanía.', valores: 'Revisar cada detalle antes de terminar.' };
  if (chapters.length && images.length) {
    let activeIndex = 0;
    const activate = (id) => {
      images.forEach((image) => image.classList.toggle('is-active', image.dataset.chapterImage === id));
      if (caption && captions[id]) caption.textContent = captions[id];
      chapters.forEach((chapter) => chapter.classList.toggle('is-active', chapter.dataset.chapter === id));
      activeIndex = Math.max(0, images.findIndex((image) => image.dataset.chapterImage === id));
    };
    const moveSlide = (offset) => activate(images[(activeIndex + offset + images.length) % images.length].dataset.chapterImage);
    const mobileSlides = matchMedia('(max-width: 900px)');
    let autoplay = null;
    const syncAutoplay = () => {
      clearInterval(autoplay);
      autoplay = null;
      if (mobileSlides.matches && document.visibilityState === 'visible') autoplay = setInterval(() => moveSlide(1), 4500);
    };
    let touchStartX = null;
    const media = document.querySelector('.principles-story-media');
    media?.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch') {
        touchStartX = event.clientX;
        clearInterval(autoplay);
        autoplay = null;
      }
    }, { passive: true });
    media?.addEventListener('pointerup', (event) => {
      if (touchStartX !== null) {
        const delta = event.clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(delta) > 44) moveSlide(delta < 0 ? 1 : -1);
        syncAutoplay();
      }
    }, { passive: true });
    media?.addEventListener('pointercancel', () => { touchStartX = null; syncAutoplay(); }, { passive: true });
    mobileSlides.addEventListener('change', syncAutoplay);
    document.addEventListener('visibilitychange', syncAutoplay);
    const observer = 'IntersectionObserver' in window && matchMedia('(min-width: 901px)').matches ? new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) activate(visible.target.dataset.chapter);
    }, { rootMargin: '-28% 0px -45% 0px', threshold: [0.25, 0.55, 0.8] }) : null;
    chapters.forEach((chapter) => observer?.observe(chapter));
    activate(chapters[0].dataset.chapter);
    syncAutoplay();
  }

  const previewCards = [...document.querySelectorAll('[data-preview-service]')];
  if (previewCards.length) {
    const activatePreview = (card) => previewCards.forEach((item) => item.classList.toggle('is-active', item === card));
    const first = previewCards.find((card) => card.classList.contains('is-active')) || previewCards[0];
    activatePreview(first);
    previewCards.forEach((card) => { card.addEventListener('mouseenter', () => activatePreview(card)); card.addEventListener('focusin', () => activatePreview(card)); });
  }

  document.querySelectorAll('[data-gallery-open]').forEach((button) => button.setAttribute('aria-haspopup', 'dialog'));
})();
