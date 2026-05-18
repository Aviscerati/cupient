const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveDataEnabled = navigator.connection?.saveData === true;
const REDUCED_EFFECTS_MEMORY_THRESHOLD_GB = 4;
const REDUCED_EFFECTS_CPU_THRESHOLD = 4;
const ANIMATION_VISIBILITY_THRESHOLD = 0.1; // 10% visibility is enough to resume decorative animation work.
const rootStyles = getComputedStyle(document.documentElement);
const deviceMemory = Number(navigator.deviceMemory);
const hardwareConcurrency = Number(navigator.hardwareConcurrency);
const isLowEndDevice = (Number.isFinite(deviceMemory) && deviceMemory > 0 && deviceMemory <= REDUCED_EFFECTS_MEMORY_THRESHOLD_GB)
  || (Number.isFinite(hardwareConcurrency) && hardwareConcurrency > 0 && hardwareConcurrency <= REDUCED_EFFECTS_CPU_THRESHOLD);

// Keep a stable viewport height on mobile to avoid URL-bar scroll resize jumps.
(() => {
  const root = document.documentElement;
  const ORIENTATION_SETTLE_DELAY_MS = 180;
  const HEIGHT_CHANGE_THRESHOLD_PX = 2;
  const getViewportHeight = () => {
    const viewportHeight = window.visualViewport?.height;
    if (Number.isFinite(viewportHeight) && viewportHeight > 0) return viewportHeight;
    return window.innerHeight;
  };
  let lastHeight = 0;
  let touchMaxHeight = 0;
  let rafId = 0;
  let forceOnNextFrame = false;

  function setStableViewportHeight(force = false) {
    const viewportHeight = Math.round(getViewportHeight());
    if (viewportHeight <= 0) return;

    let nextHeight = viewportHeight;
    if (isTouch) {
      if (force || !touchMaxHeight) {
        touchMaxHeight = viewportHeight;
      } else if (viewportHeight > touchMaxHeight) {
        touchMaxHeight = viewportHeight;
      }
      nextHeight = touchMaxHeight;
    }

    if (!force && Math.abs(nextHeight - lastHeight) < HEIGHT_CHANGE_THRESHOLD_PX) return;
    lastHeight = nextHeight;
    root.style.setProperty('--stable-vh', `${nextHeight}px`);
  }

  function scheduleStableViewportHeightUpdate(force = false) {
    forceOnNextFrame = forceOnNextFrame || force;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      const shouldForce = forceOnNextFrame;
      forceOnNextFrame = false;
      rafId = 0;
      setStableViewportHeight(shouldForce);
    });
  }

  scheduleStableViewportHeightUpdate(true);

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      scheduleStableViewportHeightUpdate(true);
    }, ORIENTATION_SETTLE_DELAY_MS);
  }, { passive: true });

  const updateStableVh = () => scheduleStableViewportHeightUpdate();
  window.addEventListener('resize', updateStableVh, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateStableVh, { passive: true });
  }
})();

const getNavHeight = () => {
  const nav = document.querySelector('nav');
  if (nav && nav.offsetHeight) return nav.offsetHeight;
  const cssNavHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
  return Number.isFinite(cssNavHeight) ? cssNavHeight : 54;
};
const lenis = (!isTouch && typeof window.Lenis === 'function')
  ? new window.Lenis({
      autoRaf: true,
      anchors: { offset: -getNavHeight() },
      stopInertiaOnNavigate: true,
    })
  : null;
const hasLenis = Boolean(lenis);

if (!hasLenis && isTouch) {
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const updateSmoothScrollPreference = () => {
    document.documentElement.classList.toggle('smooth-scroll', !reducedMotionQuery.matches);
  };
  updateSmoothScrollPreference();

  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', updateSmoothScrollPreference);
  } else if (typeof reducedMotionQuery.addListener === 'function') {
    reducedMotionQuery.addListener(updateSmoothScrollPreference);
  }
}

function getNativeScrollSnapshot() {
  const scroll = window.scrollY || document.documentElement.scrollTop || 0;
  const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  return { scroll, limit };
}

function subscribeToScroll(handler) {
  if (hasLenis) {
    lenis.on('scroll', handler);
    return () => {
      if (typeof lenis.off === 'function') lenis.off('scroll', handler);
    };
  }

  let ticking = false;
  let nativeLimit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  const updateLimit = () => {
    nativeLimit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  };

  const nativeHandler = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const scroll = window.scrollY || document.documentElement.scrollTop || 0;
      handler({ scroll, limit: nativeLimit });
    });
  };

  window.addEventListener('resize', updateLimit);
  window.addEventListener('scroll', nativeHandler, { passive: true });
  return () => {
    window.removeEventListener('resize', updateLimit);
    window.removeEventListener('scroll', nativeHandler);
  };
}

// Navbar
(() => {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  const nav = document.querySelector('nav');
  const toggleLabel = toggle?.querySelector('.nav-toggle-label');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!toggle || !menu) return;

  function animateToggleLabel() {
    if (!toggleLabel || prefersReducedMotion.matches) return;
    toggleLabel.classList.remove('is-animating');
    void toggleLabel.offsetWidth;
    toggleLabel.classList.add('is-animating');
    const handleAnimationEnd = () => toggleLabel.classList.remove('is-animating');
    toggleLabel.addEventListener('animationend', handleAnimationEnd, { once: true });
  }

  function updateToggleLabel(isOpen) {
    if (!toggleLabel) return;
    const nextLabel = isOpen ? 'Close' : 'Menu';
    if (toggleLabel.textContent === nextLabel) return;

    if (prefersReducedMotion.matches) {
      toggleLabel.textContent = nextLabel;
      toggle.style.width = '';
      return;
    }

    const startWidth = toggle.getBoundingClientRect().width;
    toggleLabel.textContent = nextLabel;
    const endWidth = toggle.getBoundingClientRect().width;
    animateToggleLabel();

    if (Math.abs(endWidth - startWidth) < 1) return;

    toggle.style.width = `${startWidth}px`;
    requestAnimationFrame(() => {
      toggle.style.width = `${endWidth}px`;
    });

    const handleTransitionEnd = event => {
      if (event.propertyName !== 'width') return;
      toggle.style.width = '';
      toggle.removeEventListener('transitionend', handleTransitionEnd);
    };
    toggle.addEventListener('transitionend', handleTransitionEnd);
  }

  function setMenuState(isOpen) {
    menu.classList.toggle('open', isOpen);
    toggle.classList.toggle('active', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    menu.setAttribute('aria-hidden', String(!isOpen));
    document.body.classList.toggle('nav-open', isOpen);
    if (nav) nav.classList.toggle('menu-open', isOpen);
    updateToggleLabel(isOpen);
  }

  function shouldHandleEscapeKey() {
    if (!menu.classList.contains('open')) return false;
    const activeElement = document.activeElement;
    return !activeElement || activeElement === document.body || activeElement === document.documentElement
      || menu.contains(activeElement) || toggle.contains(activeElement);
  }

  toggle.addEventListener('click', () => setMenuState(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenuState(false)));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && shouldHandleEscapeKey()) setMenuState(false);
  });

  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) setMenuState(false);
  });

  const mediaQuery = window.matchMedia('(min-width: 640px)');
  const handleMediaChange = event => {
    if (event.matches) setMenuState(false);
  };
  mediaQuery.addEventListener('change', handleMediaChange);
})();

// Scrollbar
(() => {
  if (isTouch) return;
  const scrollbar = document.querySelector(".scrollbar");
  const thumb = document.querySelector(".scrollbar-thumb");
  if (!scrollbar || !thumb) return;

  let hideTimer;
  let trackHeight = 0;
  let lastScroll = 0;
  let lastLimit = 0;

  function updateTrackHeight() {
    trackHeight = scrollbar.getBoundingClientRect().height;
  }

  function updateThumb(scrollTop, maxScroll) {
    const docHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    if (!trackHeight) updateTrackHeight();

    const thumbHeight = Math.max((viewportHeight / docHeight) * trackHeight, 40);
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

  const handleScroll = (e) => {
    showScrollbar();
    lastScroll = e.scroll;
    lastLimit = e.limit;
    updateThumb(lastScroll, lastLimit);
  };
  const unsubscribeScroll = subscribeToScroll(handleScroll);
  window.addEventListener('pagehide', unsubscribeScroll, { once: true });

  window.addEventListener("resize", () => {
    updateTrackHeight();
    const fallbackLimit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    updateThumb(lastScroll, lastLimit || fallbackLimit);
  });

  updateTrackHeight();
  const initialSnapshot = getNativeScrollSnapshot();
  const initialScroll = hasLenis && Number.isFinite(lenis.scroll) ? lenis.scroll : initialSnapshot.scroll;
  const initialLimit = hasLenis && Number.isFinite(lenis.limit) ? lenis.limit : initialSnapshot.limit;
  updateThumb(initialScroll, initialLimit);
})();

// Grain Overlay
(() => {
  if (isTouch || isReducedMotion || saveDataEnabled || isLowEndDevice || window.innerWidth < 1024) return;
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

// Pause hero ticker animation when offscreen or tab is hidden.
(() => {
  const ticker = document.querySelector('.hero-ticker');
  if (!ticker || typeof IntersectionObserver !== 'function') return;

  let isTickerVisible = true;
  const updateTickerState = () => {
    ticker.classList.toggle('paused', !isTickerVisible || document.hidden);
  };

  const observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    isTickerVisible = entry.isIntersecting;
    updateTickerState();
  }, { threshold: ANIMATION_VISIBILITY_THRESHOLD });

  observer.observe(ticker);
  document.addEventListener('visibilitychange', updateTickerState, { passive: true });
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  updateTickerState();
})();

// Cursor Glow & Desktop Hover Effects
(() => {
  if (isTouch || isReducedMotion || saveDataEnabled || !window.matchMedia('(pointer: fine)').matches) return;

  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  const NO_PENDING_FRAME = null;
  const glowSize = Number.parseFloat(rootStyles.getPropertyValue('--cursor-glow-size'));
  const GLOW_HALF_SIZE = Number.isFinite(glowSize) && glowSize > 0 ? glowSize / 2 : 290;
  let glowAnimationFrameId = NO_PENDING_FRAME;

  const paintGlow = () => {
    glowAnimationFrameId = NO_PENDING_FRAME;
    glow.style.transform = `translate3d(${mouseX - GLOW_HALF_SIZE}px, ${mouseY - GLOW_HALF_SIZE}px, 0)`;
  };

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (glowAnimationFrameId !== NO_PENDING_FRAME) return;
    glowAnimationFrameId = requestAnimationFrame(paintGlow);
  });
  paintGlow();

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

// Scroll Reveal
(() => {
  const simpleReveal = [
    '#about img', '.about-text h2', '.about-text p',
    '#skills h2', '#projects h2', '#contact h2', 
    '.contact-sub', '.contact-grid',
  ];

  simpleReveal.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.classList.add(sel === '#about img' ? 'reveal-left' : 'reveal'));
  });

  ['.skill-card', '.project-card', '.contact-card'].forEach(sel => {
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
  let allowMotion = !prefersReducedMotion.matches;
  let isVisible = true;

  function getGapSize() {
    const styles = window.getComputedStyle(track);
    const flexDirection = styles.flexDirection || 'row';
    const axisGap = flexDirection.startsWith('column') ? styles.rowGap : styles.columnGap;
    const parseGap = (value) => {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    };
    return parseGap(styles.gap) ?? parseGap(axisGap) ?? 0;
  }

  function wrapOffset(value) {
    if (!baseWidth) return value;
    const wrapped = ((value % baseWidth) + baseWidth) % baseWidth;
    return wrapped === 0 ? 0 : wrapped - baseWidth;
  }

  function setOffset(value) {
    offset = wrapOffset(value);
    track.style.transform = `translate3d(${offset}px, 0, 0)`;
  }

  function setupCarousel() {
    const base = track.dataset.carouselBase;
    if (!base) return;

    track.innerHTML = base;
    baseWidth = track.scrollWidth + getGapSize();
    if (!baseWidth) return;

    if (allowMotion) {
      const visibleWidth = carousel.offsetWidth;
      const copies = Math.max(MIN_COPIES, Math.ceil((visibleWidth * VIEWPORT_MULTIPLIER) / baseWidth));
      track.innerHTML = base.repeat(copies);
    }
    track.querySelectorAll('.skill-card').forEach((card) => {
      card.classList.remove('reveal', 'visible');
      card.style.transitionDelay = '';
    });
    setOffset(allowMotion ? offset : 0);
  }

  function tick(time) {
    if (!lastTime) lastTime = time;
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    if (allowMotion && isVisible && !document.hidden && !isPaused && !isDragging && baseWidth) {
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

  function updateMotionState() {
    allowMotion = !prefersReducedMotion.matches;
    carousel.classList.toggle('is-animated', allowMotion);
  }

  function updateCarousel() {
    stopTick();
    updateMotionState();
    setupCarousel();
    if (allowMotion && isVisible && !document.hidden) startTick();
  }

  function handlePointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    isDragging = true;
    startX = e.clientX;
    startOffset = offset;
    carousel.classList.add('is-dragging');
    if (e.pointerType !== 'touch') {
      carousel.setPointerCapture(e.pointerId);
    }
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
    updateCarousel();
  });

  const handleMotionChange = () => {
    lastTime = 0;
    updateCarousel();
  };

  if (typeof prefersReducedMotion.addEventListener === 'function') {
    prefersReducedMotion.addEventListener('change', handleMotionChange);
  } else if (typeof prefersReducedMotion.addListener === 'function') {
    prefersReducedMotion.addListener(handleMotionChange);
  }

  const visibilityObserver = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    isVisible = entry.isIntersecting;
    if (allowMotion && isVisible && !document.hidden) {
      startTick();
    } else {
      stopTick();
    }
  }, { threshold: ANIMATION_VISIBILITY_THRESHOLD });
  visibilityObserver.observe(carousel);

  document.addEventListener('visibilitychange', () => {
    if (allowMotion && isVisible && !document.hidden) {
      startTick();
    } else {
      stopTick();
    }
  }, { passive: true });
  window.addEventListener('pagehide', () => visibilityObserver.disconnect(), { once: true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateCarousel).catch(() => {});
  } else {
    window.addEventListener('load', updateCarousel, { once: true });
  }

  updateCarousel();
})();

// WebMCP — expose portfolio tools to AI agents via the browser
(() => {
  if (!navigator.modelContext) return;

  navigator.modelContext.provideContext({
    tools: [
      {
        name: 'get_portfolio_info',
        description: 'Returns structured information about this portfolio: owner name, title, skills, and key links.',
        inputSchema: { type: 'object', properties: {}, required: [] },
        execute: async () => ({
          name: 'April Anderson P. Vismanos',
          handle: 'cupient',
          title: 'Information Technologies Student',
          institution: 'CCIS-CSU',
          skills: ['HTML', 'CSS', 'JavaScript', 'Lua', 'Python', 'C'],
          url: 'https://cupient.tech/',
          markdown: 'https://cupient.tech/index.md',
          llms_txt: 'https://cupient.tech/llms.txt',
          agent_json: 'https://cupient.tech/agent.json'
        })
      },
      {
        name: 'get_contact_info',
        description: 'Returns contact details and social profiles for the portfolio owner.',
        inputSchema: { type: 'object', properties: {}, required: [] },
        execute: async () => ({
          email: 'andy@cupient.tech',
          github: 'https://github.com/cupient',
          linkedin: 'https://linkedin.com/in/cupient',
          facebook: 'https://facebook.com/cupient'
        })
      }
    ]
  }).catch(err => console.debug('WebMCP initialization failed:', err));
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

  const unsubscribeScroll = subscribeToScroll(requestUpdate);
  window.addEventListener('pagehide', unsubscribeScroll, { once: true });
  window.addEventListener('resize', requestUpdate);
  requestUpdate();
})();
