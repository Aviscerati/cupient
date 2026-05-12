const scrollbar = document.querySelector(".scrollbar");
const thumb = document.querySelector(".scrollbar-thumb");

let hideTimer;
let ticking = false;

function updateThumb() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight;
  const viewportHeight = window.innerHeight;

  const trackHeight = viewportHeight;
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
