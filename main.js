/* ============================================================
   NAVBAR
   ============================================================ */

(() => {
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.querySelector('.nav-menu');

  if (!toggle || !menu) return;

  function openMenu() {
    menu.classList.add('open');
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    menu.classList.remove('open');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', () => {
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Close when a link is tapped
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  // Close when tapping outside
  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      closeMenu();
    }
  });
})();

/* ============================================================
   SCROLLSNAP
   ============================================================ */

(() => {
  const isTouchDevice =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;

  if (isTouchDevice) return;

  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  let activeAnimation = null;
  let isProgrammaticScroll = false;

  const sections = Array.from(document.querySelectorAll("section"));

  function smoothScrollTo(target, duration = 750) {
    const navHeight = document.querySelector('nav')?.offsetHeight || 0;
    const start = window.scrollY;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    
    let end;
    if (typeof target === "number") {
      end = target;
    } else {
      if (target.id === 'hero') {
        end = 0; // Absolute top
      } else if (target === sections[sections.length - 1]) {
        end = maxScroll; // Absolute bottom for the last section
      } else {
        end = target.getBoundingClientRect().top + window.scrollY - navHeight;
      }
    }

    // Clamp the end value so we never try to scroll past the page bounds
    end = Math.max(0, Math.min(end, maxScroll));
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
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) await smoothScrollTo(target, 900);
    });
  });

  let lastScrollY = window.scrollY;
  let lastScrollEventTime = performance.now();
  let scrollDirection = "down";

  window.addEventListener(
    "scroll",
    () => {
      if (isSnapping || isProgrammaticScroll) return;

      const now = performance.now();
      const dy = window.scrollY - lastScrollY;

      if (dy !== 0) scrollDirection = dy > 0 ? "down" : "up";

      lastScrollY = window.scrollY;
      lastScrollEventTime = now;

      clearTimeout(snapTimer);
      snapTimer = setTimeout(async () => {
        if (performance.now() - lastScrollEventTime < 140) return;
        if (isProgrammaticScroll) return;

        const navHeight = document.querySelector('nav')?.offsetHeight || 0;
        let target = null;

        if (scrollDirection === "down") {
          target = sections.find((sec) => sec.getBoundingClientRect().top > navHeight + 4);
        } else {
          const above = sections.filter(
            (sec) => sec.getBoundingClientRect().top < navHeight - 4
          );
          target = above[above.length - 1] ?? sections[0];
        }

        if (!target) return;

        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        
        // Calculate exact distance to target depending on which section it is
        let targetTop;
        if (target.id === 'hero') {
          targetTop = target.getBoundingClientRect().top;
        } else if (target === sections[sections.length - 1]) {
          targetTop = maxScroll - window.scrollY; 
        } else {
          targetTop = target.getBoundingClientRect().top - navHeight;
        }
          
        const dist = Math.abs(targetTop);
        
        if (dist < 2) return;

        isSnapping = true;
        await smoothScrollTo(target, 550);
        isSnapping = false;
      }, 160);
    },
    { passive: true }
  );
})();

/* ============================================================
   FOOTER
   ============================================================ */

(() => {
  const footer = document.querySelector("footer");
  const contact = document.querySelector("#contact");

  if (!footer || !contact) return;
  if (!("IntersectionObserver" in window)) {
    footer.classList.add("visible");
    return;
  }

  new IntersectionObserver(
    ([entry]) => {
      footer.classList.toggle("visible", entry.isIntersecting);
    },
    { threshold: 1.0 }
  ).observe(contact);
})();

/* ============================================================
   FAKESCROLLBAR
   ============================================================ */

const scrollbar = document.querySelector(".scrollbar");
const thumb = document.querySelector(".scrollbar-thumb");

let hideTimer;
let ticking = false;

function updateThumb() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight;
  const viewportHeight = window.innerHeight;

  const trackHeight = scrollbar.getBoundingClientRect().height;

  const ratio = viewportHeight / docHeight;
  const thumbHeight = Math.max(ratio * trackHeight, 40);

  const maxScroll = docHeight - viewportHeight;
  const maxThumbTravel = trackHeight - thumbHeight;
  const thumbTop = maxScroll > 0 ? (scrollTop / maxScroll) * maxThumbTravel : 0;

  thumb.style.height = `${thumbHeight}px`;
  thumb.style.transform = `translateY(${thumbTop}px)`;
}

function showScrollbar() {
  scrollbar.classList.add("visible");

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    scrollbar.classList.remove("visible");
  }, 700);
}

function onScroll() {
  showScrollbar();

  if (!ticking) {
    requestAnimationFrame(() => {
      updateThumb();
      ticking = false;
    });
    ticking = true;
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", updateThumb);

updateThumb();

/* ============================================================
   GRAIN OVERLAY
   ============================================================ */

(() => {
  const grain = document.createElement('div');
  grain.className = 'grain-overlay';
  document.body.appendChild(grain);

  let scrollPauseTimer;
  window.addEventListener('scroll', () => {
    document.body.classList.add('is-scrolling');
    clearTimeout(scrollPauseTimer);
    scrollPauseTimer = setTimeout(() => {
      document.body.classList.remove('is-scrolling');
    }, 150);
  }, { passive: true });
})();


/* ============================================================
   CURSOR GLOW  (desktop only)
   ============================================================ */

(() => {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) return;

  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  let mouseX = window.innerWidth  / 2;
  let mouseY = window.innerHeight / 2;
  let curX   = mouseX;
  let curY   = mouseY;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  (function loop() {
    curX += (mouseX - curX) * 0.07;
    curY += (mouseY - curY) * 0.07;
    glow.style.left = `${curX}px`;
    glow.style.top  = `${curY}px`;
    requestAnimationFrame(loop);
  })();
})();


/* ============================================================
   PRELOAD ABOUT IMAGE
   ============================================================ */

(() => {
  const aboutImg = document.querySelector('#about img');
  if (!aboutImg) return;
  const src = aboutImg.getAttribute('src');
  if (!src) return;
  const preloader = new Image();
  preloader.decoding = 'async';
  preloader.src = src;

  preloader.decode().then(() => {
    aboutImg.src = src;
  }).catch(() => {/* non-critical */});
})();


/* ============================================================
   SCROLL REVEAL  (IntersectionObserver)
   ============================================================ */

(() => {
  const staggerGroups = ['.skill-card', '.project-card'];

  const simpleReveal = [
    '#about img',
    '.about-text h2',
    '.about-text p',
    '#skills h2',
    '#projects h2',
    '#contact h2',
    '.contact-sub',
    '.contact-btn',
    '.socials',
  ];

  simpleReveal.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.add(sel === '#about img' ? 'reveal-left' : 'reveal');
    });
  });

  staggerGroups.forEach(sel => {
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
  }, {

    threshold: 0.20,
    rootMargin: '0px 0px -48px 0px',
  });

  document.querySelectorAll('.reveal, .reveal-left').forEach(el => {
    observer.observe(el);
  });
})();


/* ============================================================
   MAGNETIC BUTTONS  (desktop only)
   ============================================================ */

(() => {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) return;

  document.querySelectorAll('#hero a, .contact-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width  / 2;
      const y = e.clientY - r.top  - r.height / 2;
      btn.style.transform = `translate(${x * 0.16}px, ${y * 0.16 - 2}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();


/* ============================================================
   3-D TILT  on project cards  (desktop only)
   ============================================================ */

(() => {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) return;

  const MAX_DEG  = 8;    // max rotation in either axis
  const LERP_IN  = 0.10; // how fast it follows the cursor
  const LERP_OUT = 0.07; // how fast it springs back to flat

  document.querySelectorAll('.project-card').forEach(card => {

    let targetX = 0, targetY = 0;

    let curX = 0, curY = 0;
    let hovering = false;
    let rafId = null;

    function tick() {
      const speed = hovering ? LERP_IN : LERP_OUT;
      curX += (targetX - curX) * speed;
      curY += (targetY - curY) * speed;

      const stillMoving = Math.abs(curX) > 0.01 || Math.abs(curY) > 0.01;

      if (stillMoving || hovering) {

        card.style.transition = 'border-color 0.25s, box-shadow 0.25s';
        card.style.transform =
          `perspective(700px) rotateX(${curX}deg) rotateY(${curY}deg) translateZ(${hovering ? 6 : 0}px)`;
        rafId = requestAnimationFrame(tick);
      } else {

        card.style.transition = '';
        card.style.transform = '';
        rafId = null;
      }
    }

    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width  - 0.5; // –0.5 → +0.5
      const ny = (e.clientY - r.top)  / r.height - 0.5;
      targetX = -ny * MAX_DEG; // rotateX: move top edge toward you
      targetY =  nx * MAX_DEG; // rotateY: follow left/right
      if (!hovering) { hovering = true; }
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


(() => {
  const inner = document.querySelector('.hero-ticker-inner');
  if (!inner) return;

  const rawWidth = inner.scrollWidth;
  if (!rawWidth) return;

  const gap = parseFloat(window.getComputedStyle(inner).gap) || 18;
  const singleW = rawWidth + gap; 

  const copies = Math.ceil((window.innerWidth * 2) / singleW) + 2;
  const original = inner.innerHTML;
  inner.innerHTML = original.repeat(copies);

  inner.style.setProperty('--ticker-offset', `${singleW}px`);
})();


/* ============================================================
   ACTIVE NAV LINK  (highlight whichever section is in view)
   ============================================================ */
(() => {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const links    = Array.from(document.querySelectorAll('nav a[href^="#"]'));

  if (!sections.length || !links.length) return;

  function setActive(id) {
    links.forEach(a => {
      const matches = a.getAttribute('href') === `#${id}`;
      a.classList.toggle('active', matches);
    });
  }

  setActive(sections[0].id);

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-35% 0px -45% 0px', threshold: 0 });

  sections.forEach(s => obs.observe(s));
})();