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
  }
  const brandWordRotate = document.querySelector('[data-brand-word-rotate]');
  if (brandWordRotate) {
    const brandViewport = brandWordRotate;
    const brandCurrent = brandViewport.querySelector('[data-brand-word-current]');
    const brandCover = brandViewport.querySelector('[data-brand-word-cover]');
    const brandMeasure = brandViewport.querySelector('[data-brand-word-measurer]');
    const brandWords = ['MANTENEMOS', 'ORGANIZAMOS', 'ORDENAMOS', 'LIMPIAMOS'];
    const brandSection = brandViewport.closest('.brand-intro');
    const brandModules = [...brandSection.querySelectorAll('[data-brand-module]')];
    const brandExperience = brandSection.querySelector('.brand-intro-experience');
    const brandExperienceCount = brandExperience?.querySelector('.brand-intro-experience-count');
    const brandReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const brandEase = getComputedStyle(document.documentElement).getPropertyValue('--motion-ease').trim();
    let brandWordIndex = 0;
    let brandTimer = 0;
    let brandInView = false;
    let brandEntered = false;
    let brandExperienceInView = false;
    let brandCountFrame = 0;
    let brandCountElapsed = 0;
    let brandCountPrevious = null;
    let brandCountComplete = false;
    if (brandExperienceCount) brandExperienceCount.textContent = '1';
    const advanceBrandCount = (timestamp) => {
      brandCountFrame = 0;
      if (!brandExperienceInView || document.hidden || brandCountComplete) return;
      if (brandCountPrevious !== null) brandCountElapsed += timestamp - brandCountPrevious;
      brandCountPrevious = timestamp;
      const progress = Math.min(1, brandCountElapsed / (motion.enter * 2000));
      if (brandExperienceCount) brandExperienceCount.textContent = String(1 + Math.floor(progress * 14));
      brandCountComplete = progress === 1;
      if (!brandCountComplete) brandCountFrame = requestAnimationFrame(advanceBrandCount);
    };
    const syncBrandExperienceMotion = () => {
      const visible = brandExperienceInView && !document.hidden;
      if (visible && !brandCountComplete && !brandCountFrame) {
        brandCountPrevious = null;
        brandCountFrame = requestAnimationFrame(advanceBrandCount);
      } else if (!visible) {
        cancelAnimationFrame(brandCountFrame);
        brandCountFrame = 0;
        brandCountPrevious = null;
      }
    };
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
    const scheduleBrandWord = () => {
      window.clearTimeout(brandTimer);
      if (brandInView && !document.hidden) brandTimer = window.setTimeout(rotateBrandWord, 3500);
    };
    const assembleBrand = () => {
      if (brandEntered || typeof brandExperience?.animate !== 'function') return;
      brandEntered = true;
      const offsets = ['translate(18%, -18%)', 'translate(-18%, -18%)', 'scale(.96)', 'scale(.96)', 'translate(-18%, 18%)', 'translate(18%, 18%)'];
      brandModules.forEach((module, index) => module.animate(
        brandReducedMotion.matches ? [{opacity:.55}, {opacity:1}] : [{transform:offsets[index], opacity:.35}, {transform:'translate(0, 0) scale(1)', opacity:1}],
        {duration: (brandReducedMotion.matches ? motion.fast : motion.enter) * 1000, delay: brandReducedMotion.matches ? 0 : index * 60, easing:brandEase}
      ));
      brandExperience.animate(
        brandReducedMotion.matches ? [{opacity:.65}, {opacity:1}] : [{transform:'translateY(10%) scale(.96)', opacity:.65}, {transform:'translateY(0) scale(1)', opacity:1}],
        {duration:(brandReducedMotion.matches ? motion.fast : motion.enter) * 1000, delay:brandReducedMotion.matches ? 0 : 120, easing:brandEase}
      );
    };
    const rotateBrandWord = async () => {
      if (!brandCurrent || !brandCover || !brandInView || document.hidden) return;
      const nextIndex = (brandWordIndex + 1) % brandWords.length;
      brandCover.textContent = brandWords[nextIndex];
      if (typeof brandCurrent.animate === 'function') {
        const duration = (brandReducedMotion.matches ? motion.fast : motion.layout) * 1000;
        const outgoing = brandCurrent.animate(
          brandReducedMotion.matches ? [{opacity:1}, {opacity:0}] : [{transform:'translateY(0)', opacity:1}, {transform:'translateY(-110%)', opacity:0}],
          {duration, easing:brandEase, fill:'forwards'}
        );
        const incoming = brandCover.animate(
          brandReducedMotion.matches ? [{transform:'translateY(0)', opacity:0}, {transform:'translateY(0)', opacity:1}] : [{transform:'translateY(110%)', opacity:0}, {transform:'translateY(0)', opacity:1}],
          {duration, easing:brandEase, fill:'forwards'}
        );
        const module = brandModules[[0,1,4,5][nextIndex]];
        const offsets = ['translate(0, 0)', 'translate(-10%, -10%)', 'translate(-10%, 10%)', 'translate(10%, 10%)'];
        module?.animate(
          brandReducedMotion.matches ? [{opacity:.6}, {opacity:1}] : [{transform:'translate(0, 0)'}, {transform:nextIndex === 0 ? 'translate(10%, -10%)' : offsets[nextIndex], offset:.4}, {transform:'translate(0, 0)'}],
          {duration: (brandReducedMotion.matches ? motion.fast : motion.enter) * 1000, easing:brandEase}
        );
        await Promise.all([outgoing.finished.catch(() => {}), incoming.finished.catch(() => {})]);
        brandCurrent.textContent = brandWords[nextIndex];
        outgoing.cancel();
        incoming.cancel();
      } else {
        brandCurrent.textContent = brandWords[nextIndex];
      }
      brandWordIndex = nextIndex;
      brandCover.textContent = '';
      scheduleBrandWord();
    };
    syncBrandWidth(true);
    const scheduleBrandWidth = () => syncBrandWidth();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleBrandWidth);
    window.addEventListener('resize', scheduleBrandWidth, {passive: true});
    if ('IntersectionObserver' in window) {
      const brandObserver = new IntersectionObserver(([entry]) => {
        brandInView = entry.isIntersecting;
        if (brandInView) assembleBrand();
        scheduleBrandWord();
      }, {threshold:.15});
      brandObserver.observe(brandSection);
      if (brandExperience) {
        const experienceObserver = new IntersectionObserver(([entry]) => {
          brandExperienceInView = entry.isIntersecting && entry.intersectionRatio >= .35;
          syncBrandExperienceMotion();
        }, {threshold:[0,.35]});
        experienceObserver.observe(brandExperience);
      }
    } else {
      brandInView = true;
      brandExperienceInView = true;
      assembleBrand();
      scheduleBrandWord();
      syncBrandExperienceMotion();
    }
    document.addEventListener('visibilitychange', scheduleBrandWord);
    document.addEventListener('visibilitychange', syncBrandExperienceMotion);
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
