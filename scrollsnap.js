(() => {
  const isTouchDevice =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;

  if (isTouchDevice) return;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  let activeAnimation = null;
  let isProgrammaticScroll = false;

  function smoothScrollTo(target, duration = 750) {
    const start = window.scrollY;
    const end = typeof target === "number"
      ? target
      : target.getBoundingClientRect().top + window.scrollY;
    const distance = end - start;

    if (Math.abs(distance) < 2) return Promise.resolve();
    if (activeAnimation) cancelAnimationFrame(activeAnimation);

    isProgrammaticScroll = true;

    return new Promise(resolve => {
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

  // --- Anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", async function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) await smoothScrollTo(target, 900);
    });
  });

  // --- Footer visibility ---
  const footer = document.querySelector("footer");
  const contact = document.querySelector("#contact");

  if (footer && contact) {
    new IntersectionObserver(([entry]) => {
      footer.classList.toggle("visible", entry.isIntersecting);
    }, { threshold: 1.0 }).observe(contact);
  }

  // --- Section snapping ---
  const sections = Array.from(document.querySelectorAll("section"));

  let lastScrollY = window.scrollY;
  let lastScrollEventTime = performance.now();
  let scrollDirection = "down";

  window.addEventListener("scroll", () => {
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

      let target = null;

      if (scrollDirection === "down") {
        target = sections.find(sec => sec.getBoundingClientRect().top > 4);
      } else {
        const above = sections.filter(sec => sec.getBoundingClientRect().top < -4);
        target = above[above.length - 1] ?? sections[0];
      }

      if (!target) return;

      const dist = Math.abs(target.getBoundingClientRect().top);
      if (dist < 2) return;

      isSnapping = true;
      await smoothScrollTo(target, 550);
      isSnapping = false;
    }, 160);
  }, { passive: true });
})();
