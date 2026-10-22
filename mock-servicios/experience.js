(() => {
  const motion = window.ASESPRO_MOTION;
  const header=document.querySelector('.site-header');
  const compact=()=>header?.classList.toggle('is-compact',scrollY>80);
  addEventListener('scroll',compact,{passive:true});compact();
  if(window.gsap && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    if(document.querySelector('.home-hero')){
      const heroLines=document.querySelectorAll('.home-hero h1 span,.home-hero h1 em');gsap.fromTo(heroLines,{yPercent:110,opacity:0},{yPercent:0,opacity:1,duration:motion.enter,stagger:.12,ease:motion.ease});
      gsap.fromTo('.hero-image img',{scale:1.16,yPercent:-6},{scale:1.16,yPercent:6,ease:'none',scrollTrigger:{trigger:'.home-hero',start:'top top',end:'bottom top',scrub:true}});
    }
    const logoBand=document.querySelector('.logo-band');
    if(logoBand){
      const logoLines=logoBand.querySelectorAll('.logo-line');
      const logoStrip=logoBand.querySelector('.logo-strip');
      const logoTrigger={trigger:logoBand,start:'top 80%',once:true};
      gsap.fromTo(logoLines,{yPercent:105,opacity:0},{yPercent:0,opacity:1,duration:motion.enter,stagger:.1,ease:motion.ease,scrollTrigger:logoTrigger});
      if(logoStrip) gsap.fromTo(logoStrip,{y:18,opacity:0},{y:0,opacity:1,duration:motion.enter,delay:.18,ease:motion.ease,scrollTrigger:logoTrigger});
    }
    const brandIntro=document.querySelector('.brand-intro');
    if(brandIntro){
      const brandTrigger={trigger:brandIntro,start:'top 80%',once:true};
      gsap.fromTo(brandIntro.querySelectorAll('.section-title > .brand-intro-line'),{y:22,opacity:0},{y:0,opacity:1,duration:motion.enter,stagger:.08,ease:motion.ease,overwrite:'auto',scrollTrigger:brandTrigger});
    }
  }
  const brandWordRotate = document.querySelector('[data-brand-word-rotate]');
  if (brandWordRotate) {
    const brandViewport = brandWordRotate;
    const brandCurrent = brandViewport.querySelector('[data-brand-word-current]');
    const brandCover = brandViewport.querySelector('[data-brand-word-cover]');
    const brandMeasure = brandViewport.querySelector('[data-brand-word-measurer]');
    const brandWords = ['MANTENEMOS', 'ORGANIZAMOS', 'ORDENAMOS', 'LIMPIAMOS'];
    const brandBase = motion.base * 1000;
    const brandReveal = motion.fast * 1000;
    const brandEase = getComputedStyle(document.documentElement).getPropertyValue('--motion-ease').trim();
    let brandWordIndex = 0;
    let brandAnimation = null;
    let brandTimer = 0;
    const syncBrandWidth = (initial = false) => {
      if (!brandCurrent || !brandMeasure) return;
      const measureWord = (word) => {
        brandMeasure.textContent = word;
        return brandMeasure.getBoundingClientRect().width;
      };
      const width = Math.max(...brandWords.map(measureWord));
      brandMeasure.textContent = brandCurrent.textContent;
      if (initial) brandViewport.style.transition = 'none';
      brandViewport.style.width = `${width}px`;
      if (initial) {
        brandViewport.offsetHeight;
        brandViewport.style.removeProperty('transition');
      }
    };
    const animateBrandCover = (from, to, duration) => {
      if (!brandCover || typeof brandCover.animate !== 'function') {
        if (brandCover) brandCover.style.transform = to;
        return Promise.resolve();
      }
      const animation = brandCover.animate(
        [{transform: from}, {transform: to}],
        {duration, easing: brandEase, fill: 'forwards'}
      );
      brandAnimation = animation;
      return animation.finished.catch(() => {}).then(() => {
        animation.cancel();
        brandCover.style.transform = to;
        if (brandAnimation === animation) brandAnimation = null;
      });
    };
    const rotateBrandWord = async () => {
      if (!brandCurrent || !brandCover) return;
      const nextIndex = (brandWordIndex + 1) % brandWords.length;
      await animateBrandCover('translateX(-100%)', 'translateX(0)', brandReveal);
      brandWordIndex = nextIndex;
      brandCurrent.textContent = brandWords[brandWordIndex];
      syncBrandWidth();
      await animateBrandCover('translateX(0)', 'translateX(100%)', brandBase);
      brandCover.style.transform = 'translateX(-100%)';
      brandTimer = window.setTimeout(rotateBrandWord, 3000);
    };
    syncBrandWidth(true);
    const scheduleBrandWidth = () => syncBrandWidth();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleBrandWidth);
    window.addEventListener('resize', scheduleBrandWidth, {passive: true});
    brandTimer = window.setTimeout(rotateBrandWord, 3000);
  }  const experienceCount = document.querySelector('.brand-intro-experience-count');
  const experienceMark = document.querySelector('.brand-intro-experience');
  if (experienceCount && experienceMark) {
    const finishExperienceCount = () => { experienceCount.textContent = '15'; };
    const animateExperienceCount = () => {
      const duration = motion.enter * 2000;
      const start = performance.now();
      experienceCount.textContent = '0';
      const frame = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        experienceCount.textContent = String(Math.round(eased * 15));
        if (progress < 1) requestAnimationFrame(frame);
        else finishExperienceCount();
      };
      requestAnimationFrame(frame);
    };
    if ('IntersectionObserver' in window) {
      const experienceObserver = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        experienceObserver.disconnect();
        animateExperienceCount();
      }, {threshold: .35});
      experienceObserver.observe(experienceMark);
    } else {
      finishExperienceCount();
    }
  }
  const googleReviewSlider = document.querySelector('[data-google-review-slider]');
  if (googleReviewSlider) {
    const slides = [...googleReviewSlider.querySelectorAll('[data-google-review]')];
    const dots = [...googleReviewSlider.querySelectorAll('[data-google-review-dot]')];
    let current = 0;
    let timer = null;
    let inView = false;
    let hovered = false;
    let focused = false;
    const stop = () => { if (timer) window.clearInterval(timer); timer = null; };
    const show = (next) => {
      current = (next + slides.length) % slides.length;
      slides.forEach((slide, index) => {
        slide.hidden = index !== current;
        slide.classList.toggle('is-active', index === current);
      });
      dots.forEach((dot, index) => {
        dot.classList.toggle('is-active', index === current);
        dot.setAttribute('aria-pressed', String(index === current));
      });
    };
    const start = () => {
      stop();
      if (slides.length > 1 && inView && !hovered && !focused && !document.hidden) {
        timer = window.setInterval(() => show(current + 1), 5500);
      }
    };
    googleReviewSlider.querySelector('[data-google-review-prev]')?.addEventListener('click', () => { show(current - 1); start(); });
    googleReviewSlider.querySelector('[data-google-review-next]')?.addEventListener('click', () => { show(current + 1); start(); });
    dots.forEach((dot, index) => dot.addEventListener('click', () => { show(index); start(); }));
    googleReviewSlider.addEventListener('pointerenter', () => { hovered = true; stop(); });
    googleReviewSlider.addEventListener('pointerleave', () => { hovered = false; start(); });
    googleReviewSlider.addEventListener('focusin', () => { focused = true; stop(); });
    googleReviewSlider.addEventListener('focusout', (event) => {
      if (googleReviewSlider.contains(event.relatedTarget)) return;
      focused = false;
      start();
    });
    document.addEventListener('visibilitychange', start);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        start();
      }, {threshold: .25});
      observer.observe(googleReviewSlider);
    } else { inView = true; start(); }
  }
  const form=document.querySelector('.consultation-form');
  if(form){
    const update=()=>{const data=new FormData(form),service=data.get('service'),city=data.get('city'),message=String(data.get('message')||'').trim();document.querySelector('[data-summary-service]').textContent=service||'Elegí tu espacio';document.querySelector('[data-summary-city]').textContent=city||'Elegí tu ciudad';document.querySelector('.consultation-summary').style.setProperty('--completion',`${([service,city,message].filter(Boolean).length/3)*100}%`);};
    const params=new URLSearchParams(location.search);
    for(const key of ['service','city']){const value=params.get(key);if(value){const input=[...form.querySelectorAll(`input[name="${key}"]`)].find(i=>i.value===value);if(input)input.checked=true;}}
    form.addEventListener('input',update);form.addEventListener('change',update);update();
    form.dispatchEvent(new Event('change',{bubbles:true}));
  }
})();
