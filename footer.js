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