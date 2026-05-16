const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

// Navbar
(() => {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');

  if (!toggle || !menu) return;

  function setMenuState(isOpen) {
    menu.classList.toggle('open', isOpen);
    toggle.classList.toggle('active', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
  }

  toggle.addEventListener('click', () => setMenuState(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenuState(false)));

  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) setMenuState(false);
  });
})();

// Scrollsnap
(() => {
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  let activeAnimation = null;
  let isProgrammaticScroll = false;
  const nav = document.querySelector('nav');
  const sections = Array.from(document.querySelectorAll("section"));
  const lastSection = sections[sections.length - 1];
  if (!sections.length) return;

  const getNavHeight = () => nav?.offsetHeight || 0;
  const getMaxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  function getTargetScrollTop(target, navHeight, maxScroll) {
    if (typeof target === "number") return target;
    if (target.id === 'hero') return 0;
    if (target === lastSection) return maxScroll;
    return target.getBoundingClientRect().top + window.scrollY - navHeight;
  }

  function smoothScrollTo(target, duration = 750) {
    const navHeight = getNavHeight();
    const start = window.scrollY;
    const maxScroll = getMaxScroll();
    const end = Math.max(0, Math.min(getTargetScrollTop(target, navHeight, maxScroll), maxScroll));
    const distance = end - start;

    if (Math.abs(distance) < 2) return Promise.resolve();
    if (activeAnimation) cancelAnimationFrame(activeAnimation);

    isProgrammaticScroll = true;

    return new Promise((resolve) => {
      let startTime = null;

      function step(ts) {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        window.scrollTo(0, start + distance * easeInOutCubic(progress));

        if (progress < 1) {
          activeAnimation = requestAnimationFrame(step);
        } else {
          activeAnimation = null;
          setTimeout(() => {
            isProgrammaticScroll = false;
            resolve();
          }, 50);
        }
      }
      activeAnimation = requestAnimationFrame(step);
    });
  }

  let snapTimer = null;
  let isSnapping = false;

  function cancelSnap() {
    if (activeAnimation) {
      cancelAnimationFrame(activeAnimation);
      activeAnimation = null;
    }
    isProgrammaticScroll = false;
    isSnapping = false;
    clearTimeout(snapTimer); 
  }

  window.addEventListener("wheel", cancelSnap, { passive: true });
  window.addEventListener("touchstart", cancelSnap, { passive: true });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", async function (e) {
      const href = this.getAttribute("href");
      e.preventDefault();
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (target) await smoothScrollTo(target, 900);
    });
  });

  if (isTouch) return;

  let lastScrollY = window.scrollY;
  let scrollDirection = "down";
  let isPageLoaded = false;
  
  window.addEventListener('load', () => setTimeout(() => { isPageLoaded = true; }, 500));

  window.addEventListener("scroll", () => {
    if (!isPageLoaded) {
      lastScrollY = window.scrollY;
      return;
    }

    if (isSnapping || isProgrammaticScroll) return;

    const dy = window.scrollY - lastScrollY;
    if (dy !== 0) scrollDirection = dy > 0 ? "down" : "up";
    lastScrollY = window.scrollY;

    clearTimeout(snapTimer);
    
    snapTimer = setTimeout(async () => {
      if (isProgrammaticScroll) return;

      const navHeight = getNavHeight();
      const maxScroll = getMaxScroll();
      let target = null;

      if (scrollDirection === "down") {
        target = sections.find((sec) => sec.getBoundingClientRect().top > navHeight + 4);
      } else {
        const above = sections.filter((sec) => sec.getBoundingClientRect().top < navHeight - 4);
        target = above[above.length - 1] ?? sections[0];
      }

      if (!target) return;

      const targetScrollTop = getTargetScrollTop(target, navHeight, maxScroll);
      if (Math.abs(targetScrollTop - window.scrollY) < 5) return;

      isSnapping = true;
      await smoothScrollTo(target, 550);
      isSnapping = false;
    }, 250); 
  }, { passive: true });
})();

// Footer Observer
(() => {
  const footer = document.querySelector("footer");
  const contact = document.querySelector("#contact");

  if (!footer || !contact) return;
  if (!("IntersectionObserver" in window)) {
    footer.classList.add("visible");
    return;
  }

  new IntersectionObserver(([entry]) => {
    footer.classList.toggle("visible", entry.isIntersecting);
  }, { threshold: 1.0 }).observe(contact);
})();

// Scrollbar
(() => {
  const scrollbar = document.querySelector(".scrollbar");
  const thumb = document.querySelector(".scrollbar-thumb");
  if (!scrollbar || !thumb) return;

  let hideTimer;
  let ticking = false;
  let trackHeight = 0;

  function updateTrackHeight() {
    trackHeight = scrollbar.getBoundingClientRect().height;
  }

  function updateThumb() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    if (!trackHeight) updateTrackHeight();

    const thumbHeight = Math.max((viewportHeight / docHeight) * trackHeight, 40);
    const maxScroll = docHeight - viewportHeight;
    const maxThumbTravel = trackHeight - thumbHeight;
    const thumbTop = maxScroll > 0 ? (scrollTop / maxScroll) * maxThumbTravel : 0;

    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${thumbTop}px)`;
  }

  function showScrollbar() {
    scrollbar.classList.add("visible");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => scrollbar.classList.remove("visible"), 700);
  }

  window.addEventListener("scroll", () => {
    showScrollbar();
    if (!ticking) {
      requestAnimationFrame(() => {
        updateThumb();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener("resize", () => {
    updateTrackHeight();
    updateThumb();
  });

  updateTrackHeight();
  updateThumb();
})();

// Grain Overlay
(() => {
  const grain = document.createElement('div');
  grain.className = 'grain-overlay';
  document.body.appendChild(grain);

  let scrollPauseTimer;
  window.addEventListener('scroll', () => {
    document.body.classList.add('is-scrolling');
    clearTimeout(scrollPauseTimer);
    scrollPauseTimer = setTimeout(() => document.body.classList.remove('is-scrolling'), 150);
  }, { passive: true });
})();

// Cursor Glow & Desktop Hover Effects
(() => {
  if (isTouch) return;

  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let curX = mouseX, curY = mouseY;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  (function loop() {
    curX += (mouseX - curX) * 0.07;
    curY += (mouseY - curY) * 0.07;
    glow.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  })();

  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.16}px, ${y * 0.16 - 2}px)`;
    });
    btn.addEventListener('mouseleave', () => btn.style.transform = '');
  });

  const MAX_DEG = 8, LERP_IN = 0.10, LERP_OUT = 0.07;

  document.querySelectorAll('.project-card').forEach(card => {
    let targetX = 0, targetY = 0, curX = 0, curY = 0;
    let hovering = false, rafId = null;

    function tick() {
      const speed = hovering ? LERP_IN : LERP_OUT;
      curX += (targetX - curX) * speed;
      curY += (targetY - curY) * speed;

      if (Math.abs(curX) > 0.01 || Math.abs(curY) > 0.01 || hovering) {
        card.style.transition = 'border-color 0.25s, box-shadow 0.25s';
        card.style.transform = `perspective(700px) rotateX(${curX}deg) rotateY(${curY}deg) translateZ(${hovering ? 6 : 0}px)`;
        rafId = requestAnimationFrame(tick);
      } else {
        card.style.transition = '';
        card.style.transform = '';
        rafId = null;
      }
    }

    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      targetX = -ny * MAX_DEG; 
      targetY = nx * MAX_DEG; 
      hovering = true;
      if (!rafId) rafId = requestAnimationFrame(tick);
    });

    card.addEventListener('mouseleave', () => {
      hovering = false;
      targetX = 0;
      targetY = 0;
      if (!rafId) rafId = requestAnimationFrame(tick);
    });
  });
})();

// Image Preloader
(() => {
  const aboutImg = document.querySelector('#about img');
  if (!aboutImg || !aboutImg.src) return;
  const preloader = new Image();
  preloader.decoding = 'async';
  preloader.src = aboutImg.src;
  preloader.decode().catch(() => {});
})();

// Scroll Reveal
(() => {
  const simpleReveal = [
    '#about img', '.about-text h2', '.about-text p',
    '#skills h2', '#projects h2', '#contact h2', 
    '.contact-sub', '.socials',
  ];

  simpleReveal.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.classList.add(sel === '#about img' ? 'reveal-left' : 'reveal'));
  });

  ['.skill-card', '.project-card'].forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 0.09}s`;
    });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.style.willChange = 'opacity, transform';
      entry.target.classList.add('visible');
      entry.target.addEventListener('transitionend', () => {
        entry.target.style.willChange = 'auto';
        entry.target.style.transitionDelay = '';
      }, { once: true });
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.20, rootMargin: '0px 0px -48px 0px' });

  document.querySelectorAll('.reveal, .reveal-left').forEach(el => observer.observe(el));
})();

// Skills Ticker Duplication
(() => {
  const inner = document.querySelector('.hero-ticker-inner');
  if (!inner) return;

  if (!inner.dataset.tickerBase) {
    inner.dataset.tickerBase = inner.innerHTML;
  }

  let resizeTimer;

  function setupTicker() {
    const base = inner.dataset.tickerBase;
    if (!base) return;

    inner.innerHTML = base;
    const gap = parseFloat(window.getComputedStyle(inner).gap) || 18;
    const singleW = inner.scrollWidth + gap;
    if (!singleW) return;

    const copies = Math.ceil((window.innerWidth * 2) / singleW) + 2;
    inner.innerHTML = base.repeat(copies);
    inner.style.setProperty('--ticker-offset', `${singleW}px`);
  }

  function scheduleSetup() {
    requestAnimationFrame(setupTicker);
  }

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(scheduleSetup, 150);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleSetup).catch(() => {});
  } else {
    window.addEventListener('load', scheduleSetup, { once: true });
  }

  setupTicker();
})();

// Skills Carousel
(() => {
  const carousel = document.querySelector('.skills-carousel');
  const track = carousel?.querySelector('.skills-track');
  if (!carousel || !track) return;

  const MIN_COPIES = 2;
  const VIEWPORT_MULTIPLIER = 2;
  const SCROLL_SPEED_PX_PER_SEC = 28;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!track.dataset.carouselBase) track.dataset.carouselBase = track.innerHTML;

  let baseWidth = 0;
  let offset = 0;
  let rafId = null;
  let isPaused = false;
  let isDragging = false;
  let startX = 0;
  let startOffset = 0;
  let lastTime = 0;

  function wrapOffset(value) {
    if (!baseWidth) return value;
    if (value <= -baseWidth) return value + baseWidth;
    if (value > 0) return value - baseWidth;
    return value;
  }

  function setOffset(value) {
    offset = wrapOffset(value);
    track.style.transform = `translate3d(${offset}px, 0, 0)`;
  }

  function setupCarousel() {
    const base = track.dataset.carouselBase;
    if (!base) return;

    track.innerHTML = base;
    baseWidth = track.scrollWidth;
    if (!baseWidth) return;

    const visibleWidth = carousel.offsetWidth;
    const copies = Math.max(MIN_COPIES, Math.ceil((visibleWidth * VIEWPORT_MULTIPLIER) / baseWidth));
    track.innerHTML = base.repeat(copies);
    setOffset(offset);
  }

  function tick(time) {
    if (!lastTime) lastTime = time;
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    if (!prefersReducedMotion.matches && !isPaused && !isDragging && baseWidth) {
      setOffset(offset - delta * SCROLL_SPEED_PX_PER_SEC);
    }

    rafId = requestAnimationFrame(tick);
  }

  function stopTick() {
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  function startTick() {
    if (rafId) return;
    lastTime = 0;
    rafId = requestAnimationFrame(tick);
  }

  function handlePointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    isDragging = true;
    startX = e.clientX;
    startOffset = offset;
    carousel.classList.add('is-dragging');
    carousel.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    setOffset(startOffset + dx);
  }

  function handlePointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    carousel.classList.remove('is-dragging');
    if (carousel.hasPointerCapture(e.pointerId)) {
      carousel.releasePointerCapture(e.pointerId);
    }
  }

  if (!isTouch) {
    carousel.addEventListener('mouseenter', () => { isPaused = true; });
    carousel.addEventListener('mouseleave', () => { isPaused = false; });
  }

  carousel.addEventListener('pointerdown', handlePointerDown);
  carousel.addEventListener('pointermove', handlePointerMove);
  carousel.addEventListener('pointerup', handlePointerUp);
  carousel.addEventListener('pointercancel', handlePointerUp);
  carousel.addEventListener('pointerleave', handlePointerUp);

  window.addEventListener('resize', () => {
    stopTick();
    setupCarousel();
    startTick();
  });

  prefersReducedMotion.addEventListener('change', () => {
    lastTime = 0;
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(setupCarousel).catch(() => {});
  } else {
    window.addEventListener('load', setupCarousel, { once: true });
  }

  setupCarousel();
  startTick();
})();

// Active Nav Link Tracker
(() => {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const links = Array.from(document.querySelectorAll('nav a[href^="#"]'));
  const nav = document.querySelector('nav');

  if (!sections.length || !links.length) return;

  function setActive(id) {
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
    if (nav) nav.classList.toggle('at-hero', id === 'hero');
  }

  let ticking = false;

  function updateActive() {
    ticking = false;
    const bandTop = window.innerHeight * 0.35;
    const bandBottom = window.innerHeight * 0.55;

    let bestId = null;
    let bestDistance = Infinity;
    let fallbackId = sections[0].id;

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= bandTop) fallbackId = section.id;

      if (rect.bottom < bandTop || rect.top > bandBottom) return;
      const distance = Math.abs(rect.top - bandTop);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestId = section.id;
      }
    });

    setActive(bestId || fallbackId);
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateActive);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  requestUpdate();
})();
