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
  if (isTouch) return;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
      if (target.id === 'hero') end = 0; 
      else if (target === sections[sections.length - 1]) end = maxScroll; 
      else end = target.getBoundingClientRect().top + window.scrollY - navHeight;
    }

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

      const navHeight = document.querySelector('nav')?.offsetHeight || 0;
      let target = null;

      if (scrollDirection === "down") {
        target = sections.find((sec) => sec.getBoundingClientRect().top > navHeight + 4);
      } else {
        const above = sections.filter((sec) => sec.getBoundingClientRect().top < navHeight - 4);
        target = above[above.length - 1] ?? sections[0];
      }

      if (!target) return;

      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      let targetTop;
      
      if (target.id === 'hero') targetTop = target.getBoundingClientRect().top;
      else if (target === sections[sections.length - 1]) targetTop = maxScroll - window.scrollY; 
      else targetTop = target.getBoundingClientRect().top - navHeight;
        
      if (Math.abs(targetTop) < 5) return;

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
const scrollbar = document.querySelector(".scrollbar");
const thumb = document.querySelector(".scrollbar-thumb");

let hideTimer, ticking = false;

function updateThumb() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight;
  const viewportHeight = window.innerHeight;
  const trackHeight = scrollbar.getBoundingClientRect().height;

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
window.addEventListener("resize", updateThumb);
updateThumb();

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

  // Cursor glow
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

  // Magnetic Buttons
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.16}px, ${y * 0.16 - 2}px)`;
    });
    btn.addEventListener('mouseleave', () => btn.style.transform = '');
  });

  // 3D Tilt
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
    '.contact-sub', '.contact-btn', '.socials',
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
  if (!inner || !inner.scrollWidth) return;

  const gap = parseFloat(window.getComputedStyle(inner).gap) || 18;
  const singleW = inner.scrollWidth + gap; 
  const copies = Math.ceil((window.innerWidth * 2) / singleW) + 2;
  
  inner.innerHTML = inner.innerHTML.repeat(copies);
  inner.style.setProperty('--ticker-offset', `${singleW}px`);
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

  setActive(sections[0].id);

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-35% 0px -45% 0px', threshold: 0 });

  sections.forEach(s => obs.observe(s));
})();